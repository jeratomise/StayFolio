-- Create campaign_selections table for syncing user campaign brand selections across devices
create table campaign_selections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  campaign_id text not null,
  brand_ids   text[] not null default '{}',
  updated_at  timestamptz default now(),
  unique (user_id, campaign_id)
);

-- Enable Row Level Security
alter table campaign_selections enable row level security;

-- Create policy: Users can only manage their own selections
create policy "Users manage own selections"
  on campaign_selections
  for all using (auth.uid() = user_id);

-- Create index for faster lookups
create index idx_campaign_selections_user_id on campaign_selections(user_id);
create index idx_campaign_selections_campaign_id on campaign_selections(campaign_id);
