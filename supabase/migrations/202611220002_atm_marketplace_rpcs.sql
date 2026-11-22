-- ATM LIVE / 0002: transactional marketplace RPCs.
-- Privileged routines use fixed search_path and verify auth.uid() and ownership.
-- All direct browser writes to listings, auctions, bids, bookings and payments are revoked.
begin;

create or replace function public.atm_create_listing(
  p_title text, p_description text, p_category text, p_subcategory text, p_city text,
  p_image_urls text[], p_price_amount integer, p_deposit_amount integer,
  p_pricing_mode text, p_request_key uuid,
  p_starting_bid integer default null, p_bid_increment integer default null,
  p_reserve_amount integer default 0, p_duration_hours integer default null,
  p_rental_start date default null, p_rental_end date default null,
  p_rewards jsonb default '[]'::jsonb
)
returns uuid
language plpgsql security definer set search_path=''
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_auction uuid;
  v_reward jsonb;
  v_amount integer;
  v_label text;
  v_now timestamptz := clock_timestamp();
  v_end timestamptz;
begin
  if v_user is null then raise exception 'Sign in to create listings' using errcode='28000'; end if;
  if not exists(select 1 from public.atm_sellers s where s.user_id=v_user) then
    raise exception 'Create a seller profile with an HTTPS portrait first' using errcode='42501';
  end if;

  select l.id into v_id from public.atm_listings l
    where l.seller_id=v_user and l.request_key=p_request_key;
  if v_id is not null then return v_id; end if;

  if p_request_key is null or coalesce(char_length(p_title),0) not between 5 and 95
    or coalesce(char_length(p_description),0) not between 20 and 1500
    or coalesce(char_length(p_category),0) not between 2 and 90
    or coalesce(char_length(p_subcategory),0) not between 2 and 90
    or coalesce(char_length(p_city),0) not between 2 and 90
    or p_pricing_mode not in ('fixed','negotiable','auction')
    or p_price_amount not between 1 and 1000000
    or p_deposit_amount not between 0 and 1000000 then
    raise exception 'Invalid listing details' using errcode='22023';
  end if;
  if coalesce(array_length(p_image_urls,1),0) not between 1 and 10
    or exists(select 1 from unnest(p_image_urls) as u(url)
      where u.url is null or char_length(u.url)>1024 or u.url !~ '^https://[^[:space:]]+$') then
    raise exception 'Supply one to ten HTTPS photo URLs' using errcode='22023';
  end if;

  if p_pricing_mode='auction' then
    if p_starting_bid not between 1 and 1000000
      or p_bid_increment not between 1 and 100000
      or p_reserve_amount not between 0 and 1000000
      or p_duration_hours not between 1 and 168
      or p_rental_start is null or p_rental_end is null then
      raise exception 'Invalid auction configuration' using errcode='22023';
    end if;
    v_end := v_now+make_interval(hours=>p_duration_hours);
    if p_rental_start <= v_end::date or p_rental_end < p_rental_start
      or p_rental_end > current_date+120 then
      raise exception 'Rental dates must follow auction end and stay within 120 days' using errcode='22023';
    end if;
    if p_rewards is null or jsonb_typeof(p_rewards) <> 'array' then
      raise exception 'Rewards must be an array' using errcode='22023';
    end if;
    if jsonb_array_length(p_rewards)>3 then
      raise exception 'Maximum three rewards per auction' using errcode='22023';
    end if;
  end if;

  insert into public.atm_listings
    (seller_id,title,description,category,subcategory,city,image_urls,
     price_amount,deposit_amount,pricing_mode,offers_allowed,request_key)
  values
    (v_user,btrim(p_title),btrim(p_description),p_category,p_subcategory,p_city,
     p_image_urls,case when p_pricing_mode='auction' then p_starting_bid else p_price_amount end,
     p_deposit_amount,p_pricing_mode,p_pricing_mode='negotiable',p_request_key)
  returning id into v_id;

  if p_pricing_mode='auction' then
    insert into public.atm_auctions
      (listing_id,starts_at,ends_at,rental_start,rental_end,starting_bid,bid_increment)
    values(v_id,v_now,v_end,p_rental_start,p_rental_end,p_starting_bid,p_bid_increment)
    returning id into v_auction;
    insert into atm_private.atm_reserves(auction_id,reserve_amount)
    values(v_auction,p_reserve_amount);

    for v_reward in select value from jsonb_array_elements(p_rewards)
    loop
      if jsonb_typeof(v_reward) <> 'object'
        or (v_reward->>'at') !~ '^[0-9]{1,7}$' then
        raise exception 'Invalid reward threshold' using errcode='22023';
      end if;
      v_amount := (v_reward->>'at')::integer;
      v_label := btrim(v_reward->>'label');
      if v_amount < p_starting_bid or v_amount>1000000
        or coalesce(char_length(v_label),0) not between 3 and 90 then
        raise exception 'Invalid reward benefit or threshold' using errcode='22023';
      end if;
      insert into public.atm_perks(auction_id,threshold_amount,label)
      values (v_auction,v_amount,v_label);
    end loop;
  end if;
  return v_id;
