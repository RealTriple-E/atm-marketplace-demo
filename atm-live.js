/* ATM Live — independent opt-in multi-user client.
 * Requires dedicated Supabase project + SQL migrations. Does not touch demo storage.
 */
const R=document.querySelector('#live-root'),C=window.ATM_LIVE_CONFIG||{};
const K=n=>'K'+Math.round(Number(n)||0).toLocaleString('en-US');
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const I=s=>/^https:\/\/[^\s"<>]+$/i.test(String(s||''))?E(s):'./favicon.svg';
const T=s=>{const x=Math.max(0,Math.ceil((new Date(s).getTime()-Date.now())/1000)),d=Math.floor(x/86400);return(d?d+'d ':'')+[Math.floor(x%86400/3600),Math.floor(x%3600/60),x%60].map(y=>String(y).padStart(2,'0')).join(':')};
const categories=['Transport','Hardware','Events','Spaces & Property','Lifestyle','Services'];
let api,user=null,seller=null,mode='buyer',busy=false,flash='',db={listings:[],auctions:[],perks:[],sellers:[],feed:[],mine:[],watches:[],bookings:[],offers:[],messages:[]};
let proposed=0,polling=false,chan;
const page=()=>{const h=(location.hash||'#/browse').replace(/^#\//,'').split('/');return[h[0],h[1]||'']};
const go=(p,id)=>{location.hash='#/'+p+(id?'/'+id:'');draw();};
const listing=id=>db.listings.find(x=>x.id===id);
const auction=id=>db.auctions.find(x=>x.id===id);
const linked=l=>db.auctions.find(x=>x.listing_id===l?.id);
const sellerOf=l=>db.sellers.find(x=>x.user_id===l?.seller_id);
const low=a=>a.highest_bid==null?a.starting_bid:a.highest_bid+a.bid_increment;
const benefits=a=>db.perks.filter(x=>x.auction_id===a.id).sort((x,y)=>x.threshold_amount-y.threshold_amount);
const signed=()=>Boolean(user);
const errData=async p=>{const r=await p;if(r.error)throw r.error;return r.data;};
function base(content){
 const [p]=page(),tabs=mode==='seller'&&user?[['seller','Dashboard'],['new','List item'],['offers','Offers'],['account','Account']]:[['browse','Browse'],['auctions','Auctions'],['mybids','My bids'],['trips','Trips'],['account','Account']];
 return `<header class="atm-live-top"><a href="./index.html#/home" class="atm-live-logo">ATM</a><span>REAL ACCOUNT BETA</span><a href="./index.html#/home">Demo</a></header><main class="atm-live-main">${user?`<div class="atm-live-mode"><strong>${E(user.email)}</strong><div><button data-action="mode" data-mode="buyer" class="${mode==='buyer'?'active':''}">Buyer</button><button data-action="mode" data-mode="seller" class="${mode==='seller'?'active':''}">Seller</button></div></div>`:'<p class="atm-live-note">Public browsing is available. Sign in to bid or list rentals.</p>'}${flash?'<p class="atm-live-error" role="status">'+E(flash)+'</p>':''}${content}<footer>ATM Live is separate from the fictional demo. Payment provider integration is not active.</footer></main><nav class="atm-live-nav">${tabs.map(([route,label])=>`<a class="${p===route?'active':''}" href="#/${route}">${label}</a>`).join('')}</nav>`;
}
function card(l){
 const a=linked(l),s=sellerOf(l);
 return `<article class="atm-live-card"><a href="#/${a?'auction':'item'}/${a?a.id:l.id}"><img src="${I(l.image_urls?.[0])}" alt="${E(l.title)}" loading="lazy"><span>${a?'LIVE AUCTION':l.pricing_mode==='negotiable'?'NEGOTIABLE':'FIXED RATE'}</span></a><div><strong>${E(l.title)}</strong><small>${E(l.city)} · ${E(l.category)}</small><b>${K(a?(a.highest_bid??a.starting_bid):l.price_amount)}</b><small>${a?a.bid_count+' bids · '+T(a.ends_at):'Daily rate'}</small><p><img class="atm-live-avatar" src="${I(s?.avatar_url)}" alt="Seller portrait"> ${E(s?.business_name||'ATM seller')}</p></div></article>`;
}
function browse(onlyAuctions=false){
 const list=onlyAuctions?db.listings.filter(x=>linked(x)):db.listings;
 return `<h1>${onlyAuctions?'Live rental auctions':'Discover anything for hire'}</h1><p class="atm-live-lead">Verified account sessions, shared marketplace data and server-controlled bidding.</p>${onlyAuctions?'':'<div class="atm-live-categories">'+categories.map(c=>'<span>'+E(c)+'</span>').join('')+'</div>'}<div class="atm-live-grid">${list.length?list.map(card).join(''):'<p class="atm-live-empty">No real listings yet. You can still explore the ATM demo.</p>'}</div>`;
}
function auth(){
 return `<h1>ATM Live account</h1><p>One account lets you buy, bid and sell from different devices.</p><form data-form="auth" class="atm-live-form"><label>Email<input name="email" type="email" required autocomplete="email"></label><label>Password<input name="password" type="password" required minlength="8" autocomplete="current-password"></label><div class="atm-live-actions"><button name="intent" value="login" class="primary">Sign in</button><button name="intent" value="register" class="secondary">Create account</button></div></form><p class="atm-live-note">Email confirmation may be required. Credentials are handled by Supabase Auth.</p>`;
}
function sellerProfile(){
 return `<h1>Create seller profile</h1><p>Complete your seller identity before publishing. A portrait URL is required.</p><form data-form="seller" class="atm-live-form"><label>Business or display name<input name="business_name" required minlength="2" maxlength="90"></label><label>Public seller photograph (HTTPS URL)<input name="avatar_url" type="url" required pattern="https://.*"></label><label>City<input name="city" required value="Lusaka"></label><button class="primary">Activate seller profile</button></form>`;
}
function sellerPage(){
 if(!user)return auth();if(!seller)return sellerProfile();
 const owned=db.listings.filter(l=>l.seller_id===user.id);
 return `<h1>Seller dashboard</h1><p>Welcome, ${E(seller.business_name)}. Manage your own listings and auctions.</p><div class="atm-live-stats"><div><b>${owned.length}</b><small>Listings</small></div><div><b>${owned.filter(l=>linked(l)).length}</b><small>Auctions</small></div><div><b>${db.offers.filter(o=>owned.some(l=>l.id===o.listing_id)&&o.status==='pending').length}</b><small>Pending offers</small></div></div><a class="atm-live-button" href="#/new">Publish a new listing</a><div class="atm-live-grid">${owned.map(card).join('')||'<p>You have not published a rental yet.</p>'}</div>`;
}
function newListing(){
 if(!user)return auth();if(!seller)return sellerProfile();
 return `<h1>Publish a rental</h1><p>Choose fixed pricing, negotiations, or an auction for one defined hire period.</p><form class="atm-live-form" data-form="listing"><label>Title<input name="title" required minlength="5" maxlength="95"></label><label>Description<textarea name="description" required minlength="20" maxlength="1500"></textarea></label><div class="atm-live-pair"><label>Category<select name="category">${categories.map(c=>'<option>'+E(c)+'</option>').join('')}</select></label><label>Subcategory<input name="subcategory" required value="General Equipment" minlength="2" maxlength="90"></label></div><label>City<input name="city" required value="${E(seller.city||'Lusaka')}"></label><label>Image URLs (HTTPS, one per line; swipeable gallery)<textarea name="images" required placeholder="https://example.com/photo.jpg"></textarea></label><div class="atm-live-pair"><label>Daily advertised price (K)<input name="price" type="number" min="1" max="1000000" required value="500"></label><label>Deposit (K)<input name="deposit" type="number" min="0" max="1000000" value="0"></label></div><label>Pricing method<select name="pricing" data-change="pricing"><option value="fixed">Fixed — no negotiations</option><option value="negotiable">Negotiable — enable offers</option><option value="auction">Timed auction</option></select></label><div id="atm-live-auction-fields" hidden><div class="atm-live-pair"><label>Starting bid (K)<input name="startBid" type="number" value="300" min="1" max="1000000"></label><label>Bid increment (K)<input name="increment" type="number" value="25" min="1" max="100000"></label></div><div class="atm-live-pair"><label>Confidential reserve (K)<input name="reserve" type="number" value="0" min="0" max="1000000"></label><label>Duration<select name="duration">${[6,12,24,48,72,120,168].map(n=>'<option value="'+n+'">'+(n<24?n+'h':n/24+' days')+'</option>').join('')}</select></label></div><div class="atm-live-pair"><label>Rental start<input type="date" name="rentalStart"></label><label>Rental end<input type="date" name="rentalEnd"></label></div><h3>Reward thresholds</h3>${[0,1,2].map(i=>`<div class="atm-live-pair"><label>Unlock from K<input type="number" name="perkAt${i}" min="1" max="1000000"></label><label>Privilege<input name="perkLabel${i}" maxlength="90" placeholder="e.g. Free eligible local delivery"></label></div>`).join('')}</div><button class="primary">Publish in ATM Live</button></form><p class="atm-live-note">A published auction cannot have its price or rewards changed while bidding is in progress.</p>`;
}
function itemView(l){
 if(!l)return '<h1>Listing not found</h1>';
 const a=linked(l),s=sellerOf(l);if(a)return auctionView(a);
 return `<h1>${E(l.title)}</h1><div class="atm-live-gallery">${(l.image_urls||[]).map(url=>'<img src="'+I(url)+'" alt="'+E(l.title)+'">').join('')}</div><p>${E(l.description)}</p><p><b>${K(l.price_amount)}</b> · ${E(l.city)}</p><p><img class="atm-live-avatar" src="${I(s?.avatar_url)}" alt="Seller portrait"> ${E(s?.business_name||'Seller')}</p>${l.offers_allowed&&!user?'<a href="#/account">Sign in to negotiate</a>':l.offers_allowed&&user&&l.seller_id!==user.id?`<form data-form="offer" class="atm-live-form"><input type="hidden" name="listing_id" value="${E(l.id)}"><label>Your private offer in K<input type="number" name="amount" value="${l.price_amount}" min="1" max="1000000" required></label><button class="primary">Submit offer</button></form>`:'<p>Negotiations disabled for this listing.</p>'}<p class="atm-live-note">Real fixed-price checkout is not connected. No payment or reservation occurs here.</p>`;
}
function auctionView(a){
 if(!a)return '<h1>Auction not found</h1>';const l=listing(a.listing_id);if(!l)return '<h1>Rental unavailable</h1>';
 const perks=benefits(a),min=low(a),end=Date.parse(a.ends_at),max=Math.min(1000000,min+Math.ceil(Math.max(20*a.bid_increment,Math.max(min,...perks.map(p=>p.threshold_amount))+a.bid_increment-min)/a.bid_increment)*a.bid_increment);
 proposed=Math.max(min,Math.min(proposed||min,max));
 const feed=db.feed.filter(x=>x.auction_id===a.id).sort((x,y)=>y.amount-x.amount);
 const ownTop=db.mine.some(x=>x.auction_id===a.id&&x.bid_amount===a.highest_bid);
 return `<a href="#/auctions" class="atm-live-back">‹ Auctions</a><h1>${E(l.title)}</h1><div class="atm-live-gallery">${(l.image_urls||[]).map(url=>'<img src="'+I(url)+'" alt="'+E(l.title)+'">').join('')}</div><p>${E(l.description)}</p><p>Hire dates: ${E(a.rental_start)} to ${E(a.rental_end)} · ${E(l.city)}</p><div class="atm-live-stats"><div><b>${K(a.highest_bid??a.starting_bid)}</b><small>Highest bid</small></div><div><b>${a.bid_count}</b><small>Bids</small></div><div><b id="atm-live-clock">${a.status==='live'?T(a.ends_at):E(a.status)}</b><small>Time remaining</small></div></div><p>Next bid ${K(min)}; minimum increment ${K(a.bid_increment)}. The hidden reserve is not disclosed. Last-minute bids extend by two minutes.</p>${a.status!=='live'?'<div class="atm-live-note">Auction closed. Winner and payment records are determined by the server.</div>':end<=Date.now()?'<button data-action="settle" data-id="'+a.id+'" class="secondary">Finalise auction</button>':!user?'<a class="atm-live-button" href="#/account">Sign in to bid</a>':l.seller_id===user.id?'<p>You cannot bid on your own listing.</p>':mode==='seller'?'<p>Switch to Buyer Mode to bid.</p>':ownTop?'<p>You currently hold the highest bid.</p>':`<div class="atm-live-bid"><h2>Propose your bid</h2><strong id="atm-live-amount">${K(proposed)}</strong><input type="range" data-bid="${E(a.id)}" min="${min}" max="${max}" step="${a.bid_increment}" value="${proposed}"><div class="atm-live-scale"><span>${K(min)}</span><span>${K(max)}</span></div><h3>Privileges if you win</h3>${perks.map(p=>`<div class="atm-live-perk ${proposed>=p.threshold_amount?'active':''}" data-at="${p.threshold_amount}"><b>${proposed>=p.threshold_amount?'✓':'◷'}</b><span>${E(p.label)}<small>Unlock at ${K(p.threshold_amount)}</small></span></div>`).join('')||'<p>No bonus perks configured.</p>'}<p class="atm-live-note">Sliding never places a bid. Rewards apply only if you win.</p><button class="primary" data-action="bid" data-id="${E(a.id)}" id="atm-live-submit">Confirm ${K(proposed)} bid</button></div>`}${user&&l.seller_id!==user.id?'<button class="secondary" data-action="watch" data-id="'+E(a.id)+'">'+(db.watches.some(w=>w.auction_id===a.id)?'Unwatch':'Watch auction')+'</button>':''}<h2>Public bid history</h2>${feed.length?feed.map(b=>'<div class="atm-live-line"><span>'+E(b.bidder_alias)+'</span><b>'+K(b.amount)+'</b></div>').join(''):'<p>No bids yet.</p>'}<p class="atm-live-note">Bidder names and confidential maximum amounts are never published.</p>`;
}
function myBids(){
 if(!user)return auth();const ids=new Set([...db.mine.map(x=>x.auction_id),...db.watches.map(x=>x.auction_id)]);
 return `<h1>My bids & watchlist</h1>${db.auctions.filter(a=>ids.has(a.id)).map(a=>`<a class="atm-live-line" href="#/auction/${a.id}"><b>${E(listing(a.listing_id)?.title||'Rental')}</b><span>${K(a.highest_bid??a.starting_bid)} · ${E(a.status)}</span></a>`).join('')||'<p>No bids or watched auctions.</p>'}`;
}
function trips(){
 if(!user)return auth();
 return `<h1>My bookings</h1><p>Payment states are authoritative on the server, never from this browser.</p>${db.bookings.map(b=>`<article class="atm-live-booking"><b>${E(listing(b.listing_id)?.title||'Rental')}</b><p>Hire: ${E(b.rental_start)} to ${E(b.rental_end)} · Total ${K(b.total_amount)}</p><p>Rewards: ${E((b.rewards_snapshot||[]).map(p=>p.label).join(' • ')||'Standard terms')}</p><strong>Status: ${E(b.status)}</strong>${b.status==='paid'?'<a class="atm-live-button" href="#/messages/'+E(b.id)+'">Private booking chat</a>':'<p class="atm-live-note">Waiting for a verified payment callback. Payment provider not configured.</p>'}</article>`).join('')||'<p>No winning rentals yet.</p>'}`;
}
function offers(){
 if(!user)return auth();
 const own=db.offers.filter(o=>mode==='buyer'?o.buyer_id===user.id:db.listings.some(l=>l.id===o.listing_id&&l.seller_id===user.id));
 return `<h1>${mode==='seller'?'Offers received':'My price offers'}</h1>${own.map(o=>`<article class="atm-live-booking"><b>${E(listing(o.listing_id)?.title||'Rental')}</b><p>Offered ${K(o.offered_amount)} · ${E(o.status)}</p>${o.counter_amount?'<p>Counter '+K(o.counter_amount)+'</p>':''}${mode==='seller'&&o.status==='pending'?'<button class="primary" data-action="respond" data-id="'+E(o.id)+'" data-response="accept">Accept</button><button class="secondary" data-action="respond" data-id="'+E(o.id)+'" data-response="counter">Counter</button><button class="secondary" data-action="respond" data-id="'+E(o.id)+'" data-response="decline">Decline</button>':''}${mode==='buyer'&&o.status==='countered'?'<button class="primary" data-action="respond" data-id="'+E(o.id)+'" data-response="accept">Accept counter</button>':''}</article>`).join('')||'<p>No offers.</p>'}`;
}
function account(){
 return !user?auth():`<h1>My ATM account</h1><p>${E(user.email)}</p><p>Mode: ${E(mode)} · Seller profile: ${seller?E(seller.business_name):'not yet created'}</p><button data-action="signout" class="secondary">Sign out</button>`;
}
function messages(id){
 if(!user)return auth();const b=db.bookings.find(b=>b.id===id);
 if(!b||b.status!=='paid')return '<h1>Chat is locked until provider-verified payment.</h1>';
 return `<h1>Secure booking chat</h1>${db.messages.filter(m=>m.booking_id===id).map(m=>'<div class="atm-live-line">'+E(m.body)+'</div>').join('')||'<p>No messages yet.</p>'}<form data-form="message" class="atm-live-form"><input type="hidden" name="booking" value="${E(id)}"><label>Message<textarea name="body" maxlength="1500" required></textarea></label><button class="primary">Send</button></form>`;
}
function draw(){
 const [p,id]=page();let content=p==='browse'?browse():p==='auctions'?browse(true):p==='account'?account():p==='seller'?sellerPage():p==='new'?newListing():p==='item'?itemView(listing(id)):p==='auction'?auctionView(auction(id)):p==='mybids'?myBids():p==='trips'?trips():p==='offers'?offers():p==='messages'?messages(id):browse();
 R.innerHTML=base(content);
}
async function profile(){
 if(!user){seller=null;return;}
 seller=await errData(api.from('atm_sellers').select('user_id,business_name,avatar_url,city').eq('user_id',user.id).maybeSingle());
}
async function reload(){
 if(!api||polling)return;polling=true;
 try{
  const [ls,as,ps,ss]=await Promise.all([
    errData(api.from('atm_listings').select('*').eq('active',true).limit(100)),
    errData(api.from('atm_auctions').select('*').limit(100)),
    errData(api.from('atm_perks').select('*').limit(300)),
    errData(api.from('atm_sellers').select('user_id,business_name,avatar_url,city').limit(100))
  ]);
  db.listings=ls;db.auctions=as;db.perks=ps;db.sellers=ss;
  const [p,id]=page();db.feed=p==='auction'?await errData(api.from('atm_bid_feed').select('*').eq('auction_id',id).order('amount',{ascending:false}).limit(50)):[];
  if(user){const [m,w,b,o]=await Promise.all([
    errData(api.rpc('atm_my_bids')),
    errData(api.from('atm_watches').select('*').eq('user_id',user.id)),
    errData(api.from('atm_bookings').select('*').limit(100)),
    errData(api.from('atm_offers').select('*').limit(100))
  ]);db.mine=m;db.watches=w;db.bookings=b;db.offers=o;
   db.messages=p==='messages'?await errData(api.from('atm_messages').select('*').eq('booking_id',id).order('created_at',{ascending:true})):[];}
  else {db.mine=[];db.watches=[];db.bookings=[];db.offers=[];db.messages=[];}
  flash='';draw();
 }catch(e){flash=e.hint||e.message||'Connection failed';console.error(e);draw();}
 finally{polling=false;}
}
async function authState(){
 const r=await api.auth.getUser();user=r.data?.user||null;await profile();await reload();
}
async function transact(fn){
 if(busy)return;busy=true;try{await fn();await reload();}catch(e){flash=e.hint||e.message||'Request failed';console.error(e);draw();}finally{busy=false;}
}
R.addEventListener('click',async ev=>{
 const b=ev.target.closest('[data-action]');if(!b)return;ev.preventDefault();
 const action=b.dataset.action,id=b.dataset.id;
 if(action==='mode'){mode=b.dataset.mode==='seller'?'seller':'buyer';localStorage.setItem('atm-live-mode',mode);go(mode==='seller'?'seller':'browse');return;}
 if(action==='signout')return transact(async()=>{await errData(api.auth.signOut());user=null;seller=null;go('browse');});
 if(action==='watch')return transact(async()=>{if(!user)throw Error('Sign in first');const watched=db.watches.some(w=>w.auction_id===id);if(watched)await errData(api.from('atm_watches').delete().eq('user_id',user.id).eq('auction_id',id));else await errData(api.from('atm_watches').insert({user_id:user.id,auction_id:id}));});
 if(action==='settle')return transact(async()=>{await errData(api.rpc('atm_settle_auction',{p_auction_id:id}));});
 if(action==='bid')return transact(async()=>{const a=auction(id),l=listing(a?.listing_id);if(!user||!a||l?.seller_id===user.id||a.status!=='live')throw Error('You are not permitted to bid');const amount=proposed||low(a);if(!confirm('Confirm '+K(amount)+' bid? No money is collected now.'))return;await errData(api.rpc('atm_place_bid',{p_auction_id:id,p_amount:amount,p_request_key:crypto.randomUUID()}));proposed=0;});
 if(action==='respond')return transact(async()=>{let n=null;if(b.dataset.response==='counter'){const v=prompt('Counter amount in K');if(v===null)return;n=Number(v);if(!Number.isInteger(n)||n<1||n>1000000)throw Error('Invalid counter amount');}await errData(api.rpc('atm_respond_offer',{p_offer_id:id,p_action:b.dataset.response,p_counter_amount:n}));});
});
R.addEventListener('input',ev=>{const e=ev.target;
 if(e.dataset.bid){proposed=Number(e.value);const label=R.querySelector('#atm-live-amount'),btn=R.querySelector('#atm-live-submit');if(label)label.textContent=K(proposed);if(btn)btn.textContent='Confirm '+K(proposed)+' bid';R.querySelectorAll('[data-at]').forEach(p=>{p.classList.toggle('active',proposed>=Number(p.dataset.at));p.querySelector('b').textContent=proposed>=Number(p.dataset.at)?'✓':'◷';});}
 else if(e.dataset.change==='pricing'){R.querySelector('#atm-live-auction-fields').hidden=e.value!=='auction';}
});
R.addEventListener('submit',async ev=>{
 const form=ev.target.closest('[data-form]');if(!form)return;ev.preventDefault();if(!form.reportValidity())return;
 const f=new FormData(form),type=form.dataset.form;
 await transact(async()=>{
  if(type==='auth'){const email=String(f.get('email')).trim(),password=String(f.get('password'));if(ev.submitter?.value==='register'){const r=await errData(api.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}}));if(!r.session){alert('Please check your email to confirm your account before signing in.');return;}}else await errData(api.auth.signInWithPassword({email,password}));await authState();go('browse');}
  else if(type==='seller'){if(!user)throw Error('Sign in first');await errData(api.from('atm_sellers').insert({user_id:user.id,business_name:String(f.get('business_name')).trim(),avatar_url:String(f.get('avatar_url')).trim(),city:String(f.get('city')).trim()}));await profile();go('seller');}
  else if(type==='listing'){if(!seller||!user)throw Error('Seller profile required');const method=String(f.get('pricing')),auc=method==='auction',images=String(f.get('images')).split(/[\n,]+/).map(x=>x.trim()).filter(Boolean);if(images.length<1||images.length>10||images.some(x=>!/^https:\/\/[^\s"<>]+$/i.test(x)))throw Error('Provide one to ten valid HTTPS image URLs');const rewards=[0,1,2].map(i=>({at:Number(f.get('perkAt'+i)),label:String(f.get('perkLabel'+i)||'').trim()})).filter(x=>x.label);await errData(api.rpc('atm_create_listing',{p_title:String(f.get('title')).trim(),p_description:String(f.get('description')).trim(),p_category:String(f.get('category')),p_subcategory:String(f.get('subcategory')).trim(),p_city:String(f.get('city')).trim(),p_image_urls:images,p_price_amount:Number(f.get('price')),p_deposit_amount:Number(f.get('deposit')||0),p_pricing_mode:method,p_request_key:form.dataset.requestKey||crypto.randomUUID(),p_starting_bid:auc?Number(f.get('startBid')):null,p_bid_increment:auc?Number(f.get('increment')):null,p_reserve_amount:auc?Number(f.get('reserve')||0):0,p_duration_hours:auc?Number(f.get('duration')):null,p_rental_start:auc?String(f.get('rentalStart')):null,p_rental_end:auc?String(f.get('rentalEnd')):null,p_rewards:auc?rewards:[]}));go('seller');}
  else if(type==='offer'){await errData(api.rpc('atm_submit_offer',{p_listing_id:String(f.get('listing_id')),p_amount:Number(f.get('amount'))}));go('offers');}
  else if(type==='message'){if(!user)throw Error('Sign in');await errData(api.from('atm_messages').insert({booking_id:String(f.get('booking')),sender_id:user.id,body:String(f.get('body')).trim()}));form.reset();}
 });
});
window.addEventListener('hashchange',()=>{proposed=0;reload();});
setInterval(()=>{const el=R.querySelector('#atm-live-clock'),[p,id]=page();if(el&&p==='auction'){const a=auction(id);if(a&&a.status==='live')el.textContent=T(a.ends_at);}},1000);
setInterval(()=>{if(!document.hidden&&api)reload();},25000);
async function start(){
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(C.url||'')||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(C.publishableKey||'')){
  R.innerHTML='<header class="atm-live-top"><a class="atm-live-logo" href="./index.html#/home">ATM</a><span>LIVE ACCOUNT BETA</span></header><main class="atm-live-main"><h1>ATM Live awaits its own database</h1><p>The backend migrations and authenticated client have been prepared. A dedicated ATM Supabase project must be connected before real user accounts and auctions are enabled.</p><p>Neither Kora Central nor Kora Business will be reused.</p><a class="atm-live-button" href="./index.html#/home">Return to ATM demo</a><p class="atm-live-note">See docs/ATM_LIVE_BACKEND.md for setup and security checks.</p></main>';return;
 }
 try{const m=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/+esm');
  api=m.createClient(C.url,C.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  mode=localStorage.getItem('atm-live-mode')==='seller'?'seller':'buyer';
  if(!location.hash)location.hash='#/browse';
  await authState();
  chan=api.channel('atm-live-updates').on('postgres_changes',{event:'*',schema:'public',table:'atm_auctions'},()=>reload())
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'atm_bid_feed'},()=>reload())
   .subscribe((status,e)=>{if(['CHANNEL_ERROR','TIMED_OUT'].includes(status))console.warn('Realtime unavailable, polling used',e);});
  api.auth.onAuthStateChange(()=>setTimeout(()=>authState().catch(console.error),0));
 }catch(e){R.innerHTML='<main class="atm-live-main"><h1>Connection failed</h1><p>'+E(e.message||e)+'</p><a href="./index.html#/home">Open ATM demo</a></main>';console.error(e);}
}
start();
