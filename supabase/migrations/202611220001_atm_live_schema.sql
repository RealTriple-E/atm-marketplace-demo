-- ATM LIVE / 0001: isolated, RLS-protected Supabase schema.
-- Intended ONLY for a dedicated ATM project. Never apply to Kora Central or Kora Business.
-- Target: PostgreSQL 15+ / Supabase Auth. PostgreSQL generated UUIDs are built in.
begin;

create schema if not exists atm_private;
revoke all on schema atm_private from public, anon, authenticated;

create table if not exists public.atm_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  city text not null default 'Lusaka' check (char_length(city) between 2 and 90),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atm_sellers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 90),
  avatar_url text not null check (avatar_url ~ '^https://[^[:space:]]{5,1000}$'),
  city text not null check (char_length(city) between 2 and 90),
  created_at timestamptz not null default now()
);

create table if not exists public.atm_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.atm_sellers(user_id),
  title text not null check (char_length(title) between 5 and 95),
  description text not null check (char_length(description) between 20 and 1500),
  category text not null check (char_length(category) between 2 and 90),
  subcategory text not null check (char_length(subcategory) between 2 and 90),
  city text not null check (char_length(city) between 2 and 90),
  image_urls text[] not null default '{}'::text[],
  price_amount integer not null check (price_amount between 1 and 1000000),
  deposit_amount integer not null default 0 check (deposit_amount between 0 and 1000000),
  pricing_mode text not null check (pricing_mode in ('fixed','negotiable','auction')),
  offers_allowed boolean not null default false,
  active boolean not null default true,
  request_key uuid not null,
  created_at timestamptz not null default now(),
  constraint atm_listing_mode_consistency check (offers_allowed = (pricing_mode='negotiable')),
  constraint atm_listing_image_count check (coalesce(array_length(image_urls,1),0) between 1 and 10),
  constraint atm_listing_owner_request unique (seller_id,request_key)
);
create index if not exists atm_listings_category_idx on public.atm_listings(category,city,created_at desc) where active;
create index if not exists atm_listings_seller_idx on public.atm_listings(seller_id,created_at desc);

create table if not exists public.atm_auctions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.atm_listings(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  rental_start date not null,
  rental_end date not null,
  starting_bid integer not null check (starting_bid between 1 and 1000000),
  bid_increment integer not null check (bid_increment between 1 and 100000),
  highest_bid integer,
  bid_count integer not null default 0 check (bid_count>=0),
  status text not null default 'live' check (status in ('live','awaiting_payment','paid','closed_no_winner','cancelled')),
  winning_public_bid_id uuid,
  reserve_met boolean,
  created_at timestamptz not null default now(),
  constraint atm_auction_time_range check (ends_at>starts_at),
  constraint atm_auction_rental_range check (rental_end>=rental_start)
);
create index if not exists atm_auctions_open_idx on public.atm_auctions(ends_at) where status='live';

create table if not exists atm_private.atm_reserves (
  auction_id uuid primary key references public.atm_auctions(id) on delete cascade,
  reserve_amount integer not null default 0 check (reserve_amount between 0 and 1000000)
);

create table if not exists atm_private.atm_bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.atm_auctions(id),
  buyer_id uuid not null references auth.users(id),
  request_key uuid not null,
  bidder_alias text not null,
  amount integer not null check (amount between 1 and 1000000),
  created_at timestamptz not null default clock_timestamp(),
  constraint atm_bid_idempotency unique(buyer_id,request_key)
);
create index if not exists atm_bids_ranking_idx on atm_private.atm_bids(auction_id,amount desc,created_at);
create index if not exists atm_bids_buyer_idx on atm_private.atm_bids(buyer_id,created_at desc);

-- Public feed deliberately omits buyer UUIDs, private maximums, email and phone.
create table if not exists public.atm_bid_feed (
  bid_id uuid primary key references atm_private.atm_bids(id),
  auction_id uuid not null references public.atm_auctions(id),
  bidder_alias text not null,
  amount integer not null,
  created_at timestamptz not null
);
create index if not exists atm_bid_feed_idx on public.atm_bid_feed(auction_id,amount desc,created_at);

create table if not exists public.atm_perks (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.atm_auctions(id) on delete cascade,
  threshold_amount integer not null check (threshold_amount between 1 and 1000000),
  label text not null check (char_length(label) between 3 and 90)
);
create index if not exists atm_perks_auction_idx on public.atm_perks(auction_id,threshold_amount);

create table if not exists public.atm_watches (
  user_id uuid not null references auth.users(id) on delete cascade,
  auction_id uuid not null references public.atm_auctions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,auction_id)
);

