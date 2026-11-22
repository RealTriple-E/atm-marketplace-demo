-- ATM Live forward migration 0003. Apply ONLY to an isolated ATM database.
-- Fix offer states when negotiations close; cancel overdue unpaid auction bookings.
begin;

alter table public.atm_bookings
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text
  check (cancellation_reason in ('payment_deadline'));

create or replace function public.atm_set_negotiations(p_listing_id uuid, p_enabled boolean)
returns boolean language plpgsql security definer set search_path=''
as $$
declare
  v_user uuid := auth.uid();
  v_listing public.atm_listings%rowtype;
begin
  if v_user is null then raise exception 'Sign in to manage a listing' using errcode='28000'; end if;
  if p_enabled is null or p_listing_id is null then raise exception 'Explicit choice and listing required' using errcode='22023'; end if;

  -- Lock the listing first, matching the order used by offer creation/response.
  select * into v_listing from public.atm_listings
  where id=p_listing_id for update;
  if not found or v_listing.seller_id<>v_user or v_listing.pricing_mode='auction' then
    raise exception 'You cannot change negotiations on this listing' using errcode='42501';
  end if;
  if not v_listing.active then raise exception 'Listing is inactive' using errcode='22023'; end if;

  update public.atm_listings
    set pricing_mode=case when p_enabled then 'negotiable' else 'fixed' end,
        offers_allowed=p_enabled
  where id=p_listing_id;
  if not p_enabled then
    update public.atm_offers
      set status='cancelled',updated_at=clock_timestamp()
    where listing_id=p_listing_id and status in ('pending','countered');
  end if;
  return true;
end;
$$;

create or replace function public.atm_submit_offer(p_listing_id uuid,p_amount integer)
returns uuid language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_listing public.atm_listings%rowtype;
  v_id uuid;
begin
  if v_actor is null then raise exception 'Sign in to offer' using errcode='28000'; end if;
  if p_listing_id is null or p_amount not between 1 and 1000000 then
    raise exception 'Invalid offer' using errcode='22023';
  end if;
  -- Shared row lock serialises new offers against the owner's toggle.
  select * into v_listing from public.atm_listings
    where id=p_listing_id for share;
  if not found or not v_listing.active
    or v_listing.pricing_mode<>'negotiable' or not v_listing.offers_allowed then
    raise exception 'Offers disabled' using errcode='22023';
  end if;
  if v_actor=v_listing.seller_id then
    raise exception 'Cannot offer on your own listing' using errcode='42501';
  end if;
  if (select count(*) from public.atm_offers
      where listing_id=p_listing_id and buyer_id=v_actor and status='pending') >= 3 then
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
declare
  v_actor uuid:=auth.uid();
  v_offer public.atm_offers%rowtype;
  v_listing public.atm_listings%rowtype;
  v_listing_id uuid;
  v_status text;
begin
  if v_actor is null then raise exception 'Sign in to respond' using errcode='28000'; end if;
  -- Lock listing first, then the offer, preventing disabled negotiations from racing acceptance.
  select listing_id into v_listing_id from public.atm_offers where id=p_offer_id;
  if v_listing_id is null then raise exception 'Offer not found' using errcode='22023'; end if;
  select * into v_listing from public.atm_listings
    where id=v_listing_id for update;
  select * into v_offer from public.atm_offers where id=p_offer_id for update;
  if not found or v_offer.listing_id<>v_listing_id then
    raise exception 'Offer changed; retry' using errcode='40001';
  end if;
  if not v_listing.active or v_listing.pricing_mode<>'negotiable'
    or not v_listing.offers_allowed then
    raise exception 'Offers are disabled for this listing' using errcode='22023';
  end if;

  if v_actor=v_listing.seller_id and v_offer.status='pending'
    and p_action in ('accept','decline','counter') then
    v_status:=case p_action when 'accept' then 'accepted' when 'decline' then 'declined' else 'countered' end;
    if p_action='counter' and p_counter_amount not between 1 and 1000000 then
      raise exception 'Invalid counteroffer' using errcode='22023';
    end if;
    update public.atm_offers set status=v_status,
      counter_amount=case when p_action='counter' then p_counter_amount else null end,
      updated_at=clock_timestamp() where id=p_offer_id;

  elsif v_actor=v_offer.buyer_id and
    ((v_offer.status='pending' and p_action='cancel')
    or (v_offer.status='countered' and p_action in ('accept','decline'))) then
    v_status:=case p_action when 'cancel' then 'cancelled' when 'accept' then 'accepted' else 'declined' end;
    update public.atm_offers set status=v_status,updated_at=clock_timestamp()
      where id=p_offer_id;

  else
    raise exception 'Not authorised for this offer transition' using errcode='42501';
  end if;
  return v_status;
end;
$$;

-- This function is NOT exposed to the Data API. Run from trusted server Cron only.
-- Lock booking before auction, just like payment confirmation, so concurrent settlement
-- and webhook processing cannot both decide different final payment states.
create or replace function atm_private.atm_expire_unpaid()
returns integer language plpgsql security definer set search_path=''
as $$
declare
  v_booking public.atm_bookings%rowtype;
  v_count integer:=0;
begin
  for v_booking in
    select b.* from public.atm_bookings b
    where b.status='awaiting_payment' and b.payment_deadline<clock_timestamp()
    order by b.payment_deadline
    limit 100 for update skip locked
  loop
    update public.atm_bookings
      set status='cancelled',cancelled_at=clock_timestamp(),
          cancellation_reason='payment_deadline'
    where id=v_booking.id and status='awaiting_payment';
    if found then
      update public.atm_auctions set status='cancelled'
        where id=v_booking.auction_id and status='awaiting_payment';
      v_count:=v_count+1;
    end if;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.atm_set_negotiations(uuid,boolean) from public,anon;
revoke all on function public.atm_submit_offer(uuid,integer) from public,anon;
revoke all on function public.atm_respond_offer(uuid,text,integer) from public,anon;
revoke all on function atm_private.atm_expire_unpaid() from public,anon,authenticated;
grant execute on function public.atm_set_negotiations(uuid,boolean) to authenticated;
grant execute on function public.atm_submit_offer(uuid,integer) to authenticated;
grant execute on function public.atm_respond_offer(uuid,text,integer) to authenticated;

commit;
