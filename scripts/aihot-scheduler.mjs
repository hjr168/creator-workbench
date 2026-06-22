#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const DEFAULT_SCHEDULE_TIMES = "09:00,18:00";
const DEFAULT_TIME_ZONE = "Asia/Shanghai";
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1_000;
const DEFAULT_LIMIT = 30;

export function parseScheduleTimes(value = DEFAULT_SCHEDULE_TIMES) {
  const entries = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    throw new Error("At least one schedule time is required");
  }

  const uniqueTimes = new Map();
  for (const entry of entries) {
    const match = /^(\d{2}):(\d{2})$/.exec(entry);
    const hour = match ? Number(match[1]) : Number.NaN;
    const minute = match ? Number(match[2]) : Number.NaN;
    if (!match || hour > 23 || minute > 59) {
      throw new Error(`Invalid schedule time: ${entry}`);
    }
    uniqueTimes.set(`${hour}:${minute}`, { hour, minute });
  }

  return [...uniqueTimes.values()].sort(
    (left, right) => left.hour * 60 + left.minute - (right.hour * 60 + right.minute),
  );
}

export function getNextScheduledAt(now, scheduleTimes, timeZone = DEFAULT_TIME_ZONE) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error("A valid current date is required");
  }
  if (!Array.isArray(scheduleTimes) || scheduleTimes.length === 0) {
    throw new Error("At least one parsed schedule time is required");
  }

  const formatter = createTimeFormatter(timeZone);
  const targetMinutes = new Set(scheduleTimes.map(({ hour, minute }) => hour * 60 + minute));
  const candidate = new Date(now.getTime());
  candidate.setUTCSeconds(0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  // Three days comfortably spans DST transitions for time zones that observe them.
  for (let offset = 0; offset < 72 * 60; offset += 1) {
    const { hour, minute } = getWallClockTime(candidate, formatter);
    if (targetMinutes.has(hour * 60 + minute)) {
      return new Date(candidate.getTime());
    }
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error(`Unable to find the next run time in time zone ${timeZone}`);
}

export async function triggerAIHotFetch({
  url,
  secret,
  limit = DEFAULT_LIMIT,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = globalThis.fetch,
}) {
  if (!secret?.trim()) {
    throw new Error("TOPIC_RADAR_JOB_SECRET is not configured");
  }
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required");
  }

  const normalizedLimit = parsePositiveInteger(limit, "AIHOT_SCHEDULE_LIMIT");
  const normalizedTimeout = parsePositiveInteger(timeoutMs, "AIHOT_JOB_TIMEOUT_MS");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), normalizedTimeout);

  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-job-secret": secret.trim(),
      },
      body: JSON.stringify({ mode: "selected", limit: normalizedLimit }),
      signal: controller.signal,
    });
    const responseText = await response.text();
    const payload = parseResponsePayload(responseText);

    if (!response.ok) {
      const detail = payload?.error ?? response.statusText ?? responseText.slice(0, 200);
      throw new Error(`AIHOT job HTTP ${response.status}: ${detail || "request failed"}`);
    }
    if (!payload || typeof payload !== "object") {
      throw new Error("AIHOT job returned an invalid JSON response");
    }
    if (payload.status !== "success") {
      throw new Error(`AIHOT fetch failed: ${payload.error ?? "unknown error"}`);
    }

    return payload;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`AIHOT job timed out after ${normalizedTimeout}ms`, { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function readSchedulerConfig(env = process.env) {
  const port = env.PORT?.trim() || "3000";
  return {
    scheduleTimes: parseScheduleTimes(env.AIHOT_SCHEDULE_TIMES || DEFAULT_SCHEDULE_TIMES),
    timeZone: env.AIHOT_SCHEDULE_TIME_ZONE?.trim() || DEFAULT_TIME_ZONE,
    url:
      env.AIHOT_JOB_URL?.trim() ||
      `http://127.0.0.1:${port}/api/jobs/fetch-aihot`,
    secret: env.TOPIC_RADAR_JOB_SECRET?.trim() || "",
    timeoutMs: parsePositiveInteger(
      env.AIHOT_JOB_TIMEOUT_MS || DEFAULT_TIMEOUT_MS,
      "AIHOT_JOB_TIMEOUT_MS",
    ),
    limit: parsePositiveInteger(
      env.AIHOT_SCHEDULE_LIMIT || DEFAULT_LIMIT,
      "AIHOT_SCHEDULE_LIMIT",
    ),
  };
}

export function startAIHotScheduler({
  env = process.env,
  logger = console,
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
} = {}) {
  const config = readSchedulerConfig(env);
  let stopped = false;
  let timer;

  if (!config.secret) {
    logger.warn(
      "[aihot-scheduler] TOPIC_RADAR_JOB_SECRET is not configured; scheduled requests will fail until it is set.",
    );
  }

  const scheduleNext = () => {
    if (stopped) return;

    const current = now();
    const nextRun = getNextScheduledAt(current, config.scheduleTimes, config.timeZone);
    const delay = Math.max(0, nextRun.getTime() - current.getTime());
    logger.log(
      `[aihot-scheduler] next run: ${formatInTimeZone(nextRun, config.timeZone)} (${config.timeZone})`,
    );

    timer = setTimer(async () => {
      try {
        logger.log(`[aihot-scheduler] starting scheduled fetch at ${new Date().toISOString()}`);
        const result = await triggerAIHotFetch({
          url: config.url,
          secret: config.secret,
          limit: config.limit,
          timeoutMs: config.timeoutMs,
          fetchImpl,
        });
        logger.log(
          `[aihot-scheduler] fetch succeeded: fetched=${result.fetchedCount ?? 0}, inserted=${result.insertedCount ?? 0}, deduped=${result.dedupedCount ?? 0}`,
        );
      } catch (error) {
        logger.error(
          `[aihot-scheduler] fetch failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        scheduleNext();
      }
    }, delay);
  };

  scheduleNext();

  return () => {
    stopped = true;
    if (timer !== undefined) clearTimer(timer);
  };
}

function createTimeFormatter(timeZone) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch (error) {
    throw new Error(`Invalid AIHOT_SCHEDULE_TIME_ZONE: ${timeZone}`, { cause: error });
  }
}

function getWallClockTime(date, formatter) {
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type === "hour" || part.type === "minute")
      .map((part) => [part.type, Number(part.value)]),
  );
  return { hour: parts.hour, minute: parts.minute };
}

function formatInTimeZone(date, timeZone) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function parsePositiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function parseResponsePayload(responseText) {
  if (!responseText) return undefined;
  try {
    return JSON.parse(responseText);
  } catch {
    return undefined;
  }
}

async function main() {
  const config = readSchedulerConfig();

  if (process.argv.includes("--show-next")) {
    const nextRun = getNextScheduledAt(new Date(), config.scheduleTimes, config.timeZone);
    console.log(
      `[aihot-scheduler] next run: ${formatInTimeZone(nextRun, config.timeZone)} (${config.timeZone})`,
    );
    return;
  }

  if (process.argv.includes("--run-once")) {
    const result = await triggerAIHotFetch({
      url: config.url,
      secret: config.secret,
      limit: config.limit,
      timeoutMs: config.timeoutMs,
    });
    console.log(
      `[aihot-scheduler] fetch succeeded: fetched=${result.fetchedCount ?? 0}, inserted=${result.insertedCount ?? 0}, deduped=${result.dedupedCount ?? 0}`,
    );
    return;
  }

  const stop = startAIHotScheduler();
  const shutdown = (signal) => {
    console.log(`[aihot-scheduler] received ${signal}; stopping scheduler`);
    stop();
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((error) => {
    console.error(
      `[aihot-scheduler] fatal error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  });
}
