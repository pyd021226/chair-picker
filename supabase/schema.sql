-- ============================================================
-- 工学椅智能匹配 — Supabase 数据库 Schema
-- 在 Supabase 的 SQL Editor 里执行本文件
-- ============================================================

-- 1. 自定义椅子（后台录入的新椅子）
create table if not exists custom_chairs (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- 2. 内置椅子的覆盖数据（后台修改内置椅子）
create table if not exists chair_overrides (
  chair_id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- 3. 公式配置 + 匹配规则（单行）
create table if not exists app_config (
  id int primary key default 1,
  formula_config jsonb not null default '{}'::jsonb,
  match_rules jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 4. 使用记录（用户表单提交）
create table if not exists usage_records (
  id bigint generated always as identity primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- ============ 行级安全策略 ============
-- 开启 RLS
alter table custom_chairs enable row level security;
alter table chair_overrides enable row level security;
alter table app_config enable row level security;
alter table usage_records enable row level security;

-- 读取：所有人（匿名 + 登录）都能读椅子、覆盖、配置
create policy "public read custom_chairs" on custom_chairs for select using (true);
create policy "public read chair_overrides" on chair_overrides for select using (true);
create policy "public read app_config" on app_config for select using (true);

-- 写入：只有登录用户（后台管理员）能写椅子、覆盖、配置
create policy "auth write custom_chairs" on custom_chairs
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth write chair_overrides" on chair_overrides
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth write app_config" on app_config
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 使用记录：任何人可写入（用户提交），只有登录用户能读（后台看统计）
create policy "public insert usage" on usage_records for insert with check (true);
create policy "auth read usage" on usage_records for select using (auth.role() = 'authenticated');
create policy "auth delete usage" on usage_records for delete using (auth.role() = 'authenticated');