end;
$$;

create or replace function public.atm_set_negotiations(p_listing_id uuid, p_enabled boolean)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or p_enabled is null then
    raise exception 'Authenticated seller and explicit choice required' using errcode='28000';
  end if;
  update public.atm_listings l
    set pricing_mode=case when p_enabled then 'negotiable' else 'fixed' end,
        offers_allowed=p_enabled
    where l.id=p_listing_id and l.seller_id=v_user
      and l.pricing_mode in ('fixed','negotiable');
  if not found then
    raise exception 'Listing missing, not yours, or an active auction' using errcode='42501';
  end if;
  return true;
end;
$$;

create or replace function public.atm_place_bid(
  p_auction_id uuid,p_amount integer,p_request_key uuid
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_auction public.atm_auctions%rowtype;
  v_seller uuid;
  v_id uuid;
  v_alias text;
  v_previous atm_private.atm_bids%rowtype;
  v_minimum integer;
  v_now timestamptz:=clock_timestamp();
  v_ends timestamptz;
begin
  if v_user is null then raise exception 'Sign in to bid' using errcode='28000'; end if;
  if p_auction_id is null or p_request_key is null or p_amount is null then
    raise exception 'Auction, bid and request key required' using errcode='22023';
  end if;

  -- Serialises every bid and settlement on this auction, even under concurrency.
  select * into v_auction from public.atm_auctions where id=p_auction_id for update;
  if not found then raise exception 'Auction not found' using errcode='22023'; end if;
  select seller_id into v_seller from public.atm_listings
    where id=v_auction.listing_id and active=true;
  if v_seller is null then raise exception 'Listing not available' using errcode='22023'; end if;
  if v_user=v_seller then raise exception 'Cannot bid on your own listing' using errcode='42501'; end if;

  -- Idempotent replay of an already accepted request, including after expiry.
  select id into v_id from atm_private.atm_bids
    where buyer_id=v_user and request_key=p_request_key and auction_id=p_auction_id;
  if v_id is not null then
    return (select pg_catalog.jsonb_build_object('bid_id',b.id,'amount',b.amount,
       'auction_id',b.auction_id,'ends_at',v_auction.ends_at,'replayed',true)
       from atm_private.atm_bids b where b.id=v_id);
  end if;
  if v_auction.status<>'live' or v_now<v_auction.starts_at or v_now>=v_auction.ends_at then
    raise exception 'Auction has ended or is not open' using errcode='22023';
  end if;
  if p_amount not between 1 and 1000000 then
    raise exception 'Bid outside allowed amount' using errcode='22023';
  end if;
  if (select count(*) from atm_private.atm_bids b
      where b.auction_id=p_auction_id and b.buyer_id=v_user
        and b.created_at>v_now-interval '60 seconds') >= 6 then
    raise exception 'Bid rate limit reached; please try later' using errcode='P0001';
  end if;

  select * into v_previous from atm_private.atm_bids
    where auction_id=p_auction_id order by amount desc,created_at asc limit 1;
  if v_previous.id is not null and v_previous.buyer_id=v_user then
    raise exception 'You already have the highest bid' using errcode='22023';
  end if;
  v_minimum:=case when v_previous.id is null then v_auction.starting_bid
        else v_previous.amount+v_auction.bid_increment end;
  if p_amount < v_minimum or mod(p_amount-v_minimum,v_auction.bid_increment)<>0 then
    raise exception 'Bid must meet minimum and increments: %',v_minimum using errcode='22023';
  end if;

  select b.bidder_alias into v_alias from atm_private.atm_bids b
    where b.auction_id=p_auction_id and b.buyer_id=v_user
    order by b.created_at desc limit 1;
  if v_alias is null then
    select 'Bidder '||(count(distinct buyer_id)+1)::text into v_alias
       from atm_private.atm_bids where auction_id=p_auction_id;
  end if;

  insert into atm_private.atm_bids(auction_id,buyer_id,request_key,bidder_alias,amount)
  values(p_auction_id,v_user,p_request_key,v_alias,p_amount)
  returning id into v_id;
  insert into public.atm_bid_feed(bid_id,auction_id,bidder_alias,amount,created_at)
  select b.id,b.auction_id,b.bidder_alias,b.amount,b.created_at from atm_private.atm_bids b where b.id=v_id;

  v_ends := v_auction.ends_at;
  if v_ends-v_now<=interval '2 minutes' then
    v_ends:=v_ends+interval '2 minutes';
  end if;
  update public.atm_auctions
    set highest_bid=p_amount,bid_count=bid_count+1,ends_at=v_ends
    where id=p_auction_id;
  return pg_catalog.jsonb_build_object('bid_id',v_id,'amount',p_amount,'auction_id',
    p_auction_id,'ends_at',v_ends,'replayed',false);
end;
$$;

create or replace function public.atm_my_bids()
returns table(auction_id uuid,bid_amount integer,submitted_at timestamptz,alias text)
language plpgsql security definer set search_path=''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in first' using errcode='28000'; end if;
  return query
    select b.auction_id,b.amount,b.created_at,b.bidder_alias
    from atm_private.atm_bids b where b.buyer_id=auth.uid()
    order by b.created_at desc limit 200;
end;
$$;

create or replace function public.atm_settle_auction(p_auction_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_auction public.atm_auctions%rowtype;
  v_bid atm_private.atm_bids%rowtype;
  v_reserve integer;
  v_seller uuid;
  v_deposit integer;
  v_booking uuid;
  v_rewards jsonb:='[]'::jsonb;
begin
  if v_actor is null then raise exception 'Sign in to settle auction' using errcode='28000'; end if;
  select * into v_auction from public.atm_auctions where id=p_auction_id for update;
  if not found then raise exception 'Auction not found' using errcode='22023'; end if;
  if v_auction.status<>'live' then
    return pg_catalog.jsonb_build_object('status',v_auction.status);
  end if;
  if clock_timestamp()<v_auction.ends_at then
    return pg_catalog.jsonb_build_object('status','live','ends_at',v_auction.ends_at);
  end if;
  select b.* into v_bid from atm_private.atm_bids b
    where b.auction_id=p_auction_id order by b.amount desc,b.created_at asc limit 1;
  select r.reserve_amount into v_reserve from atm_private.atm_reserves r
    where r.auction_id=p_auction_id;
  if v_bid.id is null or v_bid.amount<coalesce(v_reserve,0) then
    update public.atm_auctions set status='closed_no_winner',reserve_met=false
      where id=p_auction_id;
    return pg_catalog.jsonb_build_object('status','closed_no_winner');
  end if;
  select l.seller_id,l.deposit_amount into v_seller,v_deposit
    from public.atm_listings l where l.id=v_auction.listing_id;
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'at',p.threshold_amount,'label',p.label) order by p.threshold_amount),'[]'::jsonb)
    into v_rewards from public.atm_perks p
    where p.auction_id=p_auction_id and p.threshold_amount<=v_bid.amount;
  insert into public.atm_bookings
    (auction_id,listing_id,buyer_id,seller_id,winning_amount,deposit_amount,total_amount,
     rental_start,rental_end,rewards_snapshot)
  values(p_auction_id,v_auction.listing_id,v_bid.buyer_id,v_seller,
    v_bid.amount,v_deposit,v_bid.amount+v_deposit,v_auction.rental_start,
    v_auction.rental_end,v_rewards)
  on conflict(auction_id) do nothing returning id into v_booking;
  if v_booking is null then
    select b.id into v_booking from public.atm_bookings b where b.auction_id=p_auction_id;
  end if;
  update public.atm_auctions set status='awaiting_payment',
    winning_public_bid_id=v_bid.id,reserve_met=true where id=p_auction_id;
  return pg_catalog.jsonb_build_object('status','awaiting_payment',
    'booking_id',case when v_actor in(v_bid.buyer_id,v_seller) then v_booking else null end);
