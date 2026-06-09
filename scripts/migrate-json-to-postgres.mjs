#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const documents = [
  { key: "workbench", file: "src/data/workbench.json" },
  { key: "topic_radar", file: "src/data/topic-radar.json" },
];

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.log("DATABASE_URL is not set. Skipping PostgreSQL migration.");
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 2 });

try {
  await pool.query(`
    create table if not exists app_json_documents (
      key text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);

  for (const document of documents) {
    const existing = await pool.query("select 1 from app_json_documents where key = $1", [document.key]);
    if (existing.rowCount) {
      console.log(`Keeping existing PostgreSQL document: ${document.key}`);
      continue;
    }

    const filePath = path.join(process.cwd(), document.file);
    const raw = await readFile(filePath, "utf-8");
    JSON.parse(raw);

    await pool.query(
      `
        insert into app_json_documents (key, data, updated_at)
        values ($1, $2::jsonb, now())
      `,
      [document.key, raw],
    );
    console.log(`Imported ${document.file} as ${document.key}`);
  }
} finally {
  await pool.end();
}
