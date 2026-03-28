-- Promo codes table
create table promo_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  description text default '',
  grant_days  int not null default 90,
  is_single_use boolean not null default true,
  max_uses    int default null,
  times_used  int not null default 0,
  is_active   boolean not null default true,
  expires_at  timestamptz default null,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- Redemption log
create table promo_redemptions (
  id          uuid primary key default gen_random_uuid(),
  code_id     uuid not null references promo_codes(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz default now(),
  unique (code_id, user_id)
);

-- RLS
alter table promo_codes enable row level security;
alter table promo_redemptions enable row level security;

-- Admin can manage all promo codes
create policy "Admin manages promo codes"
  on promo_codes for all
  using (auth.jwt() ->> 'email' = 'jeratomise@gmail.com');

-- Users can read active promo codes (needed for validation)
create policy "Users can read active codes"
  on promo_codes for select
  using (is_active = true);

-- Users can increment times_used when redeeming
create policy "Users can update usage count"
  on promo_codes for update
  using (is_active = true)
  with check (is_active = true);

-- Admin can read all redemptions
create policy "Admin reads all redemptions"
  on promo_redemptions for all
  using (auth.jwt() ->> 'email' = 'jeratomise@gmail.com');

-- Users can read their own redemptions
create policy "Users manage own redemptions"
  on promo_redemptions for select
  using (auth.uid() = user_id);

-- Users can redeem codes
create policy "Users can redeem codes"
  on promo_redemptions for insert
  with check (auth.uid() = user_id);

-- Indexes
create index idx_promo_codes_code on promo_codes(code);
create index idx_promo_codes_active on promo_codes(is_active);
create index idx_promo_redemptions_user on promo_redemptions(user_id);
create index idx_promo_redemptions_code on promo_redemptions(code_id);
