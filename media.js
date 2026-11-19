/* ATM v15 curated media + fictional seller profiles (all people, ratings and reviews are demo data).
   Uses Unsplash stock photography for item categories and Pravatar sample portraits.
   Never infer ownership or verification from the appearance of an image. */
const ATM_STOCK=(id,width=1200)=>'https://images.unsplash.com/'+id+'?auto=format&fit=crop&w='+width+'&q=86';
const ATM_PHOTO_SETS={
 'Sedans & Hatchbacks':['photo-1494976388531-d1058494cdd8','photo-1542362567-b07e54358753','photo-1503376780353-7e6692767b70'],
 'SUVs & 4×4s':['photo-1549317661-bd32c8ce0db2','photo-1519641471654-76ce0107ad1b','photo-1503376780353-7e6692767b70'],
 'Safari & Tour Vehicles':['photo-1695367255171-72e83ebddb8d','photo-1792824418533-593a04879d06','photo-1759130534259-273e015f70f9'],
 'Motorbikes & Scooters':['photo-1558981806-ec527fa84c39','photo-1464822759023-fed622ff2c3b','photo-1517649763962-0c623066013b'],
 'Buses & Minibuses':['photo-1623094701717-b186ec95acff','photo-1605410522294-80aa1f8b4153','photo-1772380043298-6544d49a8f64'],
 'Pickups & Vans':['photo-1566933293069-b55c7f326dd4','photo-1519641471654-76ce0107ad1b','photo-1549317661-bd32c8ce0db2'],
 'Trucks & Haulage':['photo-1586191582151-f73872dfd183','photo-1519003722824-194d4455a60c','photo-1566933293069-b55c7f326dd4'],
 'Bicycles & E-bikes':['photo-1485965120184-e220f721d03e','photo-1517649763962-0c623066013b','photo-1507035895480-2b3156c31fc8'],
 'Boats & Watercraft':['photo-1500534314209-a25ddb2bd429','photo-1519046904884-53103b34b206','photo-1544551763-46a013bb70d5'],
 'Aircraft & Helicopters':['photo-1464037866556-6812c9d1c72e','photo-1436491865332-7a61a109cc05','photo-1506947411487-a56738267384'],
 'Campers & Motorhomes':['photo-1504280390367-361c6d9f38f4','photo-1532339142463-fd0a8979791a','photo-1478131143081-80f7f84ca84d'],
 'Specialised Vehicles':['photo-1586191582151-f73872dfd183','photo-1566933293069-b55c7f326dd4','photo-1449965408869-eaa3f722e40d'],
 'Hand & Power Tools':['photo-1504148455328-c376907d081c','photo-1530124566582-a618bc2615dc','photo-1581092160562-40aa08e78837'],
 'Construction Machinery':['photo-1780054984791-ef3f58ca753e','photo-1740765428765-fc958dc5e3e7','photo-1504307651254-35680f356dfd'],
 'Agricultural Equipment':['photo-1758608951432-773ae6a33f56','photo-1781785162688-2a50338fe9a7','photo-1500382017468-9049fed747ef'],
 'Gardening & Landscaping':['photo-1416879595882-3373a0480b5b','photo-1497250681960-ef046c08a56e','photo-1463320726281-696a485928c7'],
 'Power & Electrical':['photo-1681263576605-9eda564bcfcc','photo-1581092446327-9b52bd1570c2','photo-1473341304170-971dccb5ac1e'],
 'Cleaning Equipment':['photo-1581578731548-c64695cc6952','photo-1523413651479-597eb2da0ad6','photo-1581092160562-40aa08e78837'],
 'Industrial & Workshop':['photo-1581092160607-ee22621dd758','photo-1504307651254-35680f356dfd','photo-1504148455328-c376907d081c'],
 'Lifting & Access':['photo-1487958449943-2429e8be8625','photo-1504307651254-35680f356dfd','photo-1581092160607-ee22621dd758'],
 'Cameras & Electronics':['photo-1516035069371-29a1b244cc32','photo-1492691527719-9d1e07e534b4','photo-1542038784456-1ea8e935640e'],
 'Specialist Equipment':['photo-1574717024653-61fd2cf4d44d','photo-1581092160562-40aa08e78837','photo-1516035069371-29a1b244cc32'],
 'Tents & Marquees':['photo-1519167758481-83f550bb49b3','photo-1519741497674-611481863552','photo-1511795409834-ef04bbd61622'],
 'Chairs & Tables':['photo-1519741497674-611481863552','photo-1503602642458-232111445657','photo-1511795409834-ef04bbd61622'],
 'Sound & DJ Equipment':['photo-1493225457124-a3eb161ffa5f','photo-1506157786151-b8491531f063','photo-1516280440614-37939bbacd81'],
 'Lighting & Stage':['photo-1506157786151-b8491531f063','photo-1492684223066-81342ee5ff30','photo-1493225457124-a3eb161ffa5f'],
 'Decor & Accessories':['photo-1519225421980-715cb0215aed','photo-1519741497674-611481863552','photo-1511795409834-ef04bbd61622'],
 'Catering Equipment':['photo-1555244162-803834f70033','photo-1556910103-1c02745aae4d','photo-1495474472287-4d71bcdd2085'],
 'Photography Booths':['photo-1517457373958-b7bdd4587205','photo-1516035069371-29a1b244cc32','photo-1492691527719-9d1e07e534b4'],
 'Children’s Events':['photo-1544551763-46a013bb70d5','photo-1511795409834-ef04bbd61622','photo-1533174072545-7a4b6ad7a6c3'],
 'Screens & Displays':['photo-1492684223066-81342ee5ff30','photo-1574717024653-61fd2cf4d44d','photo-1506157786151-b8491531f063'],
 'Event Packages':['photo-1519741497674-611481863552','photo-1511795409834-ef04bbd61622','photo-1519167758481-83f550bb49b3'],
 'Houses & Apartments':['photo-1600596542815-ffad4c1539a9','photo-1600607687939-ce8a6c25118c','photo-1564013799919-ab600027ffc6'],
 'Lodges & Accommodation':['photo-1613490493576-7fde63acd811','photo-1600585154340-be6161a56a0c','photo-1600607687939-ce8a6c25118c'],
 'Event Venues':['photo-1519741497674-611481863552','photo-1511795409834-ef04bbd61622','photo-1600607687939-ce8a6c25118c'],
 'Offices & Workspaces':['photo-1497366811353-6870744d04b2','photo-1497366858526-0766cadbe8fa','photo-1497366754035-f200968a6e72'],
 'Warehouses & Storage':['photo-1586528116311-ad8dd3c8310d','photo-1497366811353-6870744d04b2','photo-1586191582151-f73872dfd183'],
 'Retail & Commercial':['photo-1441986300917-64674bd600d8','photo-1497366811353-6870744d04b2','photo-1460925895917-afdab827c52f'],
 'Studios & Creative Spaces':['photo-1516035069371-29a1b244cc32','photo-1492691527719-9d1e07e534b4','photo-1497366811353-6870744d04b2'],
 'Outdoor & Agricultural Land':['photo-1500382017468-9049fed747ef','photo-1499529112087-3cb3b73cec95','photo-1500534623283-312aade485b7'],
 'Parking & Garages':['photo-1503376780353-7e6692767b70','photo-1494976388531-d1058494cdd8','photo-1449965408869-eaa3f722e40d'],
 'Sports Facilities':['photo-1526232761682-d26e03ac148e','photo-1571019613454-1cb2f99b2d8b','photo-1517836357463-d25dfeac3438'],
 'Fashion & Formal Wear':['photo-1595777457583-95e059d581b8','photo-1483985988355-763728e1935b','photo-1558769132-cb1aea458c5e'],
 'Sports & Fitness':['photo-1571019613454-1cb2f99b2d8b','photo-1517836357463-d25dfeac3438','photo-1485965120184-e220f721d03e'],
 'Outdoor & Camping':['photo-1504280390367-361c6d9f38f4','photo-1478131143081-80f7f84ca84d','photo-1532339142463-fd0a8979791a'],
 'Recreation & Games':['photo-1493711662062-fa541adb3fc8','photo-1544551763-46a013bb70d5','photo-1528605248644-14dd04022da1'],
 'Household & Furniture':['photo-1555041469-a586c61ea9bc','photo-1503602642458-232111445657','photo-1600607687939-ce8a6c25118c'],
 'Baby & Family':['photo-1503454537195-1dcabb73ffb9','photo-1515488042361-ee00e0ddd4e4','photo-1555041469-a586c61ea9bc'],
 'Travel Accessories':['photo-1476514525535-07fb3b4ae5f1','photo-1500534623283-312aade485b7','photo-1485965120184-e220f721d03e'],
 'Costumes & Cultural Wear':['photo-1595777457583-95e059d581b8','photo-1558769132-cb1aea458c5e','photo-1483985988355-763728e1935b'],
 'Photography & Videography':['photo-1516035069371-29a1b244cc32','photo-1542038784456-1ea8e935640e','photo-1492691527719-9d1e07e534b4'],
 'Drivers & Transport Services':['photo-1503376780353-7e6692767b70','photo-1560250097-0b93528c311a','photo-1449965408869-eaa3f722e40d'],
 'Cleaning & Maintenance':['photo-1581578731548-c64695cc6952','photo-1523413651479-597eb2da0ad6','photo-1551836022-d5d88e9218df'],
 'Construction & Repairs':['photo-1504307651254-35680f356dfd','photo-1621905251189-08b45d6a269e','photo-1581092160562-40aa08e78837'],
 'Event Professionals':['photo-1493225457124-a3eb161ffa5f','photo-1511795409834-ef04bbd61622','photo-1517457373958-b7bdd4587205'],
 'Beauty & Personal Care':['photo-1524504388940-b1c1722653e1','photo-1487412720507-e7ab37603c6f','photo-1531123897727-8f129e1688ce'],
 'Agricultural Services':['photo-1500382017468-9049fed747ef','photo-1499529112087-3cb3b73cec95','photo-1504307651254-35680f356dfd'],
 'Tutors & Trainers':['photo-1524178232363-1fb2b075b655','photo-1516321318423-f06f85e504b3','photo-1528605248644-14dd04022da1'],
 'Moving & Delivery':['photo-1566933293069-b55c7f326dd4','photo-1586191582151-f73872dfd183','photo-1504307651254-35680f356dfd'],
 'Business & Technical':['photo-1497366811353-6870744d04b2','photo-1542744173-8e7e53415bb0','photo-1551836022-d5d88e9218df']
};
const ATM_OWNER_SEED = ['stock portrait','sample account','illustrative feedback'];
const ATM_HASH=(s)=>Array.from(String(s||'')).reduce((h,c)=>((h*33+c.charCodeAt(0))>>>0),5381);
const ATM_PORTRAIT_IDS=[12,47,13,32,44,49,26,60,16,56,43,5,36,54,29,11,37,59,8,64,68,22,2,41,39,15,20,52,21,25,7,51,34,24,48,35,55,6,46,40,19,62,63,57,14,38,17,30,27,3,45,53,33,50,18,31,28,9,1,10,4,58,23,61,65,66,67,69];
const ATM_HEADSHOT=(seller)=>{const ix=[...new Set(ATM_LISTINGS.map(l=>l.owner))].indexOf(seller);return 'https://i.pravatar.cc/240?img='+ATM_PORTRAIT_IDS[(ix>=0?ix:ATM_HASH(seller))%ATM_PORTRAIT_IDS.length];};
const ATM_SELLER_FALLBACK='https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=85';
const ATM_MEMBER_NAMES=['Martha L.','Daniel M.','Grace C.','Mutale B.','Lydia K.','Brian N.','Thandiwe P.','Josephine M.','Chilufya T.','Mary S.','Lewis P.','Nadia J.'];
const ATM_REVIEW_TEXT=[
 'The listing was clear and the sample booking process was straightforward.',
 'Good communication after confirmation. The item matched the description in this demo.',
 'A well-presented listing with helpful details and convenient date options.',
 'The demonstration made it easy to compare prices and availability.',
 'The service details were clear, and the sample booking journey was easy to follow.',
 'A useful option to compare with other rentals in the same category.',
 'The equipment and conditions were described clearly in this sample experience.'
];
const ATM_MEMBER_DATES=['2018-08-17','2019-02-09','2020-06-24','2021-03-18','2022-11-06','2023-04-12','2024-01-29','2025-05-15'];
const ATM_SELLER_DATA=(name)=>{
  const h=ATM_HASH(name),date=ATM_MEMBER_DATES[h%ATM_MEMBER_DATES.length];
  const owned=ATM_LISTINGS.filter(x=>x.owner===name);
  const score=owned.length?owned.reduce((a,b)=>a+Number(b.rating||4.7),0)/owned.length:4.8;
  return {name,portrait:ATM_HEADSHOT(name),joined:date,rating:Math.min(5,score),reviews:owned.reduce((a,b)=>a+(Number(b.reviews)||0),0),listings:owned.length,
    completed:12+h%186,years:Math.max(0,new Date().getUTCFullYear()-Number(date.slice(0,4))),location:owned[0]?.city||'Lusaka',
    reviewItems:Array.from({length:5},(_,i)=>({name:ATM_MEMBER_NAMES[(h+i*7)%ATM_MEMBER_NAMES.length],score:i===2?4:5,
      date:['Nov 2026','Oct 2026','Sep 2026','Aug 2026','Jul 2026'][i],text:ATM_REVIEW_TEXT[(h+i)%ATM_REVIEW_TEXT.length]}))};
};
/* Prefer item-specific photos over generic subcategory images whenever recognised. */
const ATM_ITEM_OVERRIDES=[
 [/(?:lawn mower|lawnmower|mowing)/i,['photo-1458245201577-fc8a130b8829','photo-1731082686849-d2e0a4d2c70c','photo-1416879595882-3373a0480b5b']],
 [/(?:concrete mixer|cement mixer)/i,['photo-1751221701301-b02ca1b4b49e','photo-1504307651254-35680f356dfd','photo-1740765428765-fc958dc5e3e7']],
 [/(?:flatbed truck|flatbed haulage)/i,['photo-1774133665983-5bb126f59bd1','photo-1586191582151-f73872dfd183','photo-1519003722824-194d4455a60c']],
 [/safari.+(minibus|bus)|tour minibus/i,['photo-1623094701717-b186ec95acff','photo-1605410522294-80aa1f8b4153','photo-1772380043298-6544d49a8f64']],
 [/(?:hilux|hardbody|ford ranger|pickup truck|double cab)/i,['photo-1759213281196-6c5e463b3021','photo-1663576268373-0bef1214f700','photo-1759130534259-273e015f70f9']],
 [/(?:safari|game.drive|off.road jeep)/i,['photo-1695367255171-72e83ebddb8d','photo-1792824418533-593a04879d06','photo-1759130534259-273e015f70f9']],
 [/(?:excavator|earthworks)/i,['photo-1780054984791-ef3f58ca753e','photo-1740765428765-fc958dc5e3e7','photo-1504307651254-35680f356dfd']],
 [/(?:tractor|plough|farm field|harrow|harvester)/i,['photo-1758608951432-773ae6a33f56','photo-1781785162688-2a50338fe9a7','photo-1500382017468-9049fed747ef']],
 [/(?:minibus|coaster|passenger van|tour bus|school bus)/i,['photo-1623094701717-b186ec95acff','photo-1605410522294-80aa1f8b4153','photo-1772380043298-6544d49a8f64']],
 [/(?:generator|power station|portable power|solar backup)/i,['photo-1681263576605-9eda564bcfcc','photo-1581092446327-9b52bd1570c2','photo-1473341304170-971dccb5ac1e']],
 [/(?:camera|canon|sony alpha|photography kit|drone)/i,['photo-1516035069371-29a1b244cc32','photo-1492691527719-9d1e07e534b4','photo-1542038784456-1ea8e935640e']],
 [/(?:mountain bicycle|road bicycle|electric city bicycle|road training bicycle)/i,['photo-1485965120184-e220f721d03e','photo-1517649763962-0c623066013b','photo-1507035895480-2b3156c31fc8']]
];
const ATM_ITEM_GALLERY=(l)=>{
  if(Array.isArray(l.gallery)&&l.gallery.length)return l.gallery.filter(Boolean);
  const match=ATM_ITEM_OVERRIDES.find(([pattern])=>pattern.test(String(l.title||'')));const set=(match&&match[1])||ATM_PHOTO_SETS[l.subcategory]||ATM_PHOTO_SETS['Houses & Apartments'];
  if(l.mediaKind!=='sample-stock'&&l.image)return [l.image];
  // Each generated listing has a consistent, subcategory-specific stock photo sequence.
  const rotation=match?0:ATM_HASH(l.title||l.id)%set.length;
  return [set[rotation],set[(rotation+1)%set.length],set[(rotation+2)%set.length]].map(x=>ATM_STOCK(x,1200));
};
(function curateDemoImages(){
  if(typeof ATM_LISTINGS==='undefined')return;
  ATM_LISTINGS.forEach(l=>{
    l.mediaKind='sample-stock'; // Stock sample listings get a real multi-photo gallery.
    const originals=ATM_ITEM_GALLERY(l);
    l.gallery=originals;
    if(originals.length)l.image=originals[0];
    l.ownerPortrait=ATM_HEADSHOT(l.owner);
  });
})();
