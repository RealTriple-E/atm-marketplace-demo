/* ATM rental experience — independent implementation of reference interaction patterns.
   Fictional seller/booking/payment data. Never contacts a live host or payment provider. */
(function () {
  "use strict";
  var bridge=null, modal=null, flow=null, calendar=null, selections={}, timer=null;
  var cash=function(n){return "K"+Math.round(Number(n)||0).toLocaleString("en-US");};
  var esc=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});};
  var iso=function(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
  var parse=function(s){return new Date(s+"T12:00:00");};
  var add=function(s,n){var d=parse(s);d.setDate(d.getDate()+n);return iso(d);};
  var today=function(){return iso(new Date());};
  var showDate=function(s){return parse(s).toLocaleDateString("en-GB",{day:"numeric",month:"short"});};
  var duration=function(a,b,unit){return Math.max(1,Math.round((parse(b)-parse(a))/86400000)+(unit==="night"?0:1));};
  var endFrom=function(start,count,unit){return add(start,count-(unit==="night"?0:1));};
  var icon=function(name){var svg={minus:"<path d='M5 12h14'/>",plus:"<path d='M12 5v14M5 12h14'/>",close:"<path d='M5 5l14 14M19 5 5 19'/>",calendar:"<rect x='3' y='5' width='18' height='16' rx='2'/><path d='M7 3v4M17 3v4M3 10h18'/>",arrow:"<path d='m9 18 6-6-6-6'/>",back:"<path d='m15 18-6-6 6-6'/>",check:"<path d='m5 12 4 4L19 6'/>",gavel:"<path d='m14 5 5 5M12 7l5 5M3 21l11-11M10 2l12 12-3 3L7 5Z'/>",phone:"<rect x='7' y='2' width='10' height='20' rx='2'/><path d='M11 18h2'/>",wallet:"<rect x='2' y='5' width='20' height='15' rx='3'/><path d='M16 10h6v6h-6a3 3 0 0 1 0-6Z'/>",credit:"<rect x='2' y='5' width='20' height='14' rx='2'/><path d='M2 10h20'/>",spark:"<path d='m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z'/>"};return "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>"+(svg[name]||svg.check)+"</svg>";};
  var unit=function(l){return l.category==="Property"?"night":"day";};
  var caps=function(l){return l.category==="Property"?"Guests":"People";};
  var blocked=function(s,l){var d=parse(s),id=Number(l.id)||1;return d.getDate()===((id*7)%23+3)||d.getDate()===((id*11)%23+3);};
  var allowed=function(start,end,l,u){if(!start||!end||start<today()||end<start||(u==='night'&&end===start))return false;var n=duration(start,end,u);if(n>90||n<1)return false;for(var day=start;day<=end;day=add(day,1)){if(blocked(day,l))return false;}return true;};
  var firstDate=function(l){for(var d=today(),i=0;i<120;i++,d=add(d,1))if(!blocked(d,l))return d;return add(today(),1);};
  var selectRange=function(l){var x=selections[l.id],u=unit(l);if(x&&allowed(x.start,x.end,l,u))return x;var start=firstDate(l),end=start;for(var attempt=0;attempt<120;attempt++,start=add(start,1)){if(blocked(start,l))continue;var first=endFrom(start,1,u);if(!allowed(start,first,l,u))continue;end=first;for(var i=2;i<=3;i++){var next=endFrom(start,i,u);if(allowed(start,next,l,u))end=next;else break;}return {start:start,end:end};}return {start:today(),end:endFrom(today(),1,u)};};
  var offerIncrement=function(p){return p<500?10:p<1000?25:50;};
  var suggestedAmounts=function(p){var increment=offerIncrement(p);return Array.from(new Set([.8,.9,1].map(function(v){return Math.max(increment,Math.round(p*v/increment)*increment)})));};
  var makeFlow=function(l,mode){var r=selectRange(l),u=unit(l),n=duration(r.start,r.end,u),increment=offerIncrement(l.price);return {listing:l,mode:mode||"offer",phase:mode==="reserve"?"checkout":"compose",start:r.start,end:r.end,days:n,people:2,amount:Math.max(increment,Math.round(l.price*.85/increment)*increment),rate:l.price,method:"mtn",offerId:null,discount:0};};
  var root=function(){if(!modal){modal=document.createElement("div");modal.id="atm-flow-root";document.body.appendChild(modal);}return modal;};
  var sync=function(){root().innerHTML=render();if(modal.firstElementChild){document.body.classList.add("atm-modal-open");}else{document.body.classList.remove("atm-modal-open");}};
  var close=function(){if(timer){clearTimeout(timer);timer=null;}if(confettiTimer){clearTimeout(confettiTimer);confettiTimer=null;}flow=null;calendar=null;if(modal)modal.innerHTML="";document.body.classList.remove("atm-modal-open");};
  var page=function(title,body,cls){return "<div class='atm-overlay' role='presentation' data-atmf='close'><section class='atm-sheet "+(cls||"")+"' role='dialog' aria-modal='true' aria-label='"+esc(title)+"'><div class='atm-drag'></div><div class='atm-sheet-head'><span class='atm-head-space'></span><h2>"+esc(title)+"</h2><button type='button' class='atm-circle-close' data-atmf='close' aria-label='Close'>"+icon("close")+"</button></div><div class='atm-sheet-content'>"+body+"</div></section></div>";};
  var listingCard=function(l){return "<div class='atm-flow-listing'><img src='"+esc(l.image)+"' alt=''><div><strong>"+esc(l.title)+"</strong><small>"+esc(l.city)+", Zambia · Listed at "+cash(l.price)+" / "+unit(l)+"</small></div></div>";};
  var stepper=function(label,value,key,min,max,hint){return "<div class='atm-stepper' data-stepper='"+key+"'><div><strong>"+esc(label)+"</strong>"+(hint?"<small>"+esc(hint)+"</small>":"")+"</div><div class='atm-stepper-buttons'><button type='button' data-atmf='step' data-key='"+key+"' data-dir='-1' aria-label='Fewer "+esc(label)+"' "+(value<=min?"disabled":"")+">"+icon("minus")+"</button><span aria-live='polite'>"+value+"</span><button type='button' data-atmf='step' data-key='"+key+"' data-dir='1' aria-label='More "+esc(label)+"' "+(value>=max?"disabled":"")+">"+icon("plus")+"</button></div></div>";};
  var datesRail=function(){var out="<div class='atm-flow-label'>"+(unit(flow.listing)==="night"?"Check-in":"Start date")+" <button type='button' class='atm-inline-link' data-atmf='calendar'>Full calendar "+icon("calendar")+"</button></div><div class='atm-date-rail'>";for(var i=0;i<12;i++){var s=add(today(),i),ban=blocked(s,flow.listing),sel=s===flow.start;out+="<button type='button' class='atm-date-pill "+(sel?"active ":"")+(ban?"blocked":"")+"' data-atmf='date' data-date='"+s+"' "+(ban?"disabled":"")+"><b>"+(i===0?"Today":i===1?"Tomorrow":parse(s).toLocaleDateString("en-GB",{weekday:"short"}))+"</b><small>"+showDate(s)+"</small></button>";}return out+"</div>";};
  var totalDays=function(){return flow.days||duration(flow.start,flow.end,unit(flow.listing));};
  var rangeText=function(){return showDate(flow.start)+" – "+showDate(flow.end)+" · "+totalDays()+" "+(unit(flow.listing)==="night"?"night":"day")+(totalDays()===1?"":"s");};
  var chance=function(){
    /* Reference interaction bands: percentages are offer / list price.
       These labels are illustrative guidance, never a prediction. */
    var ratio=flow.amount/flow.listing.price;
    if(ratio>=.96)return ["Very likely accepted",95,"very"];
    if(ratio>=.88)return ["Good chance",75,"high"];
    if(ratio>=.75)return ["Host may counter",50,"medium"];
    if(ratio>=.65)return ["Ambitious",28,"ambitious"];
    return ["Unlikely",10,"low"];
  };
  var compose=function(){var l=flow.listing,c=chance(),proposals=suggestedAmounts(l.price);var body=listingCard(l)+"<div class='atm-price-controls'><div class='atm-price-step'><button data-atmf='price' data-dir='-1' aria-label='Reduce offered price'>"+icon("minus")+"</button><div><strong>"+cash(flow.amount)+"</strong><small>per "+unit(l)+"</small></div><button data-atmf='price' data-dir='1' aria-label='Increase offered price'>"+icon("plus")+"</button></div><div class='atm-chance atm-likelihood-"+c[2]+"' data-likelihood='"+c[2]+"'><div class='atm-meter' role='progressbar' aria-label='Illustrative acceptance likelihood' aria-valuemin='0' aria-valuemax='100' aria-valuenow='"+c[1]+"'><span style='width:"+c[1]+"%'></span></div><b>"+c[0]+"</b></div><div class='atm-amount-chips'>"+proposals.map(function(v){return "<button class='"+(flow.amount===v?"active":"")+"' data-atmf='amount' data-value='"+v+"'>"+cash(v)+"</button>";}).join("")+"</div></div>"+datesRail()+stepper(unit(l)==="night"?"Nights":"Days",flow.days,"days",1,90,"Longer rentals may be more attractive to hosts")+stepper(caps(l),flow.people,"people",1,12,"No change to offer price")+"<div class='atm-total-block'><div><span>Your total offer</span><strong>"+cash(flow.amount*totalDays())+"</strong></div><button class='atm-main-cta' data-atmf='send'>Send offer to "+esc(l.owner.split(" ")[0])+" "+icon("arrow")+"</button><small>Demo only · No payment until an offer is accepted.</small></div>";
 return page("Make an offer",body,"atm-offer-sheet");};
  var waiting=function(){var l=flow.listing;var body="<div class='atm-wait-panel'><div class='atm-wait-visual'><div class='atm-orbit'></div><span class='atm-wait-gavel'>"+icon("gavel")+"</span><span class='atm-wait-avatar'>"+esc(l.owner.split(" ").slice(0,2).map(function(x){return x[0];}).join(""))+"</span></div><h3>Waiting for "+esc(l.owner.split(" ")[0])+"…</h3><p>Your offer of <b>"+cash(flow.amount)+"/"+unit(l)+"</b> has entered the demo seller response sequence.</p><div class='atm-wait-dots'><i></i><i></i><i></i></div><small>Simulated response · No real host is contacted.</small></div>";
 return page("Offer sent",body,"atm-offer-sheet");};
  var counter=function(){var l=flow.listing, o=bridge.getOffer(flow.offerId),status=o?o.status:"Counteroffer",rate=o&&o.counter||flow.rate;if(status==="Accepted"){return page("Offer accepted","<div class='atm-response-panel'><div class='atm-response-icon atm-accepted-icon'>"+icon("check")+"</div><h3>Offer accepted! 🎉</h3><p>"+esc(l.owner.split(" ")[0])+" accepted "+cash(flow.amount)+"/"+unit(l)+". Lock it in before someone else books. <small>Demo response only.</small></p><button class='atm-main-cta' data-atmf='checkout'>Reserve at "+cash(flow.amount)+" / "+unit(l)+" "+icon("arrow")+"</button></div>","atm-offer-sheet");}
 if(status==="Declined"){return page("Offer declined","<div class='atm-response-panel'><div class='atm-response-icon atm-counter-icon'>"+icon("gavel")+"</div><h3>Try a different price</h3><p>This example host could not accept "+cash(flow.amount)+"/"+unit(l)+".</p><button class='atm-main-cta' data-atmf='retry'>Make a new offer "+icon("arrow")+"</button></div>","atm-offer-sheet");}
 return page(esc(l.owner.split(" ")[0])+" countered","<div class='atm-response-panel'><div class='atm-response-icon atm-counter-icon'>"+icon("gavel")+"</div><h3>"+esc(l.owner.split(" ")[0])+" countered</h3><p>They can do <b>"+cash(rate)+"/"+unit(l)+"</b> for "+totalDays()+" "+unit(l)+(totalDays()===1?"":"s")+". That's "+cash(Math.max(0,(l.price-rate)*totalDays()))+" below the listed total.</p><button class='atm-main-cta' data-atmf='accept'>Book at "+cash(rate)+" / "+unit(l)+" "+icon("arrow")+"</button><button class='atm-secondary-cta' data-atmf='retry'>Make a new offer</button></div>","atm-offer-sheet");};
  var service=80;
  var paymentItems=[["mtn","MTN MoMo","Instant · 2% processing","phone"],["airtel","Airtel Money","Instant · 2% processing","phone"],["card","Visa / Mastercard","International cards · 3.6% processing","credit"],["bank","Bank transfer","Demo confirmation · no processing fee","wallet"]];
  var paymentBrand=function(provider){
    if(provider==="mtn")return "<span class='atm-pay-brand atm-pay-brand-mtn' aria-label='MTN MoMo, yellow badge'>"+icon("phone")+"</span>";
    if(provider==="airtel")return "<span class='atm-pay-brand atm-pay-brand-airtel' aria-label='Airtel Money, red badge'>"+icon("phone")+"</span>";
    if(provider==="card")return "<span class='atm-pay-brand atm-pay-brand-card' aria-label='Visa or Mastercard, blue badge'>"+icon("credit")+"</span>";
    return "<span class='atm-pay-brand atm-pay-brand-bank' aria-label='Bank transfer, slate badge'>"+icon("wallet")+"</span>";
  };
  var bill=function(){var l=flow.listing,rate=flow.rate,d=totalDays(),r=rate*d,discount=(l.category==="Property"&&!flow.offerId&&d>=3)?Math.round(r*.05):0,deposit=Math.round(l.deposit||0),base=r-discount+deposit+service,fee=Math.round(base*(flow.method==="card"?.036:(flow.method==="bank"?0:.02)));return {rate:rate,days:d,rent:r,discount:discount,deposit:deposit,service:service,fee:fee,total:base+fee};};
  var checkout=function(){var l=flow.listing,b=bill(),unitName=unit(l);
   var methods=paymentItems.map(function(p){return "<button type='button' class='atm-payment-choice "+(flow.method===p[0]?"selected":"")+"' data-atmf='method' data-value='"+p[0]+"'>"+paymentBrand(p[0])+"<span><b>"+p[1]+"</b><small>"+p[2]+"</small></span><i>"+(flow.method===p[0]?icon("check"):"")+"</i></button>";}).join("");
   var number=(flow.method==="mtn"||flow.method==="airtel")?"<div class='atm-demo-number'><span>Fictional demo mobile number</span><strong>"+(flow.method==="airtel"?"+260 97 000 0000":"+260 96 000 0000")+"</strong><small>Illustrative number only. No actual money prompt or phone contact occurs.</small></div>":"<div class='atm-demo-number'><small>No card or bank details are needed for this demonstration.</small></div>";
   var price="<div class='atm-bill'><h3>Price details</h3><div><span>"+cash(b.rate)+" × "+b.days+" "+unitName+(b.days===1?"":"s")+"</span><b>"+cash(b.rent)+"</b></div>"+(b.discount?"<div><span>Long-stay discount (5%)</span><b>−"+cash(b.discount)+"</b></div>":"")+(b.deposit?"<div><span>Illustrative refundable deposit</span><b>"+cash(b.deposit)+"</b></div>":"")+"<div><span>ATM service fee</span><b>"+cash(b.service)+"</b></div>"+(b.fee?"<div><span>Payment processing ("+(flow.method==="card"?"3.6":"2.0")+"%)</span><b>"+cash(b.fee)+"</b></div>":"")+"<div class='atm-bill-total'><span>Total (K)</span><strong>"+cash(b.total)+"</strong></div></div>";
   var body=listingCard(l)+(flow.offerId?"<div class='atm-negotiated'>Negotiated: "+cash(flow.rate)+" / "+unitName+" (listed "+cash(l.price)+")</div>":"")+
   "<div class='atm-stepper-heading'>Your rental</div><button type='button' class='atm-range-summary' data-atmf='calendar'>"+icon("calendar")+"<span>"+rangeText()+"</span>"+icon("arrow")+"</button>"+stepper(unitName==="night"?"Nights":"Days",flow.days,"days",1,90,"")+stepper(caps(l),flow.people,"people",1,12,"")+
   "<h3 class='atm-payment-title'>Choose how to pay</h3><div class='atm-payment-list'>"+methods+"</div>"+number+price+
   "<button type='button' class='atm-main-cta' data-atmf='pay'>Pay "+cash(b.total)+" (demo) "+icon("arrow")+"</button><small class='atm-disclaimer'>Simulation only · No payment, phone request or bank transfer is made. Actual host rules and cancellation terms are not connected.</small>";
   return page("Confirm and pay",body,"atm-checkout-sheet");};
  var approval=function(){var l=flow.listing,b=bill(),method=paymentItems.find(function(p){return p[0]===flow.method;})||paymentItems[0];return page("Confirm and pay","<div class='atm-approval-panel'><div class='atm-approval-phone'>"+icon("phone")+"<span>1</span></div><h3>"+(flow.method==="mtn"?"Approve on your MTN phone":flow.method==="airtel"?"Approve on your Airtel phone":"Confirming your demo reservation")+"</h3><p>Simulating "+cash(b.total)+" via "+method[1]+". No real approval, PIN, card or money transfer is required.</p><div class='atm-approval-progress'><span></span></div><small>Preparing your demo confirmation…</small></div>","atm-checkout-sheet");};
  var confirmed=function(){var b=flow.booking,l=flow.listing;return page("Reservation confirmed","<div class='atm-confirmed'><div class='atm-confirm-mark'>"+icon("check")+"</div><h3>You're going to "+esc(l.city)+"!</h3><p>"+esc(l.title)+" · "+showDate(flow.start)+" – "+showDate(flow.end)+"</p><div class='atm-whatsapp'><div><strong>WhatsApp-style preview · ATM</strong><small>demo ✓✓</small></div><p>Booking confirmed ✓ "+esc(l.title)+", "+totalDays()+" "+unit(l)+(totalDays()===1?"":"s")+" from "+showDate(flow.start)+". Total "+cash(b.total)+". Reference "+esc(b.ref)+". "+(l.category==="Property"?"Example self check-in code: •••• (unlocks 24h before arrival in a real service). ":"")+"Rental handover details are arranged with the host in a real marketplace. No message was sent.</p></div><button class='atm-main-cta' data-atmf='trip'>View my trip "+icon("arrow")+"</button><button class='atm-secondary-cta' data-atmf='explore'>Keep exploring</button><small>Demonstration booking only · No real item reserved or payment collected.</small></div>","atm-checkout-sheet");};
  var calendarContent=function(){var l=calendar.listing,month=new Date(calendar.month+"-01T12:00:00"),year=month.getFullYear(),mo=month.getMonth(),start=new Date(year,mo,1),days=new Date(year,mo+1,0).getDate(),offset=(start.getDay()+6)%7,grid="<div class='atm-calendar-days'>"+["M","T","W","T","F","S","S"].map(function(w){return "<span>"+w+"</span>";}).join("")+"</div><div class='atm-calendar-grid'>";for(var k=0;k<offset;k++)grid+="<span class='atm-calendar-space'></span>";for(var d=1;d<=days;d++){var dt=iso(new Date(year,mo,d)),disabled=dt<today()||dt>add(today(),120)||blocked(dt,l),picked=dt===calendar.start||dt===calendar.end,mid=calendar.start&&calendar.end&&dt>calendar.start&&dt<calendar.end;grid+="<button type='button' class='atm-calendar-day "+(disabled?"disabled ":"")+(picked?"selected ":"")+(mid?"in-range":"")+"' data-atmf='pickday' data-date='"+dt+"' "+(disabled?"disabled aria-disabled='true'":"")+">"+d+"</button>";}grid+="</div>";
   var body="<p class='atm-calendar-hint'>Tap your start and end dates. Crossed-out dates are illustrative unavailable dates, not live bookings.</p><div class='atm-cal-nav'><button data-atmf='month' data-dir='-1' aria-label='Previous month'>"+icon("back")+"</button><strong>"+month.toLocaleDateString("en-GB",{month:"long",year:"numeric"})+"</strong><button data-atmf='month' data-dir='1' aria-label='Next month'>"+icon("arrow")+"</button></div>"+grid+"<div class='atm-selected-dates'><div><small>Start</small><strong>"+(calendar.start?showDate(calendar.start):"Select")+"</strong></div><div><small>End</small><strong>"+(calendar.end?showDate(calendar.end):"Select")+"</strong></div></div><button class='atm-main-cta' data-atmf='applydates' "+(!calendar.start?"disabled":"")+">Apply dates "+icon("arrow")+"</button>";return page("Select rental dates",body,"atm-calendar-sheet");};
  var render=function(){if(calendar)return calendarContent();if(!flow)return "";return flow.phase==="compose"?compose():flow.phase==="waiting"?waiting():flow.phase==="response"?counter():flow.phase==="checkout"?checkout():flow.phase==="approval"?approval():flow.phase==="confirmed"?confirmed():"";};
  var moveDuration=function(dir){var u=unit(flow.listing),n=Math.max(1,Math.min(90,flow.days+dir)),end=endFrom(flow.start,n,u);if(!allowed(flow.start,end,flow.listing,u))return false;flow.days=n;flow.end=end;return true;};
  var openCalendar=function(l){if(!l)return;var context=flow&&String(flow.listing.id)===String(l.id),r=context?flow:selectRange(l);calendar={listing:l,start:r.start,end:r.end,month:(r.start||today()).slice(0,7),context:context};sync();};
  /* Short, dependency-free confetti celebration. This never changes the sheet
     structure and runs only after a demo seller accepts an offered amount. */
  var confettiTimer=null;
  var celebrate=function(){
    if(!modal||!modal.querySelector)return;
    var sheet=modal.querySelector(".atm-sheet");
    if(!sheet)return;
    var old=sheet.querySelector(".atm-confetti");
    if(old&&old.remove)old.remove();
    var burst=document.createElement("div");
    burst.className="atm-confetti";
    burst.setAttribute("aria-hidden","true");
    var colors=["#ef4444","#f59e0b","#10b981","#3b82f6","#e879f9","#ffcc00","#ffffff"];
    var pieces=[];
    for(var i=0;i<65;i++){
      var angle=(i/65)*Math.PI*2;
      var drift=Math.round(Math.cos(angle)*(70+Math.random()*175));
      var lift=Math.round(Math.sin(angle)*(85+Math.random()*155)-65);
      var x=Math.round(12+Math.random()*76);
      var delay=Math.round(Math.random()*180);
      var rotation=Math.round(360+Math.random()*720);
      pieces.push("<i style='--cx:"+x+"%;--tx:"+drift+"px;--ty:"+lift+"px;--r:"+rotation+"deg;--delay:"+delay+"ms;--shade:"+colors[i%colors.length]+"'></i>");
    }
    burst.innerHTML=pieces.join("");
    sheet.appendChild(burst);
    if(confettiTimer)clearTimeout(confettiTimer);
    confettiTimer=setTimeout(function(){if(burst&&burst.remove)burst.remove();confettiTimer=null;},2100);
  };
  var updateResponse=function(){timer=null;if(!flow||flow.phase!=="waiting")return;var l=flow.listing,ratio=flow.amount/l.price,stat=ratio>=.92?"Accepted":ratio>=.69?"Counteroffer":"Declined",counter=stat==="Counteroffer"?Math.min(l.price,Math.max(flow.amount+50,Math.round(l.price*.91/50)*50)):null;bridge.updateOffer(flow.offerId,{status:stat,counter:counter,agreedRate:stat==="Accepted"?flow.amount:null,responded:Date.now()});flow.rate=stat==="Counteroffer"?counter:flow.amount;flow.phase="response";sync();if(stat==="Accepted")celebrate();};
  /* Update only the individual values inside an existing sheet. This preserves
     the bottom sheet DOM node, scroll position, drag handle and opening animation. */
  var updateControls=function(){
    if(!flow||!modal)return;
    var sheet=modal.querySelector(".atm-sheet");
    if(!sheet){sync();return;}
    var animateValue=function(el,value){
      if(!el)return;
      value=String(value);
      if(el.textContent===value)return;
      el.textContent=value;
      if(typeof el.animate==="function"&&!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)){
        el.animate([{opacity:.55,transform:"translateY(5px)"},{opacity:1,transform:"translateY(0)"}],{duration:200,easing:"ease-out"});
      }
    };
    var allSteppers=sheet.querySelectorAll("[data-stepper]");
    allSteppers.forEach(function(row){
      var key=row.dataset.stepper,value=key==="days"?flow.days:flow.people,minimum=1,maximum=key==="days"?90:12;
      animateValue(row.querySelector(".atm-stepper-buttons span"),value);
      row.querySelectorAll(".atm-stepper-buttons button").forEach(function(button){
        button.disabled=Number(button.dataset.dir)<0?value<=minimum:value>=maximum;
      });
    });
    var summary=sheet.querySelector(".atm-range-summary span");
    if(summary)animateValue(summary,rangeText());
    if(flow.phase==="compose"){
      animateValue(sheet.querySelector(".atm-price-step strong"),cash(flow.amount));
      var chanceNow=chance(),meter=sheet.querySelector(".atm-meter"),line=sheet.querySelector(".atm-meter span");
      if(line)line.style.width=chanceNow[1]+"%";
      if(meter)meter.setAttribute("aria-valuenow",String(chanceNow[1]));
      var likelihood=sheet.querySelector(".atm-chance");
      if(likelihood){
        likelihood.classList.remove("atm-likelihood-low","atm-likelihood-ambitious","atm-likelihood-medium","atm-likelihood-high","atm-likelihood-very");
        likelihood.classList.add("atm-likelihood-"+chanceNow[2]);
        likelihood.dataset.likelihood=chanceNow[2];
      }
      animateValue(sheet.querySelector(".atm-chance b"),chanceNow[0]);
      sheet.querySelectorAll(".atm-amount-chips button").forEach(function(button){
        var selected=Number(button.dataset.value)===flow.amount;
        button.classList.toggle("active",selected);
        button.setAttribute("aria-pressed",String(selected));
      });
      sheet.querySelectorAll(".atm-date-rail button[data-date]").forEach(function(button){
        button.classList.toggle("active",button.dataset.date===flow.start);
        button.setAttribute("aria-pressed",String(button.dataset.date===flow.start));
      });
      animateValue(sheet.querySelector(".atm-total-block>div strong"),cash(flow.amount*totalDays()));
    }else if(flow.phase==="checkout"){
      /* Recalculate only payment selectors and totals; do not remount the sheet. */
      var tmp=document.createElement("div");
      tmp.innerHTML=checkout();
      [".atm-payment-list",".atm-demo-number",".atm-bill",".atm-main-cta"].forEach(function(selector){
        var oldNode=sheet.querySelector(selector),fresh=tmp.querySelector(selector);
        if(oldNode&&fresh)oldNode.replaceWith(fresh);
      });
    }
  };
  var actions={
    close:function(){close();},
    price:function(b){var inc=offerIncrement(flow.listing.price),step=Math.max(inc,Math.round(flow.listing.price*.05/inc)*inc);flow.amount=Math.max(inc,Math.min(1000000,flow.amount+Number(b.dataset.dir||1)*step));updateControls();},
    amount:function(b){flow.amount=Number(b.dataset.value);updateControls();},
    date:function(b){var s=b.dataset.date,ee=endFrom(s,flow.days,unit(flow.listing));if(!allowed(s,ee,flow.listing,unit(flow.listing))){var first=endFrom(s,1,unit(flow.listing));if(!allowed(s,first,flow.listing,unit(flow.listing))){notify("Select another available start date");return;}flow.start=s;flow.end=first;flow.days=1;}else{flow.start=s;flow.end=ee;}updateControls();},
    step:function(b){var dir=Number(b.dataset.dir||1),k=b.dataset.key;if(k==="people"){flow.people=Math.max(1,Math.min(12,flow.people+dir));updateControls();}else if(k==="days"){if(!moveDuration(dir))notify("Those dates are unavailable in this demo");updateControls();}},
    calendar:function(){openCalendar(flow.listing);},
    pickday:function(b){var s=b.dataset.date;if(!calendar.start||calendar.end||s<=calendar.start){calendar.start=s;calendar.end="";}else{var u=unit(calendar.listing);if(!allowed(calendar.start,s,calendar.listing,u)){notify("This date range includes an unavailable date");return;}calendar.end=s;}sync();},
    month:function(b){var d=new Date(calendar.month+"-01T12:00:00");d.setMonth(d.getMonth()+Number(b.dataset.dir));var m=iso(d).slice(0,7);if(m<today().slice(0,7)||m>add(today(),120).slice(0,7))return;calendar.month=m;sync();},
    applydates:function(){if(!calendar.start)return;var u=unit(calendar.listing),end=calendar.end||calendar.start;if(u==="night"&&end===calendar.start)end=add(end,1);if(!allowed(calendar.start,end,calendar.listing,u)){notify("Select available dates");return;}selections[calendar.listing.id]={start:calendar.start,end:end};if(calendar.context&&flow){flow.start=calendar.start;flow.end=end;flow.days=duration(flow.start,flow.end,u);calendar=null;sync();}else{calendar=null;close();bridge.refresh();}},
    send:function(){if(!bridge||!flow)return;var o={id:Date.now()+Math.floor(Math.random()*10000),listingId:flow.listing.id,amount:flow.amount,note:"",start:flow.start,end:flow.end,days:flow.days,guests:flow.people,status:"Pending",counter:null,agreedRate:null,created:Date.now()};bridge.addOffer(o);flow.offerId=o.id;flow.phase="waiting";sync();if(timer)clearTimeout(timer);timer=setTimeout(updateResponse,4200);},
    accept:function(){var o=bridge.getOffer(flow.offerId);if(o&&o.status==="Counteroffer"){bridge.updateOffer(o.id,{status:"Accepted",agreedRate:o.counter});flow.rate=o.counter;}flow.phase="checkout";sync();celebrate();},
    checkout:function(){var o=bridge.getOffer(flow.offerId);flow.rate=o&&o.agreedRate||flow.amount;flow.phase="checkout";sync();},
    retry:function(){flow.phase="compose";flow.amount=Math.max(50,Math.round(flow.listing.price*.9/50)*50);flow.offerId=null;sync();},
    method:function(b){flow.method=b.dataset.value;updateControls();},
    pay:function(){flow.phase="approval";sync();if(timer)clearTimeout(timer);timer=setTimeout(function(){if(!flow||flow.phase!=="approval")return;var b=bill();var ref="ATM-DEMO-"+Math.random().toString(36).slice(2,8).toUpperCase();var booking={id:Date.now(),ref:ref,listingId:flow.listing.id,start:flow.start,end:flow.end,days:flow.days,guests:flow.people,method:paymentItems.find(function(p){return p[0]===flow.method;})[1]+" (demo)",status:"Confirmed (demo)",agreedRate:flow.rate,total:b.total,rent:b.rent,serviceFee:b.service,processingFee:b.fee,deposit:b.deposit,offerId:flow.offerId,created:Date.now()};flow.booking=booking;bridge.addBooking(booking);flow.phase="confirmed";sync();},4200);},
    trip:function(){close();bridge.navigate("rentals");},
    explore:function(){close();bridge.navigate("home");}
  };
  function notify(msg){var el=document.getElementById("toast");if(el){el.textContent=msg;el.classList.add("show");setTimeout(function(){el.classList.remove("show");},3000);}}
  document.addEventListener("click",function(e){var b=e.target.closest("[data-atmf]");if(!b)return;e.preventDefault();e.stopPropagation();var key=b.dataset.atmf;if(key==="close"&&b.classList.contains("atm-overlay")&&e.target.closest(".atm-sheet"))return;if(actions[key])actions[key](b);},true);
  /* Drag the grey sheet handle down to dismiss; never intercept inner scrolling. */
  var drag=null;
  document.addEventListener("pointerdown",function(e){
    var handle=e.target.closest&&e.target.closest(".atm-drag");
    if(!handle||!modal||!modal.firstElementChild)return;
    var sheet=handle.closest(".atm-sheet");
    if(!sheet)return;
    drag={id:e.pointerId,start:e.clientY,sheet:sheet,moved:0};
    sheet.style.transition="none";
    if(handle.setPointerCapture)try{handle.setPointerCapture(e.pointerId);}catch(_){}
  });
  document.addEventListener("pointermove",function(e){
    if(!drag||e.pointerId!==drag.id)return;
    var y=Math.max(0,e.clientY-drag.start);
    drag.moved=y;
    drag.sheet.style.transform="translate3d(0,"+y+"px,0)";
  });
  var finishDrag=function(e){
    if(!drag||e.pointerId!==drag.id)return;
    var d=drag;drag=null;
    if(d.moved>105){d.sheet.style.transform="";d.sheet.style.transition="";close();return;}
    d.sheet.style.transition="transform .22s cubic-bezier(.2,.8,.3,1)";
    d.sheet.style.transform="";
    setTimeout(function(){if(d.sheet)d.sheet.style.transition="";},250);
  };
  document.addEventListener("pointerup",finishDrag);
  document.addEventListener("pointercancel",finishDrag);
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&(flow||calendar)){close();}});
  window.ATMFlow={
    init:function(api){bridge=api;},
    offer:function(l){if(!l)return;close();flow=makeFlow(l,"offer");sync();},
    reserve:function(l,agreedOffer){if(!l)return;close();flow=makeFlow(l,"reserve");if(agreedOffer){flow.start=agreedOffer.start||flow.start;flow.end=agreedOffer.end||flow.end;flow.days=duration(flow.start,flow.end,unit(l));flow.people=agreedOffer.guests||2;flow.offerId=agreedOffer.id;flow.rate=agreedOffer.agreedRate||agreedOffer.counter||l.price;}sync();},
    calendar:function(l){if(!l)return;close();openCalendar(l);},
    selection:function(l){var r=selectRange(l);return showDate(r.start)+" – "+showDate(r.end);},
    dismiss:close,
    isActive:function(){return !!flow||!!calendar;}
  };
})();