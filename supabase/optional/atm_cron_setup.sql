-- OPTIONAL for a dedicated ATM Supabase project, after core migrations.
-- Supabase Cron (pg_cron) provides automatic settlement even with no browser open.
-- This file must never be applied to Kora projects.

create or replace function atm_private.atm_settle_due()
returns integer
language plpgsql security definer set search_path=''
as $$
declare
 v_auction public.atm_auctions%rowtype;
 v_bid atm_private.atm_bids%rowtype;
 v_reserve integer;
 v_seller uuid;
 v_deposit integer;
 v_rewards jsonb;
 v_count integer:=0;
begin
 for v_auction in
   select a.* from public.atm_auctions a
   where a.status='live' and a.ends_at<=clock_timestamp()
   order by a.ends_at limit 100 for update skip locked
 loop
   select b.* into v_bid from atm_private.atm_bids b
   where b.auction_id=v_auction.id
   order by b.amount desc,b.created_at asc limit 1;
   select reserve_amount into v_reserve from atm_private.atm_reserves
   where auction_id=v_auction.id;
   if v_bid.id is null or v_bid.amount<coalesce(v_reserve,0) then
     update public.atm_auctions set status='closed_no_winner',reserve_met=false
     where id=v_auction.id;
   else
     select seller_id,deposit_amount into v_seller,v_deposit
       from public.atm_listings where id=v_auction.listing_id;
     select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
         'at',threshold_amount,'label',label) order by threshold_amount),'[]'::jsonb)
       into v_rewards from public.atm_perks
       where auction_id=v_auction.id and threshold_amount<=v_bid.amount;
     insert into public.atm_bookings
       (auction_id,listing_id,buyer_id,seller_id,winning_amount,deposit_amount,total_amount,
        rental_start,rental_end,rewards_snapshot)
     values(v_auction.id,v_auction.listing_id,v_bid.buyer_id,v_seller,
       v_bid.amount,v_deposit,v_bid.amount+v_deposit,
       v_auction.rental_start,v_auction.rental_end,v_rewards)
     on conflict(auction_id) do nothing;
     update public.atm_auctions set status='awaiting_payment',
       winning_public_bid_id=v_bid.id,reserve_met=true where id=v_auction.id;
   end if;
   v_count:=v_count+1;
 end loop;
 return v_count;
end;
$$;

revoke all on function atm_private.atm_settle_due() from public,anon,authenticated;

-- Enable the Supabase Cron extension in the dedicated ATM project first:
-- CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
-- Then run exactly one recurring scheduler job:
-- SELECT cron.schedule(
--   'atm-live-settle-due',
--   '* * * * *',
--   'SELECT atm_private.atm_settle_due();'
-- );
-- If this project is later retired:
-- SELECT cron.unschedule('atm-live-settle-due');
-- Note: PostgreSQL cron jobs execute using the job owner's privileges.

-- Lifecycle migration 0003 additionally installs atm_private.atm_expire_unpaid().
-- Run this second job ONLY after migration 0003 is installed in the dedicated ATM
-- project. Expiration rejects late payment callbacks and prevents abandoned
-- awaiting_payment records from accumulating indefinitely.
--
-- SELECT cron.schedule(
--   'atm-live-expire-unpaid',
--   '* * * * *',
--   'SELECT atm_private.atm_expire_unpaid();'
-- );
--
-- Remove both jobs when decommissioning ATM:
-- SELECT cron.unschedule('atm-live-settle-due');
-- SELECT cron.unschedule('atm-live-expire-unpaid');
--
-- Expired winners are cancelled, NOT automatically reassigned to a losing bidder.
-- Any future runner-up offers will need a separate explicit opt-in flow.