end;
$$;

create or replace function public.atm_submit_offer(p_listing_id uuid,p_amount integer)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid();v_listing public.atm_listings%rowtype;v_id uuid;
begin
  if v_actor is null then raise exception 'Sign in to offer' using errcode='28000'; end if;
  if p_amount not between 1 and 1000000 then
    raise exception 'Invalid offer' using errcode='22023';
  end if;
  select * into v_listing from public.atm_listings where id=p_listing_id and active;
  if not found or v_listing.pricing_mode<>'negotiable' or not v_listing.offers_allowed then
    raise exception 'Offers disabled' using errcode='22023';
  end if;
  if v_actor=v_listing.seller_id then raise exception 'Cannot offer on your own listing' using errcode='42501'; end if;
  if (select count(*) from public.atm_offers
    where listing_id=p_listing_id and buyer_id=v_actor and status='pending')>=3 then
    raise exception 'Too many pending offers' using errcode='P0001';
  end if;
  insert into public.atm_offers(listing_id,buyer_id,offered_amount)
  values(p_listing_id,v_actor,p_amount) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.atm_respond_offer(
  p_offer_id uuid,p_action text,p_counter_amount integer default null
)
returns text language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid();v_offer public.atm_offers%rowtype;v_seller uuid;v_status text;
begin
  if v_actor is null then raise exception 'Sign in' using errcode='28000'; end if;
  select * into v_offer from public.atm_offers where id=p_offer_id for update;
  if not found then raise exception 'Offer not found' using errcode='22023'; end if;
  select seller_id into v_seller from public.atm_listings where id=v_offer.listing_id;
  if v_actor=v_seller and v_offer.status='pending'
    and p_action in('accept','decline','counter') then
    v_status:=case p_action when 'accept' then 'accepted' when 'decline' then 'declined' else 'countered' end;
    if p_action='counter' and p_counter_amount not between 1 and 1000000 then
      raise exception 'Invalid counteroffer amount' using errcode='22023';
    end if;
    update public.atm_offers set status=v_status,
      counter_amount=case when p_action='counter' then p_counter_amount else null end,
      updated_at=clock_timestamp() where id=p_offer_id;
  elsif v_actor=v_offer.buyer_id and
    ((v_offer.status='pending' and p_action='cancel') or
      (v_offer.status='countered' and p_action in('accept','decline'))) then
    v_status:=case p_action when 'cancel' then 'cancelled' when 'accept' then 'accepted' else 'declined' end;
    update public.atm_offers set status=v_status,updated_at=clock_timestamp()
      where id=p_offer_id;
  else
    raise exception 'Not authorised for this offer transition' using errcode='42501';
  end if;
  return v_status;
