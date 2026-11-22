/* ATM local-only auction domain. No live bidder accounts, payments or server authority. */
(function(root){
  'use strict';
  var ACTOR='local-demo-buyer';
  var seeded=[
    {listingId:3,startingBid:400,increment:25,reserve:500,hours:48,rentalOffset:8,rentalDays:2,perks:[{at:550,label:'Complimentary tripod'},{at:700,label:'Free local delivery (eligible areas)'},{at:900,label:'Extra camera battery'}]},
    {listingId:4,startingBid:750,increment:50,reserve:900,hours:72,rentalOffset:12,rentalDays:1,perks:[{at:1000,label:'Free microphone'},{at:1250,label:'Free local delivery (eligible areas)'},{at:1500,label:'Extra setup support'}]},
    {listingId:18,startingBid:600,increment:50,reserve:750,hours:24,rentalOffset:9,rentalDays:2,perks:[{at:800,label:'Extra battery'},{at:1000,label:'Free local delivery (eligible areas)'},{at:1250,label:'Extended equipment orientation'}]},
    {listingId:22,startingBid:500,increment:50,reserve:650,hours:36,rentalOffset:14,rentalDays:1,perks:[{at:700,label:'Extra prop pack'},{at:900,label:'Free setup in eligible zones'},{at:1100,label:'Branded welcome screen'}]}
  ];
  function isoDate(offset){
    var d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function init(state){
    if(!Array.isArray(state.auctions))state.auctions=[];
    if(!Array.isArray(state.auctionBids))state.auctionBids=[];
    if(!Array.isArray(state.auctionWatches))state.auctionWatches=[];
    if(state.auctionSeeded===true)return false;
    var now=Date.now();
    seeded.forEach(function(x,i){
      if(state.auctions.some(function(a){return String(a.listingId)===String(x.listingId);}))return;
      state.auctions.push({listingId:x.listingId,startingBid:x.startingBid,increment:x.increment,reserve:x.reserve,
        startAt:now,endsAt:now+x.hours*3600000,rentalStart:isoDate(x.rentalOffset),
        rentalEnd:isoDate(x.rentalOffset+x.rentalDays-1),perks:x.perks,status:'live',demo:true});
      [0,1,2].forEach(function(j){
        state.auctionBids.push({id:'seed-'+x.listingId+'-'+j,listingId:x.listingId,
          bidderId:'sample-'+i+'-'+j,bidderLabel:'Demo bidder '+String.fromCharCode(65+j),
          amount:x.startingBid+j*x.increment,created:now-7200000+(j*1300000),demo:true});
      });
    });
    state.auctionSeeded=true;
    return true;
  }
  function get(state,l){
    if(!l)return null;
    if(l.auction&&l.pricingMode==='auction')return l.auction;
    return state.auctions.find(function(a){return String(a.listingId)===String(l.id);})||null;
  }
  function bids(state,listingId){
    return (state.auctionBids||[]).filter(function(b){return String(b.listingId)===String(listingId);})
      .sort(function(a,b){return b.amount-a.amount||a.created-b.created;});
  }
  function current(state,listingId){return bids(state,listingId)[0]||null;}
  function countBidders(state,listingId){return new Set(bids(state,listingId).map(function(x){return x.bidderId;})).size;}
  function minBid(state,l,a){var top=current(state,l.id);return top?top.amount+a.increment:a.startingBid;}
  function unlocked(a,amount){return (a.perks||[]).filter(function(p){return Number(p.at)>0&&amount>=Number(p.at);});}
  function status(a,now){now=now||Date.now();return a.status==='closed'||now>=a.endsAt?'closed':now<a.startAt?'scheduled':'live';}
  function close(state,l,a,now){
    if(!a||a.status==='closed'||status(a,now)!=='closed')return false;
    a.status='closed';
    var top=current(state,l.id);
    a.winnerId=top&&top.amount>=Number(a.reserve||0)?top.bidderId:null;
    a.winningAmount=a.winnerId?top.amount:null;
    a.winningPerks=a.winnerId?unlocked(a,top.amount).map(function(p){return p.label;}):[];
    return true;
  }
  function placeBid(state,l,amount,bidderId,bidderLabel){
    var a=get(state,l),now=Date.now();amount=Number(amount);
    if(!a)return {ok:false,error:'This listing is not an auction.'};
    if(status(a,now)!=='live')return {ok:false,error:'This auction is not open for bidding.'};
    if(!Number.isSafeInteger(amount)||amount<1||amount>1000000)return {ok:false,error:'Choose a valid bid of K1 to K1,000,000.'};
    var minimum=minBid(state,l,a);
    if(amount<minimum||(amount-minimum)%a.increment!==0)return {ok:false,error:'Your bid must meet the minimum and bidding increment.'};
    var top=current(state,l.id);
    if(top&&top.bidderId===bidderId)return {ok:false,error:'You already hold the highest bid. Wait for another bidder.'};
    var row={id:'bid-'+now+'-'+Math.random().toString(36).slice(2,7),listingId:l.id,bidderId:bidderId,
      bidderLabel:bidderLabel,amount:amount,created:now,demo:bidderId!==ACTOR};
    state.auctionBids.push(row);
    if(a.endsAt-now<=120000)a.endsAt+=120000; // disclosed anti-sniping extension
    return {ok:true,bid:row,perks:unlocked(a,amount)};
  }
  function configure(l,options){
    var now=Date.now(),hours=Number(options.hours);
    if(!Number.isInteger(hours)||hours<1||hours>168)throw Error('Auction duration must be 1–168 hours.');
    var start=Number(options.startingBid),increment=Number(options.increment),reserve=Number(options.reserve||0);
    if(!Number.isSafeInteger(start)||start<=0||start>1000000||!Number.isSafeInteger(increment)||increment<=0||increment>100000||!Number.isSafeInteger(reserve)||reserve<0||reserve>1000000)throw Error('Check starting bid, reserve and increment amounts.');
    if(!/^\d{4}-\d\d-\d\d$/.test(options.rentalStart)||!/^\d{4}-\d\d-\d\d$/.test(options.rentalEnd)||options.rentalStart<isoDate(1)||options.rentalEnd<options.rentalStart||options.rentalEnd>isoDate(120))throw Error('Choose valid future rental dates within 120 days.');
    var perks=(options.perks||[]).map(function(p){return {at:Number(p.at),label:String(p.label||'').trim().slice(0,90)};})
      .filter(function(p){return p.label&&Number.isSafeInteger(p.at)&&p.at>=start&&p.at<=1000000;})
      .sort(function(a,b){return a.at-b.at;});
    return {listingId:l.id,startingBid:start,increment:increment,reserve:reserve,
      startAt:now,endsAt:now+hours*3600000,rentalStart:options.rentalStart,rentalEnd:options.rentalEnd,
      perks:perks,status:'live',demo:true};
  }
  function remaining(end){
    var secs=Math.max(0,Math.ceil((end-Date.now())/1000)),d=Math.floor(secs/86400),
      h=Math.floor((secs%86400)/3600),m=Math.floor((secs%3600)/60),s=secs%60;
    return (d?d+'d ':'')+[h,m,s].map(function(n){return String(n).padStart(2,'0');}).join(':');
  }
  root.ATM_Auctions={ACTOR:ACTOR,init:init,get:get,bids:bids,current:current,countBidders:countBidders,
    minBid:minBid,unlocked:unlocked,status:status,close:close,placeBid:placeBid,configure:configure,remaining:remaining,isoDate:isoDate};
})(window);
