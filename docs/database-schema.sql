-- 今日可写 MVP schema
-- 当前实现使用 src/data/topic-radar.json 本地持久化；这份 schema 用于后续迁移到 SQLite/Postgres。

create table source_items (
  id text primary key,
  provider text not null check (provider in ('aihot', 'rss', 'manual')),
  provider_item_id text not null,
  title text not null,
  url text not null,
  source_name text not null,
  published_at timestamptz not null,
  summary text,
  category text,
  raw_json jsonb not null,
  content_hash text not null,
  first_seen_at timestamptz not null,
  updated_at timestamptz not null
);

create unique index source_items_provider_item_uidx on source_items (provider, provider_item_id);
create unique index source_items_url_uidx on source_items (url);
create unique index source_items_hash_uidx on source_items (content_hash);
create index source_items_published_idx on source_items (published_at desc);

create table hkr_scores (
  id text primary key,
  source_item_id text not null references source_items(id) on delete cascade,
  h integer not null check (h between 0 and 100),
  k integer not null check (k between 0 and 100),
  r integer not null check (r between 0 and 100),
  total integer not null check (total between 0 and 100),
  level text not null,
  reasons_json jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create unique index hkr_scores_source_item_uidx on hkr_scores (source_item_id);
create index hkr_scores_total_idx on hkr_scores (total desc);

create table topic_cards (
  id text primary key,
  source_item_id text not null references source_items(id) on delete cascade,
  title text not null,
  one_line_summary text not null,
  why_worth_writing text not null,
  recommended_titles_json jsonb not null,
  writing_angles_json jsonb not null,
  outline_json jsonb not null,
  suitable_accounts_json jsonb not null,
  difficulty text not null,
  facts_to_verify_json jsonb not null,
  extendable_views_json jsonb not null,
  risks_json jsonb not null,
  recommended_approach text not null,
  generated_by text not null check (generated_by in ('heuristic', 'llm')),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create unique index topic_cards_source_item_uidx on topic_cards (source_item_id);

create table fetch_logs (
  id text primary key,
  provider text not null,
  mode text not null,
  params_json jsonb not null,
  status text not null check (status in ('success', 'failed')),
  fetched_count integer not null default 0,
  inserted_count integer not null default 0,
  deduped_count integer not null default 0,
  error text,
  started_at timestamptz not null,
  finished_at timestamptz not null
);

create table daily_reports (
  id text primary key,
  report_date date not null unique,
  markdown text not null,
  item_ids_json jsonb not null,
  created_at timestamptz not null
);
