-- ATM Live PostgreSQL regression tests. Fails on any violation.
\set ON_ERROR_STOP on

-- Seller setup and creation of auction and standard listing.
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
insert into public.atm_sellers(user_id,business_name,avatar_url,city)
values ('11111111-1111-4111-8111-111111111111','Test Hire Zambia','https://example.org/portrait.jpg','Lusaka');
select set_config('atm.test.auction_listing',public.atm_create_listing(
  'Professional Camera Hire','A complete camera package for two full rental days.',
  'Hardware','Cameras & Electronics','Lusaka',array['https://example.org/camera.jpg'],
  500,100,'auction','aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  100,25,125,24,current_date+7,current_date+8,
  '[{"at":150,"label":"Free local delivery"},{"at":200,"label":"Extra camera battery"}]'::jsonb
)::text,false);
select set_config('atm.test.auction',a.id::text,false)
from public.atm_auctions a
where a.listing_id=current_setting('atm.test.auction_listing')::uuid;
select set_config('atm.test.fixed',public.atm_create_listing(
  'Portable Power Drill','Portable power drill with battery and drill bits.',
  'Hardware','Hand & Power Tools','Lusaka',array['https://example.org/drill.jpg'],
  200,30,'fixed','aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2'
)::text,false);
-- Owner can toggle only regular rental pricing, not auctions.
select public.atm_set_negotiations(current_setting('atm.test.fixed')::uuid,true);
do $$
begin
 if not exists(select 1 from public.atm_listings
    where id=current_setting('atm.test.fixed')::uuid and pricing_mode='negotiable' and offers_allowed) then
    raise exception 'Negotiation toggle did not persist';
 end if;
 begin
   perform public.atm_set_negotiations(current_setting('atm.test.auction_listing')::uuid,true);
   raise exception 'Auction negotiation toggle unexpectedly succeeded';
 exception when sqlstate '42501' then null;
 end;
 begin
   perform public.atm_place_bid(current_setting('atm.test.auction')::uuid,100,
      'bbbbbbb0-bbbb-4bbb-8bbb-bbbbbbbbbbb0');
   raise exception 'Owner bid unexpectedly succeeded';
 exception when sqlstate '42501' then null;
 end;
end $$;

