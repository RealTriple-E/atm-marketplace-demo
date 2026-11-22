'use strict';
// Browser-only ATM concept regression suite. Never contacts a payment provider.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const BASE='http://127.0.0.1:4173/';
fs.mkdirSync('artifacts',{recursive:true});
const errors=[];
async function caseRun(name,work,width=390,height=844){
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const p=await ctx.newPage();
  p.on('pageerror',e=>errors.push(name+': '+e.message));
  p.on('dialog',d=>d.accept());
  try{
    await p.goto(BASE+'#/home',{waitUntil:'domcontentloaded'});
    await p.locator('.atm-home').waitFor();
    await work(p);
    assert.equal(errors.filter(e=>e.startsWith(name+':')).length,0,errors.join('; '));
    console.log('PASS '+name);
  }catch(e){
    try{await p.screenshot({path:'artifacts/'+name+'-failure.png'});}catch(_){}
    throw e;
  }finally{await ctx.close();await browser.close();}
}
async function widthOK(p){
  const w=await p.evaluate(()=>{
    const scroll=document.documentElement.scrollWidth,viewport=document.documentElement.clientWidth;
    const offenders=[...document.querySelectorAll('body *')].map(el=>{
      const r=el.getBoundingClientRect();
      return {name:el.tagName.toLowerCase(),className:typeof el.className==='string'?el.className.slice(0,100):'',
        left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),
        scrollWidth:el.scrollWidth,clientWidth:el.clientWidth};
    }).filter(x=>x.right>viewport+2&&x.left>=0).slice(0,25);
    return {scroll,viewport,offenders};
  });
  assert.ok(w.scroll<=w.viewport+2,'Horizontal overflow '+JSON.stringify(w));
}
async function home(p){
  assert.equal(await p.locator('.atm-category-circle-item').count(),6);
  assert.equal(await p.locator('.atm-home-feed .feed-card').count(),20);
  assert.equal(await p.locator('.atm-live-entry').count(),0);
  await widthOK(p);
  await p.screenshot({path:'artifacts/home-mobile.png'});
  await p.locator('.atm-category-circle-item').first().click();
  await p.locator('.atm-category-page').waitFor();
  assert.ok(await p.locator('.trending-rail .trend-card').count()>0);
  await p.locator('.atm-subcategory-rail .atm-subchip').nth(1).click();
  await widthOK(p);
  await p.goto(BASE+'#/home');
  await p.locator('.atm-home-feed .feed-photo-btn').first().click();
  await p.locator('.atm-v15-detail').waitFor();
  assert.ok(await p.locator('#atm-gallery-track .atm-v15-slide').count()>=3);
  await p.locator('[data-action="gallerynext"]').click();
  await p.waitForTimeout(300);
  assert.ok((await p.locator('#atm-photo-counter').textContent()).includes('2 /'),'Gallery next failed');
  assert.equal(await p.locator('.atm-v15-host img').count(),1);
  assert.equal(await p.locator('.atm-v15-detail [data-action="chat"]').count(),0);
  await p.screenshot({path:'artifacts/gallery-mobile.png'});
  await p.locator('.atm-v15-host').click();
  await p.locator('.atm-v15-seller').waitFor();
  assert.equal(await p.locator('.atm-v15-seller-portrait img').count(),1);
}
async function seller(p){
  await p.goto(BASE+'#/account');
  await p.locator('[data-action="switchmode"][data-mode="seller"]').click();
  await p.locator('.atm-seller-dashboard').waitFor();
  await p.screenshot({path:'artifacts/seller-mobile.png'});
  await p.locator('[data-action="go"][data-route="post"]').first().click();
  await p.locator('#post-title').fill('ATM QA Toyota Fortuner for rental');
  await p.locator('#post-price').fill('750');
  await p.locator('#post-deposit').fill('200');
  await p.locator('#post-description').fill('A fictional rental vehicle with a complete gallery, clear hire terms and flexible collection arrangements in Lusaka.');
  await p.locator('#post-image-2').fill('https://images.unsplash.com/photo-1503376780353-7e6692767b70');
  await p.locator('#post-image-3').fill('https://images.unsplash.com/photo-1485291571150-772bcfc10da5');
  await p.locator('form[data-form="post"] button[type="submit"]').click();
  await p.locator('.atm-v15-detail').waitFor();
  assert.equal(await p.locator('#atm-gallery-track .atm-v15-slide').count(),3);
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('atm-marketplace-demo-v3')).myListings.length),1);
  await p.goto(BASE+'#/mylistings');
  await p.locator('.my-listing-row').waitFor();
  await widthOK(p);
}
async function booking(p){
  await p.goto(BASE+'#/listing/24');
  await p.locator('.atm-v15-detail').waitFor();
  assert.equal(await p.locator('.atm-v15-detail [data-action="chat"]').count(),0);
  await p.locator('.listing-offer-dock [data-action="reserve"]').click();
  await p.locator('.atm-checkout-sheet').waitFor();
  assert.equal(await p.locator('.atm-payment-choice').count(),4);
  await p.locator('[data-atmf="method"][data-value="bank"]').click();
  await p.screenshot({path:'artifacts/reserve-mobile.png'});
  await p.locator('[data-atmf="pay"]').click();
  await p.locator('.atm-confirmed').waitFor({timeout:10000});
  await p.locator('[data-atmf="trip"]').click();
  await p.locator('.booking-card').first().waitFor();
  assert.ok(await p.locator('.booking-card-actions [data-action="chat"]').count()>0,'Post-payment chat locked');
  await p.locator('.booking-card-actions [data-action="chat"]').first().click();
  await p.locator('#messages-list').waitFor();
  await p.locator('input[name="message"]').fill('When is collection?');
  await p.locator('form[data-form="chat"] button[type="submit"]').click();
  assert.ok((await p.locator('#messages-list').textContent()).includes('When is collection?'));
  await p.goto(BASE+'#/rentals');
  await p.locator('.booking-card-actions [data-action="cancelbooking"]').first().click();
  assert.equal(await p.locator('.booking-card-actions [data-action="chat"]').count(),0,'Cancel did not revoke chat');
}
async function auction(p){
  await p.evaluate(()=>{
    const k='atm-marketplace-demo-v3',s=JSON.parse(localStorage.getItem(k));
    const a=s.auctions.find(x=>String(x.listingId)==='3');
    if(!a)throw Error('Sample auction missing');
    a.startAt=Date.now()-86400000;a.endsAt=Date.now()-1000;a.status='live';
    s.auctionBids.push({id:'qa-winner',listingId:3,bidderId:'local-demo-buyer',
       bidderLabel:'You',amount:1000,created:Date.now()-5000,demo:false});
    localStorage.setItem(k,JSON.stringify(s));
  });
  await p.goto(BASE+'#/mybids');
  // Hash navigation does not reload the app's in-memory state; reload after fixture edit.
  await p.reload({waitUntil:'domcontentloaded'});
  await p.locator('[data-action="claimwin"]').first().click();
  await p.locator('.atm-checkout-sheet').waitFor();
  const bill=await p.locator('.atm-bill').textContent();
  assert.ok(bill.includes('Winning bid'),'No winning-total label');
  const rental=await p.locator('.atm-bill > div').first().textContent();
  assert.ok(rental.includes('K1,000')&&!rental.includes('K2,000'),'Auction doubled the winning bid');
  assert.equal(await p.locator('.atm-locked-auction-range').count(),1);
  assert.equal(await p.locator('.atm-checkout-sheet [data-atmf="calendar"]').count(),0);
  await p.screenshot({path:'artifacts/auction-winner-mobile.png'});
  await p.locator('[data-atmf="pay"]').click();
  await p.locator('.atm-confirmed').waitFor({timeout:10000});
  const s=await p.evaluate(()=>JSON.parse(localStorage.getItem('atm-marketplace-demo-v3')));
  const b=s.bookings.find(x=>x.auctionWinningTotal===1000);
  assert.ok(b,'Auction booking missing');
  assert.equal(b.rent,1000,'Winning bid was multiplied');
  assert.ok(b.total>1000&&b.total<1900,'Auction was overcharged');
  assert.equal(s.auctions.find(x=>String(x.listingId)==='3').paidBookingId,b.id);
}
async function main(){
  await caseRun('home-categories-gallery',home);
  await caseRun('seller-photo-publishing',seller);
  await caseRun('reserve-payment-chat',booking);
  await caseRun('auction-winner-total',auction);
  await caseRun('desktop',async p=>{
    await widthOK(p);
    assert.equal(await p.locator('.atm-home-feed .feed-card').count(),20);
    await p.screenshot({path:'artifacts/desktop-home.png'});
  },1440,900);
  await caseRun('mobile-320',async p=>{
    await widthOK(p);
    await p.goto(BASE+'#/listing/24');
    await widthOK(p);
    await p.locator('.listing-offer-dock [data-action="reserve"]').click();
    await p.locator('.atm-checkout-sheet').waitFor();
  },320,700);
  console.log('ATM CONCEPT BROWSER TESTS ALL PASSED');
}
main().catch(e=>{console.error(e);process.exitCode=1});
