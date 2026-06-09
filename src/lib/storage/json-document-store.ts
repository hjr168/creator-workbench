import { readFile, writeFile } from "node:fs/promises";
import type { Pool } from "pg";
import pg from "pg";

let pool: Pool | undefined;

function getDatabaseUrl() {
  return process.env.DATABASE_URL?.trim();
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
