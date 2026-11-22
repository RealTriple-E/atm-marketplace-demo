/* Run: node --test tests/auction-model.test.cjs */
const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window={};
require('../atm-auctions.js');
const A=global.window.ATM_Auctions;
const local=()=>({auctionSeeded:true,auctions:[],auctionBids:[],auctionWatches:[]});
const valid=()=>({hours:24,startingBid:100,increment:25,reserve:125,rentalStart:A.isoDate(6),rentalEnd:A.isoDate(7),perks:[{at:150,label:'Free local delivery'},{at:200,label:'Extra accessory'}]});
test('four seeded auctions and fictional competitors initialise only once',()=>{
 const state={};assert.equal(A.init(state),true);
 assert.equal(state.auctions.length,4);assert.equal(state.auctionBids.length,12);
 assert.equal(A.init(state),false);assert.equal(state.auctionBids.length,12);
});
test('seller auction is configured for a specific rental period',()=>{
 const listing={id:1000,pricingMode:'auction'},state=local();
 listing.auction=A.configure(listing,valid());
 assert.equal(A.get(state,listing).rentalStart,A.isoDate(6));
 assert.equal(A.get(state,listing).rentalEnd,A.isoDate(7));
 assert.equal(A.minBid(state,listing,listing.auction),100);
});
test('minimum increments, bid validity, top bidder and competitor bidding are enforced',()=>{
 const listing={id:1001,pricingMode:'auction'},state=local();
 listing.auction=A.configure(listing,valid());
 assert.equal(A.placeBid(state,listing,101,A.ACTOR,'You').ok,false);
 assert.equal(A.placeBid(state,listing,100,A.ACTOR,'You').ok,true);
 assert.equal(A.placeBid(state,listing,125,A.ACTOR,'You').ok,false);
 assert.equal(A.placeBid(state,listing,125,'demo-other','Demo bidder').ok,true);
 assert.equal(A.countBidders(state,listing.id),2);
 assert.equal(A.current(state,listing.id).amount,125);
});
test('reward tiers depend on the qualifying bid, not slider movement',()=>{
 const listing={id:1002,pricingMode:'auction'};listing.auction=A.configure(listing,valid());
 assert.equal(A.unlocked(listing.auction,149).length,0);
 assert.deepEqual(A.unlocked(listing.auction,150).map(x=>x.label),['Free local delivery']);
 assert.equal(A.unlocked(listing.auction,225).length,2);
});
test('reserve price is honoured and a closed auction cannot accept new bids',()=>{
 const listing={id:1003,pricingMode:'auction'},state=local();
 listing.auction=A.configure(listing,valid());
 assert.equal(A.placeBid(state,listing,100,A.ACTOR,'You').ok,true);
 listing.auction.endsAt=Date.now()-1000;
 assert.equal(A.close(state,listing,listing.auction),true);
 assert.equal(listing.auction.winnerId,null);
 assert.equal(A.placeBid(state,listing,125,'demo-opponent','Demo').ok,false);
 assert.equal(A.close(state,listing,listing.auction),false);
});
test('highest qualifying bid wins and earned perks are frozen at settlement',()=>{
 const listing={id:1004,pricingMode:'auction'},state=local();
 listing.auction=A.configure(listing,valid());
 A.placeBid(state,listing,150,A.ACTOR,'You');
 listing.auction.endsAt=Date.now()-1;
 assert.equal(A.close(state,listing,listing.auction),true);
 assert.equal(listing.auction.winnerId,A.ACTOR);
 assert.equal(listing.auction.winningAmount,150);
 assert.deepEqual(listing.auction.winningPerks,['Free local delivery']);
});
test('bid in final two minutes extends the auction',()=>{
 const listing={id:1005,pricingMode:'auction'},state=local();
 listing.auction=A.configure(listing,valid());
 const firstEnd=Date.now()+60_000;listing.auction.endsAt=firstEnd;
 assert.equal(A.placeBid(state,listing,100,A.ACTOR,'You').ok,true);
 assert.equal(listing.auction.endsAt,firstEnd+120_000);
});
test('invalid pricing and rental periods are rejected',()=>{
 const listing={id:1006};
 assert.throws(()=>A.configure(listing,{...valid(),increment:0}));
 assert.throws(()=>A.configure(listing,{...valid(),rentalStart:'2020-01-01'}));
 assert.throws(()=>A.configure(listing,{...valid(),hours:169}));
});