-- First buyer bids, idempotent request cannot double-count or double-charge.
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
select public.atm_place_bid(current_setting('atm.test.auction')::uuid,100,
 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1');
do $$
declare response jsonb;
begin
 response:=public.atm_place_bid(current_setting('atm.test.auction')::uuid,100,
    'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1');
 if response->>'replayed'<>'true' then raise exception 'Idempotency failed'; end if;
 begin
   perform public.atm_place_bid(current_setting('atm.test.auction')::uuid,125,
      'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2');
   raise exception 'Own highest bid accepted';
 exception when sqlstate '22023' then null;
 end;
end $$;
select public.atm_submit_offer(current_setting('atm.test.fixed')::uuid,175);
do $$
begin
 if (select count(*) from public.atm_offers where buyer_id=auth.uid())<>1 then
   raise exception 'Private offer not recorded for buyer';
 end if;
end $$;

-- Buyer 2 cannot bid below the server's minimum or in an invalid increment.
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
do $$
begin
 begin
   perform public.atm_place_bid(current_setting('atm.test.auction')::uuid,110,
      'ccccccc0-cccc-4ccc-8ccc-ccccccccccc0');
   raise exception 'Under-minimum bid was accepted';
 exception when sqlstate '22023' then null;
 end;
end $$;
select public.atm_place_bid(current_setting('atm.test.auction')::uuid,125,
 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1');
do $$
begin
 if (select highest_bid from public.atm_auctions where id=current_setting('atm.test.auction')::uuid)<>125 then
   raise exception 'Highest bid incorrect';
 end if;
 if (select bid_count from public.atm_auctions where id=current_setting('atm.test.auction')::uuid)<>2 then
   raise exception 'Duplicate bid was recorded';
 end if;
 if (select bidder_count from public.atm_auctions where id=current_setting('atm.test.auction')::uuid)<>2 then
   raise exception 'Distinct bidder count incorrect';
 end if;
 if (select count(*) from public.atm_bid_feed where auction_id=current_setting('atm.test.auction')::uuid)<>2 then
   raise exception 'Public feed should contain two masked bids';
 end if;
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='atm_bid_feed' and column_name='buyer_id') then
   raise exception 'Public feed leaks bidder identity';
 end if;
 begin
   update public.atm_auctions set highest_bid=999999 where id=current_setting('atm.test.auction')::uuid;
   raise exception 'Browser role illegally modified auction';
 exception when sqlstate '42501' then null;
 end;
end $$;
-- Winner is determined by an authoritative server timestamp.
reset role;
update public.atm_auctions set starts_at=clock_timestamp()-interval '2 days',
  ends_at=clock_timestamp()-interval '1 minute'
  where id=current_setting('atm.test.auction')::uuid;

-- First buyer cannot inspect the second buyer's booking after settlement.
set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
select public.atm_settle_auction(current_setting('atm.test.auction')::uuid);
do $$
begin
 if exists(select 1 from public.atm_bookings where auction_id=current_setting('atm.test.auction')::uuid) then
   raise exception 'Losing bidder can view winner private booking';
 end if;
end $$;
-- Winner sees only their private booking, but still cannot send messages before payment.
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
do $$
declare v_booking_id uuid;
begin
 select b.id into v_booking_id from public.atm_bookings b
   where auction_id=current_setting('atm.test.auction')::uuid;
 if v_booking_id is null then raise exception 'Winner booking not visible'; end if;
 if (select total_amount from public.atm_bookings where atm_bookings.id=v_booking_id)<>225 then
   raise exception 'Winner amount/deposit mismatch';
 end if;
 begin
   insert into public.atm_messages(booking_id,sender_id,body)
     values(v_booking_id,auth.uid(),'Unsafe prepayment contact');
   raise exception 'Chat was allowed before verified payment';
 exception when sqlstate '42501' then null;
 end;
end $$;

-- Only service_role can validate payment and unlock chat.
reset role;
select set_config('atm.test.booking_id',(select b.id from public.atm_bookings b where b.auction_id=current_setting('atm.test.auction')::uuid)::text,false);
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
select public.atm_confirm_payment(
 current_setting('atm.test.booking_id')::uuid,
 'test-provider','event-test-0001','payment-confirmation-0001',225
);
select public.atm_confirm_payment(
 current_setting('atm.test.booking_id')::uuid,
 'test-provider','event-test-0001','payment-confirmation-0001',225
);
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
insert into public.atm_messages(booking_id,sender_id,body)
select b.id,auth.uid(),'Paid booking contact confirmed'
from public.atm_bookings b where b.auction_id=current_setting('atm.test.auction')::uuid;
do $$
begin
 if (select count(*) from public.atm_messages)<>1 then
   raise exception 'Verified payment did not unlock chat';
 end if;
end $$;
-- A third party cannot view or message another user's paid booking.
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',false);
do $$
begin
 if exists(select 1 from public.atm_bookings) then
   raise exception 'Third party can view bookings';
 end if;
 if exists(select 1 from public.atm_messages) then
   raise exception 'Third party can view private messages';
 end if;
end $$;

-- Public projection is readable but private bids and payment events are not.
reset role;
set role anon;
do $$
begin
 if (select count(*) from public.atm_bid_feed where auction_id=current_setting('atm.test.auction')::uuid)<>2 then
   raise exception 'Anon cannot see safe auction activity';
 end if;
 begin
   perform count(*) from atm_private.atm_bids;
   raise exception 'Private bidder identities visible to anon';
 exception when sqlstate '42501' then null;
 end;
end $$;
reset role;

-- Lifecycle hardening: disabled negotiations withdraw all pending offers atomically.
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select public.atm_set_negotiations(current_setting('atm.test.fixed')::uuid,false);
do $
begin
 if exists(select 1 from public.atm_offers
     where listing_id=current_setting('atm.test.fixed')::uuid
       and status in ('pending','countered')) then
   raise exception 'Disabling negotiations left active offers';
 end if;
end $;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $
begin
  begin
    perform public.atm_submit_offer(current_setting('atm.test.fixed')::uuid,175);
    raise exception 'Buyer offered after negotiations disabled';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.atm_respond_offer(
      (select id from public.atm_offers
       where listing_id=current_setting('atm.test.fixed')::uuid limit 1),
       'accept',null);
    raise exception 'Buyer accepted a cancelled offer';
  exception when sqlstate '22023' then null;
  end;
end $;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select public.atm_set_negotiations(current_setting('atm.test.fixed')::uuid,true);
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
select set_config('atm.test.new_offer',public.atm_submit_offer(
   current_setting('atm.test.fixed')::uuid,180)::text,false);
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select public.atm_respond_offer(current_setting('atm.test.new_offer')::uuid,'counter',190);
-- Disabling after a counteroffer must cancel its acceptance path.
select public.atm_set_negotiations(current_setting('atm.test.fixed')::uuid,false);
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $
begin
 if (select status from public.atm_offers where id=current_setting('atm.test.new_offer')::uuid)<>'cancelled' then
   raise exception 'Existing counteroffer was not cancelled';
 end if;
 begin
   perform public.atm_respond_offer(current_setting('atm.test.new_offer')::uuid,'accept',null);
   raise exception 'Cancelled counteroffer was accepted';
 exception when sqlstate '22023' then null;
 end;
end $;

-- Unpaid winner lifecycle: expiry must release payment-pending state without unlocking chat.
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('atm.test.unpaid_listing',public.atm_create_listing(
  'Unpaid Auction Example','A complete test-only equipment rental with no actual payment.',
  'Hardware','Cameras & Electronics','Lusaka',array['https://example.org/unpaid.jpg'],
  400,50,'auction','ddddddd1-dddd-4ddd-8ddd-ddddddddddd1',
  100,25,0,24,current_date+7,current_date+8,'[]'::jsonb
)::text,false);
select set_config('atm.test.unpaid_auction',a.id::text,false)
from public.atm_auctions a
where a.listing_id=current_setting('atm.test.unpaid_listing')::uuid;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
select public.atm_place_bid(current_setting('atm.test.unpaid_auction')::uuid,100,
  'ddddddd2-dddd-4ddd-8ddd-ddddddddddd2');
reset role;
update public.atm_auctions set starts_at=clock_timestamp()-interval '2 days',
 ends_at=clock_timestamp()-interval '1 minute'
 where id=current_setting('atm.test.unpaid_auction')::uuid;
set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
select public.atm_settle_auction(current_setting('atm.test.unpaid_auction')::uuid);
reset role;
select set_config('atm.test.unpaid_booking',id::text,false)
 from public.atm_bookings where auction_id=current_setting('atm.test.unpaid_auction')::uuid;
update public.atm_bookings set payment_deadline=clock_timestamp()-interval '1 minute'
 where id=current_setting('atm.test.unpaid_booking')::uuid;
do $
declare v_first integer;v_again integer;
begin
  v_first:=atm_private.atm_expire_unpaid();
  v_again:=atm_private.atm_expire_unpaid();
  if v_first<>1 or v_again<>0 then
    raise exception 'Expiry is not idempotent: %, %',v_first,v_again;
  end if;
  if not exists(select 1 from public.atm_bookings
      where id=current_setting('atm.test.unpaid_booking')::uuid
        and status='cancelled'
        and cancellation_reason='payment_deadline'
        and cancelled_at is not null) then
    raise exception 'Unpaid booking was not cancelled';
  end if;
  if not exists(select 1 from public.atm_auctions
      where id=current_setting('atm.test.unpaid_auction')::uuid
        and status='cancelled') then
    raise exception 'Unpaid auction state not cancelled';
  end if;
end $;
set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $
begin
  begin
    insert into public.atm_messages(booking_id,sender_id,body)
      values(current_setting('atm.test.unpaid_booking')::uuid,auth.uid(),'Expired booking contact');
    raise exception 'Cancelled booking unexpectedly allowed chat';
  exception when sqlstate '42501' then null;
  end;
end $;
reset role;
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
do $
begin
  begin
    perform public.atm_confirm_payment(
      current_setting('atm.test.unpaid_booking')::uuid,
      'test-provider','expired-event-0001','expired-payment-reference',150);
    raise exception 'Expired cancelled booking unexpectedly accepted payment';
  exception when sqlstate '22023' then null;
  end;
end $;
reset role;

select 'ATM LIVE INTEGRATION: PASS' as result;
