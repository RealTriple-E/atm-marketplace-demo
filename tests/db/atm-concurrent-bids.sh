#!/usr/bin/env bash
# PostgreSQL race regression: two authenticated buyers submit the SAME minimum bid
# in distinct sessions. The auction row lock must accept precisely one.
set -euo pipefail

psql -v ON_ERROR_STOP=1 -qAt >/dev/null <<'SQL'
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select public.atm_create_listing(
  'Concurrency Test Camera Kit',
  'Real transactional concurrency regression test for simultaneous bidders.',
  'Hardware','Cameras & Electronics','Lusaka',
  array['https://example.org/concurrency-test.jpg'],
  500,0,'auction','eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1',
  100,25,0,48,current_date+7,current_date+8,'[]'::jsonb
);
SQL

auction_id="$(psql -v ON_ERROR_STOP=1 -qAt -c \
  "select a.id from public.atm_auctions a join public.atm_listings l on l.id=a.listing_id where l.request_key='eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1';")"
if [[ ! "$auction_id" =~ ^[0-9a-f-]{36}$ ]];then
  echo "Could not identify concurrent test auction" >&2
  exit 1
fi

out_a="$(mktemp)"
out_b="$(mktemp)"
trap 'rm -f "$out_a" "$out_b"' EXIT

psql -v ON_ERROR_STOP=1 -qAt -c "
  set role authenticated;
  select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
  select public.atm_place_bid('$auction_id',100,'eeeeeee2-eeee-4eee-8eee-eeeeeeeeeee2');
" >"$out_a" 2>&1 &
pid_a=$!

psql -v ON_ERROR_STOP=1 -qAt -c "
  set role authenticated;
  select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
  select public.atm_place_bid('$auction_id',100,'eeeeeee3-eeee-4eee-8eee-eeeeeeeeeee3');
" >"$out_b" 2>&1 &
pid_b=$!

successes=0
if wait "$pid_a";then successes=$((successes+1)); else
  if ! grep -q 'Bid must meet minimum and increments' "$out_a";then cat "$out_a";exit 1;fi
fi
if wait "$pid_b";then successes=$((successes+1)); else
  if ! grep -q 'Bid must meet minimum and increments' "$out_b";then cat "$out_b";exit 1;fi
fi

if [[ "$successes" != "1" ]];then
  echo "Expected 1 accepted bid; got $successes" >&2
  exit 1
fi

read -r count distinct_count high feed <<< "$(psql -v ON_ERROR_STOP=1 -qAt -F ' ' -c "
  select a.bid_count,a.bidder_count,a.highest_bid,
    (select count(*) from public.atm_bid_feed f where f.auction_id=a.id)
  from public.atm_auctions a where a.id='$auction_id';")"
if [[ "$count $distinct_count $high $feed" != "1 1 100 1" ]];then
  echo "Bid state inconsistent: $count $distinct_count $high $feed" >&2
  exit 1
fi

echo "ATM concurrency regression PASSED: one winning bid, one rejected stale bid, consistent feed"
