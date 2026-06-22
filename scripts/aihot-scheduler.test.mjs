import assert from "node:assert/strict";
import test from "node:test";

import {
  getNextScheduledAt,
  parseScheduleTimes,
  startAIHotScheduler,
  triggerAIHotFetch,
} from "./aihot-scheduler.mjs";

test("parseScheduleTimes sorts and deduplicates valid times", () => {
  assert.deepEqual(parseScheduleTimes("18:00, 09:00,18:00"), [
    { hour: 9, minute: 0 },
    { hour: 18, minute: 0 },
  ]);
});

test("parseScheduleTimes rejects malformed or out-of-range times", () => {
  assert.throws(() => parseScheduleTimes("09:00,24:00"), /Invalid schedule time: 24:00/);
  assert.throws(() => parseScheduleTimes(""), /At least one schedule time is required/);
});

test("getNextScheduledAt finds the next Asia\/Shanghai morning and evening slots", () => {
  const schedule = parseScheduleTimes("09:00,18:00");

  assert.equal(
    getNextScheduledAt(new Date("2026-06-22T00:30:00.000Z"), schedule, "Asia/Shanghai").toISOString(),
    "2026-06-22T01:00:00.000Z",
  );
  assert.equal(
    getNextScheduledAt(new Date("2026-06-22T01:00:10.000Z"), schedule, "Asia/Shanghai").toISOString(),
    "2026-06-22T10:00:00.000Z",
  );
  assert.equal(
    getNextScheduledAt(new Date("2026-06-22T10:00:10.000Z"), schedule, "Asia/Shanghai").toISOString(),
    "2026-06-23T01:00:00.000Z",
  );
});

test("triggerAIHotFetch sends the protected request and returns the fetch log", async () => {
  const result = await triggerAIHotFetch({
    url: "http://127.0.0.1:3000/api/jobs/fetch-aihot",
    secret: "test-secret",
    limit: 12,
    timeoutMs: 1_000,
    fetchImpl: async (url, init) => {
      assert.equal(url, "http://127.0.0.1:3000/api/jobs/fetch-aihot");
      assert.equal(init.method, "POST");
      assert.equal(init.headers["x-job-secret"], "test-secret");
      assert.deepEqual(JSON.parse(init.body), { mode: "selected", limit: 12 });
      return new Response(
        JSON.stringify({
          id: "fetch-1",
          status: "success",
          fetchedCount: 12,
          insertedCount: 7,
          dedupedCount: 5,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  assert.equal(result.status, "success");
  assert.equal(result.insertedCount, 7);
});

test("triggerAIHotFetch rejects HTTP failures without exposing the secret", async () => {
  await assert.rejects(
    triggerAIHotFetch({
      url: "http://127.0.0.1:3000/api/jobs/fetch-aihot",
      secret: "do-not-log-me",
      timeoutMs: 1_000,
      fetchImpl: async () => new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }),
    }),
    (error) => {
      assert.match(error.message, /HTTP 401: unauthorized/);
      assert.doesNotMatch(error.message, /do-not-log-me/);
      return true;
    },
  );
});

test("triggerAIHotFetch rejects a failed business log", async () => {
  await assert.rejects(
    triggerAIHotFetch({
      url: "http://127.0.0.1:3000/api/jobs/fetch-aihot",
      secret: "test-secret",
      timeoutMs: 1_000,
      fetchImpl: async () =>
        new Response(JSON.stringify({ status: "failed", error: "upstream timeout" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    }),
    /AIHOT fetch failed: upstream timeout/,
  );
});

test("startAIHotScheduler waits for a fetch to finish before scheduling the next run", async () => {
  let current = new Date("2026-06-22T00:30:00.000Z");
  let resolveFetch;
  const timers = [];
  const logs = [];

  const stop = startAIHotScheduler({
    env: {
      AIHOT_SCHEDULE_TIMES: "09:00,18:00",
      AIHOT_SCHEDULE_TIME_ZONE: "Asia/Shanghai",
      AIHOT_JOB_URL: "http://127.0.0.1:3000/api/jobs/fetch-aihot",
      AIHOT_JOB_TIMEOUT_MS: "1000",
      AIHOT_SCHEDULE_LIMIT: "30",
      TOPIC_RADAR_JOB_SECRET: "test-secret",
    },
    now: () => current,
    setTimer: (callback, delay) => {
      timers.push({ callback, delay });
      return timers.length;
    },
    clearTimer: () => {},
    logger: {
      log: (message) => logs.push(message),
      warn: (message) => logs.push(message),
      error: (message) => logs.push(message),
    },
    fetchImpl: async () =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
  });

  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 30 * 60 * 1_000);

  current = new Date("2026-06-22T01:00:01.000Z");
  const firstRun = timers[0].callback();
  await Promise.resolve();
  assert.equal(timers.length, 1, "must not schedule another timer while the fetch is running");

  resolveFetch(
    new Response(
      JSON.stringify({
        status: "success",
        fetchedCount: 30,
        insertedCount: 20,
        dedupedCount: 10,
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  );
  await firstRun;

  assert.equal(timers.length, 2);
  assert.equal(timers[1].delay, 9 * 60 * 60 * 1_000 - 1_000);
  assert.ok(logs.some((message) => message.includes("fetch succeeded")));
  stop();
});