create table if not exists public.atm_bookings (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null unique references public.atm_auctions(id),
  listing_id uuid not null references public.atm_listings(id),
  buyer_id uuid not null references auth.users(id),
  seller_id uuid not null references auth.users(id),
  winning_amount integer not null check (winning_amount>=1),
  deposit_amount integer not null check (deposit_amount>=0),
  total_amount integer not null check (total_amount=winning_amount+deposit_amount),
  rental_start date not null,
  rental_end date not null,
  rewards_snapshot jsonb not null default '[]'::jsonb,
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment','paid','cancelled')),
  payment_reference text unique,
  payment_deadline timestamptz not null default (now()+interval '48 hours'),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists atm_bookings_buyer_idx on public.atm_bookings(buyer_id,created_at desc);
create index if not exists atm_bookings_seller_idx on public.atm_bookings(seller_id,created_at desc);

create table if not exists atm_private.atm_payment_events (
  provider text not null,
  provider_event_id text not null,
  booking_id uuid not null references public.atm_bookings(id),
  received_amount integer not null check (received_amount>0),
  recorded_at timestamptz not null default clock_timestamp(),
  primary key(provider,provider_event_id)
);

create table if not exists public.atm_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.atm_bookings(id),
  sender_id uuid not null references auth.users(id),
  body text not null check(char_length(body) between 1 and 1500),
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists atm_messages_booking_idx on public.atm_messages(booking_id,created_at);

create table if not exists public.atm_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.atm_listings(id),
  buyer_id uuid not null references auth.users(id),
  offered_amount integer not null check (offered_amount between 1 and 1000000),
  counter_amount integer check (counter_amount between 1 and 1000000),
  status text not null default 'pending' check (status in ('pending','countered','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists atm_offers_buyer_idx on public.atm_offers(buyer_id,created_at desc);
create index if not exists atm_offers_listing_idx on public.atm_offers(listing_id,created_at desc);

alter table public.atm_profiles enable row level security;
alter table public.atm_sellers enable row level security;
alter table public.atm_listings enable row level security;
alter table public.atm_auctions enable row level security;
alter table public.atm_bid_feed enable row level security;
alter table public.atm_perks enable row level security;
alter table public.atm_watches enable row level security;
alter table public.atm_bookings enable row level security;
alter table public.atm_messages enable row level security;
alter table public.atm_offers enable row level security;
alter table atm_private.atm_reserves enable row level security;
alter table atm_private.atm_bids enable row level security;
alter table atm_private.atm_payment_events enable row level security;

-- Supabase 2026 Data API exposure requires explicit privileges in addition to RLS.
revoke all on public.atm_profiles, public.atm_sellers, public.atm_listings,
  public.atm_auctions, public.atm_bid_feed, public.atm_perks,
  public.atm_watches, public.atm_bookings, public.atm_messages, public.atm_offers
  from public, anon, authenticated;
grant select on public.atm_sellers, public.atm_listings, public.atm_auctions,
  public.atm_bid_feed, public.atm_perks to anon, authenticated;
grant select on public.atm_profiles, public.atm_watches, public.atm_bookings,
  public.atm_messages, public.atm_offers to authenticated;
grant insert(user_id,display_name,city) on public.atm_profiles to authenticated;
grant update(display_name,city) on public.atm_profiles to authenticated;
grant insert(user_id,business_name,avatar_url,city) on public.atm_sellers to authenticated;
grant update(business_name,avatar_url,city) on public.atm_sellers to authenticated;
grant insert(user_id,auction_id) on public.atm_watches to authenticated;
grant delete on public.atm_watches to authenticated;
grant insert(booking_id,sender_id,body) on public.atm_messages to authenticated;

create policy atm_profiles_self_read on public.atm_profiles for select to authenticated
  using ((select auth.uid())=user_id);
create policy atm_profiles_self_create on public.atm_profiles for insert to authenticated
  with check ((select auth.uid())=user_id);
create policy atm_profiles_self_update on public.atm_profiles for update to authenticated
  using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create policy atm_sellers_public_read on public.atm_sellers for select to anon,authenticated using (true);
create policy atm_sellers_self_create on public.atm_sellers for insert to authenticated
  with check ((select auth.uid())=user_id);
create policy atm_sellers_self_update on public.atm_sellers for update to authenticated
  using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create policy atm_listings_read on public.atm_listings for select to anon,authenticated
  using (active or seller_id=(select auth.uid()));
create policy atm_auctions_read on public.atm_auctions for select to anon,authenticated
  using (exists(select 1 from public.atm_listings l where l.id=listing_id and (l.active or l.seller_id=(select auth.uid()))));
create policy atm_feed_read on public.atm_bid_feed for select to anon,authenticated
  using (exists(select 1 from public.atm_auctions a join public.atm_listings l on a.listing_id=l.id
        where a.id=auction_id and (l.active or l.seller_id=(select auth.uid()))));
create policy atm_perks_read on public.atm_perks for select to anon,authenticated
  using (exists(select 1 from public.atm_auctions a join public.atm_listings l on a.listing_id=l.id
        where a.id=auction_id and (l.active or l.seller_id=(select auth.uid()))));

create policy atm_watches_self_read on public.atm_watches for select to authenticated
  using ((select auth.uid())=user_id);
create policy atm_watches_self_add on public.atm_watches for insert to authenticated
  with check ((select auth.uid())=user_id);
create policy atm_watches_self_delete on public.atm_watches for delete to authenticated
  using ((select auth.uid())=user_id);

create policy atm_bookings_participants_read on public.atm_bookings for select to authenticated
  using ((select auth.uid())=buyer_id or (select auth.uid())=seller_id);
create policy atm_offers_participants_read on public.atm_offers for select to authenticated
  using (buyer_id=(select auth.uid()) or exists(
    select 1 from public.atm_listings l where l.id=listing_id and l.seller_id=(select auth.uid())
  ));

-- Both message READ and WRITE are server-payment-gated, not localStorage-gated.
create policy atm_paid_messages_read on public.atm_messages for select to authenticated
  using (exists(select 1 from public.atm_bookings b
    where b.id=booking_id and b.status='paid'
      and ((select auth.uid())=b.buyer_id or (select auth.uid())=b.seller_id)));
create policy atm_paid_messages_write on public.atm_messages for insert to authenticated
  with check (sender_id=(select auth.uid()) and exists(select 1 from public.atm_bookings b
    where b.id=booking_id and b.status='paid'
      and ((select auth.uid())=b.buyer_id or (select auth.uid())=b.seller_id)));

-- Realtime Postgres Changes: publish only public projections, never private bids or payments.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
      and schemaname='public' and tablename='atm_auctions') then
      alter publication supabase_realtime add table public.atm_auctions;
    end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
      and schemaname='public' and tablename='atm_bid_feed') then
      alter publication supabase_realtime add table public.atm_bid_feed;
    end if;
  end if;
end;
$$;

commit;
