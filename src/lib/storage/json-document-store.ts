import { readFile, writeFile } from "node:fs/promises";
import type { Pool } from "pg";
import pg from "pg";

let pool: Pool | undefined;

function getDatabaseUrl() {
  return process.env.DATABASE_URL?.trim();
}

/** 生产环境（NODE_ENV=production）且未配置 DATABASE_URL 时为 true。
 *  此状态下禁止任何写操作，避免 serverless 环境下写本地文件不稳定/丢失。 */
function isProductionWithoutDatabase() {
  return process.env.NODE_ENV === "production" && !getDatabaseUrl();
}

function getPool() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return undefined;

  pool ??= new pg.Pool({
    connectionString: databaseUrl,
    max: 5,
  });

  return pool;
}

async function ensureJsonDocumentTable(db: Pool) {
  await db.query(`
    create table if not exists app_json_documents (
      key text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
}

export async function readJsonDocument<T>(key: string, filePath: string, fallback?: T): Promise<T> {
  const db = getPool();
  if (!db) {
    // 无数据库：只读本地文件或 fallback，绝不在 read 中触发 write。
    try {
      const raw = await readFile(filePath, "utf-8");
      return JSON.parse(raw) as T;
    } catch (error) {
      if (fallback !== undefined) return fallback;
      throw error;
    }
  }

  await ensureJsonDocumentTable(db);
  const result = await db.query<{ data: T }>("select data from app_json_documents where key = $1", [key]);
  if (result.rows[0]) return result.rows[0].data;

  // db 存在但记录为空：用本地 fallback 文件初始化到数据库。
  // 注意：此处 db 一定存在（上面已 return 无 db 的分支），所以 writeJsonDocument 写的是数据库，不是本地文件。
  try {
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as T;
    await writeJsonDocument(key, filePath, data);
    return data;
  } catch (error) {
    if (fallback !== undefined) {
      await writeJsonDocument(key, filePath, fallback);
      return fallback;
    }
    throw error;
  }
}

export async function writeJsonDocument<T>(key: string, filePath: string, data: T) {
  // P0 安全补漏：生产环境无 DATABASE_URL 时禁止写本地 JSON。
  // 避免在 Vercel / serverless 等只读文件系统环境下静默丢失数据，或写入不稳定。
  if (isProductionWithoutDatabase()) {
    throw new Error(
      "DATABASE_URL is required in production for write operations. " +
        "Configure DATABASE_URL, or run in development to use local JSON.",
    );
  }

  const db = getPool();
  if (!db) {
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
    return;
  }

  await ensureJsonDocumentTable(db);
  await db.query(
    `
      insert into app_json_documents (key, data, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (key)
      do update set data = excluded.data, updated_at = now()
    `,
    [key, JSON.stringify(data)],
  );
}
