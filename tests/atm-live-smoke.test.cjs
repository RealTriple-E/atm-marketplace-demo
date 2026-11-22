const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const js=fs.readFileSync(path.join(__dirname,'..','atm-live.js'),'utf8');
const sql=fs.readFileSync(path.join(__dirname,'..','supabase','migrations','202611220002_atm_marketplace_rpcs.sql'),'utf8');

test('unconfigured ATM Live safely shows setup screen without contacting a backend',()=>{
 const root={innerHTML:'',addEventListener(){}};
 const sandbox={
   window:{ATM_LIVE_CONFIG:{url:'',publishableKey:''},addEventListener(){}},
   document:{querySelector(s){assert.equal(s,'#live-root');return root}},
   location:{hash:'',origin:'https://example.test',pathname:'/live.html'},
   setInterval(){},setTimeout(){},clearTimeout(){},
   console,URL,Date,Math
 };
 vm.createContext(sandbox);
 vm.runInContext(js,sandbox,{filename:'atm-live.js'});
 assert.match(root.innerHTML,/awaits its own database/);
 assert.match(root.innerHTML,/Neither Kora Central nor Kora Business/);
 assert.match(root.innerHTML,/index\.html#\/home/);
});
test('public client is pinned to a publishable SDK version, never holds server credentials',()=>{
 assert.match(js,/supabase-js@2\.119\.2/);
 assert.match(js,/sb_publishable_/);
 assert.doesNotMatch(js,/sb_secret_|sbp_[A-Za-z0-9]{12}|service_role\s*:/);
});
test('payment confirmation is callable only by trusted service role',()=>{
 assert.match(sql,/atm_confirm_payment/);
 assert.match(sql,/grant execute on function public\.atm_confirm_payment\([^\n]+\) to service_role/i);
 assert.match(sql,/revoke all on function public\.atm_confirm_payment\([^\n]+\) from public,anon,authenticated/i);
});
test('live frontend uses backend bid and negotiation RPCs',()=>{
 assert.match(js,/rpc\('atm_place_bid'/);
 assert.match(js,/rpc\('atm_set_negotiations'/);
 assert.match(js,/rpc\('atm_create_listing'/);
 assert.match(js,/rpc\('atm_settle_auction'/);
 assert.match(js,/\.from\('atm_messages'\)/);
});