end;
$$;

-- Only trusted server handlers may confirm payments. The browser cannot execute this function.
create or replace function public.atm_confirm_payment(
  p_booking_id uuid,p_provider text,p_event_id text,p_reference text,p_received_amount integer
)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_booking public.atm_bookings%rowtype;v_prior uuid;
begin
  if current_setting('request.jwt.claim.role',true) is distinct from 'service_role' then
    raise exception 'Trusted payment provider callback required' using errcode='42501';
  end if;
  if coalesce(char_length(p_provider),0) not between 2 and 60
    or coalesce(char_length(p_event_id),0) not between 5 and 150
    or coalesce(char_length(p_reference),0) not between 5 and 150
    or p_received_amount is null then raise exception 'Invalid payment event' using errcode='22023';
  end if;
  select * into v_booking from public.atm_bookings where id=p_booking_id for update;
  if not found then raise exception 'Booking missing' using errcode='22023'; end if;
  select e.booking_id into v_prior from atm_private.atm_payment_events e
    where e.provider=p_provider and e.provider_event_id=p_event_id;
  if v_prior is not null then
    if v_prior<>p_booking_id then raise exception 'Provider event reused' using errcode='23505'; end if;
    return v_booking.status='paid';
  end if;
  if v_booking.status<>'awaiting_payment'
     or clock_timestamp()>v_booking.payment_deadline
     or p_received_amount<>v_booking.total_amount then
    raise exception 'Payment does not match an outstanding booking' using errcode='22023';
  end if;
  insert into atm_private.atm_payment_events(provider,provider_event_id,booking_id,received_amount)
  values (p_provider,p_event_id,p_booking_id,p_received_amount);
  update public.atm_bookings set status='paid',paid_at=clock_timestamp(),
    payment_reference=p_reference where id=p_booking_id;
  update public.atm_auctions set status='paid' where id=v_booking.auction_id;
  return true;
end;
$$;

-- PostgreSQL grants EXECUTE to PUBLIC on new functions unless explicitly revoked.
revoke all on function public.atm_create_listing(text,text,text,text,text,text[],integer,integer,text,uuid,integer,integer,integer,integer,date,date,jsonb) from public,anon;
revoke all on function public.atm_set_negotiations(uuid,boolean) from public,anon;
revoke all on function public.atm_place_bid(uuid,integer,uuid) from public,anon;
revoke all on function public.atm_my_bids() from public,anon;
revoke all on function public.atm_settle_auction(uuid) from public,anon;
revoke all on function public.atm_submit_offer(uuid,integer) from public,anon;
revoke all on function public.atm_respond_offer(uuid,text,integer) from public,anon;
revoke all on function public.atm_confirm_payment(uuid,text,text,text,integer) from public,anon,authenticated;

grant execute on function public.atm_create_listing(text,text,text,text,text,text[],integer,integer,text,uuid,integer,integer,integer,integer,date,date,jsonb) to authenticated;
grant execute on function public.atm_set_negotiations(uuid,boolean) to authenticated;
grant execute on function public.atm_place_bid(uuid,integer,uuid) to authenticated;
grant execute on function public.atm_my_bids() to authenticated;
grant execute on function public.atm_settle_auction(uuid) to authenticated;
grant execute on function public.atm_submit_offer(uuid,integer) to authenticated;
grant execute on function public.atm_respond_offer(uuid,text,integer) to authenticated;
grant execute on function public.atm_confirm_payment(uuid,text,text,text,integer) to service_role;

commit;
