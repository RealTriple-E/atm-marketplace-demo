/* All businesses, listings and prices are fictional demo content. */
const ATM_CATEGORIES = [
  {name:'All',icon:'grid'}, {name:'Vehicles',icon:'car'}, {name:'Events',icon:'party'},
  {name:'Equipment',icon:'camera'}, {name:'Tools',icon:'wrench'}, {name:'Property',icon:'home'},
  {name:'Electronics',icon:'monitor'}, {name:'Farming',icon:'tractor'}, {name:'Fashion',icon:'sparkles'},
  {name:'Services',icon:'briefcase'}
];
const ATM_IMAGE = {
  tent:'photo-1519167758481-83f550bb49b3', car:'photo-1503376780353-7e6692767b70', camera:'photo-1516035069371-29a1b244cc32',
  sound:'photo-1493225457124-a3eb161ffa5f', generator:'photo-1581092160562-40aa08e78837', wedding:'photo-1519741497674-611481863552',
  suv:'photo-1549317661-bd32c8ce0db2', construction:'photo-1504307651254-35680f356dfd', excavator:'photo-1487958449943-2429e8be8625',
  screen:'photo-1492684223066-81342ee5ff30', washer:'photo-1581578731548-c64695cc6952', decor:'photo-1519225421980-715cb0215aed',
  dslr:'photo-1502920917128-1aa500764cbd', tractor:'photo-1500382017468-9049fed747ef', projector:'photo-1574717024653-61fd2cf4d44d',
  camping:'photo-1504280390367-361c6d9f38f4', bounce:'photo-1544551763-46a013bb70d5', drone:'photo-1473968512647-3e447244af8f',
  catering:'photo-1555244162-803834f70033', bus:'photo-1533473359331-0135ef1b58bf', lawn:'photo-1416879595882-3373a0480b5b',
  booth:'photo-1517457373958-b7bdd4587205', truck:'photo-1586191582151-f73872dfd183', chalet:'photo-1449844908441-8829872d2607',
  microphone:'photo-1590602847861-f357a9332bbc', sewing:'photo-1590736969955-71cc94901144', drill:'photo-1504148455328-c376907d081c',
  dress:'photo-1595777457583-95e059d581b8', inverter:'photo-1581092446327-9b52bd1570c2', freezer:'photo-1571175443880-49e1d25b2bc5',
  bike:'photo-1485965120184-e220f721d03e', washer2:'photo-1523413651479-597eb2da0ad6', sofa:'photo-1555041469-a586c61ea9bc',
  rooftop:'photo-1500534623283-312aade485b7', lights:'photo-1506157786151-b8491531f063', canopy:'photo-1533174072545-7a4b6ad7a6c3',
  boat:'photo-1500534314209-a25ddb2bd429', roadbike:'photo-1541625602330-2277b4c461de', coffee:'photo-1495474472287-4d71bcdd2085',
  van:'photo-1566933293069-b55c7f326dd4'
};
const photo=(k,w=900)=>ATM_IMAGE[k] ? `https://images.unsplash.com/${ATM_IMAGE[k]}?auto=format&fit=crop&w=${w}&q=83` : '';
const ATM_LISTINGS = [
[1,'Luxury Marquee Tent & Décor',2000,'Events','Lusaka','Lusaka Event Hire','tent','White 200-seater marquee tent, draping, lighting and optional tables. Setup available around Lusaka.',4.9,42],
[2,'Toyota Hilux Double Cab 4×4',2500,'Vehicles','Lusaka','Chanda Rentals','car','Dependable 4×4 double cab. Perfect for site visits, out-of-town trips and business travel.',4.8,28],
[3,'Sony Alpha Camera & Lens Kit',650,'Equipment','Ndola','Zambia Media Rentals','camera','Professional camera, two lenses, batteries and tripod. Great for events and creators.',4.9,34],
[4,'Complete PA Sound System',1200,'Events','Kitwe','Copperbelt Sounds','sound','Professional speakers, mixing desk and microphones for parties, weddings and conferences.',4.7,19],
[5,'Silent Diesel Generator 10kVA',800,'Equipment','Kabwe','PowerHire Zambia','generator','Reliable backup power for events, shops or temporary construction sites.',4.8,17],
[6,'Wedding Chairs & Round Tables',450,'Events','Chilanga','Bridal Touch Décor','wedding','Elegant event furniture for up to 100 guests. Delivery and setup available.',4.9,25],
[7,'Toyota Land Cruiser Prado SUV',3500,'Vehicles','Livingstone','Victoria Falls Rides','suv','Comfortable SUV for family travel, safari transfers and business appointments.',4.8,31],
[8,'Concrete Mixer Machine',550,'Tools','Lusaka','BuildRight Rentals','construction','Heavy-duty cement mixer for home and commercial projects. Flexible daily hire.',4.6,12],
[9,'Excavator & Operator',4800,'Equipment','Solwezi','MinePro Equipment','excavator','Excavation and earthworks package with a trained machine operator.',4.9,21],
[10,'Outdoor LED Display Screen',1800,'Events','Lusaka','StageCraft Zambia','screen','Large LED display for festivals, brand launches and outdoor viewing.',4.8,16],
[11,'Industrial Pressure Washer',300,'Tools','Ndola','ToolHire Zambia','washer','High-pressure machine for cleaning driveways, cars, terraces and walls.',4.7,13],
[12,'Wedding Floral Arch & Décor',1700,'Events','Kitwe','Elegant Occasions','decor','Beautiful backdrop and coordinated floral décor for weddings and engagements.',4.9,30],
[13,'Canon DSLR Photography Kit',500,'Equipment','Chipata','Eastern Media Hub','dslr','Digital camera with kit lens, memory card and spare battery.',4.7,11],
[14,'Farm Tractor With Driver',2200,'Farming','Mazabuka','AgriRent Southern','tractor','Tractor hire for smallholder land preparation and farm work, driver included.',4.8,20],
[15,'HD Projector & Screen',350,'Electronics','Lusaka','OfficeGear Hire','projector','Ideal for meetings, workshops, classroom sessions and movie nights.',4.8,18],
[16,'Four-Person Camping Tent',180,'Equipment','Livingstone','Zambezi Adventure','camping','Weather-resistant tent and groundsheet. Suitable for weekend adventures.',4.9,14],
[17,'Kids Bouncy Castle',750,'Events','Ndola','Little Stars Parties','bounce','Colourful inflatable castle for children’s parties. Setup included.',4.8,24],
[18,'Drone Videography Kit',950,'Equipment','Lusaka','SkyShot Studios','drone','Aerial video package for events, real estate and landscapes.',4.9,26],
[19,'Buffet Chafing Dish Set',350,'Events','Kabwe','Celebration Caterers','catering','Six professional chafing dishes to keep buffet meals ready for guests.',4.7,8],
[20,'18-Seater Minibus',1900,'Vehicles','Lusaka','CityLink Transport','bus','Group transport for events, church trips and corporate outings. Driver available.',4.8,18],
[21,'Electric Lawn Mower',190,'Tools','Chingola','GreenSpace Tools','lawn','Easy-to-use lawn mower for neat residential and commercial lawns.',4.6,10],
[22,'360° Event Photo Booth',850,'Events','Lusaka','FlashBooth Zambia','booth','Fun 360 video booth with operator and branded sharing overlays.',4.9,36],
[23,'Flatbed Truck With Driver',2400,'Vehicles','Kitwe','Copperbelt Haulage','truck','Move heavy materials and large equipment with an experienced driver.',4.7,17],
[24,'Weekend Two-Bedroom Chalet',950,'Property','Livingstone','Mosi Stays','chalet','Quiet furnished short-stay cottage near popular attractions. Sleeps four.',4.9,44],
[25,'Wireless Microphone Bundle',280,'Electronics','Mansa','North Audio Rental','microphone','Two wireless microphones and a small portable speaker for presentations.',4.7,9],
[26,'Portable Sewing Machine',150,'Tools','Chipata','Creative Threads','sewing','Compact sewing machine for tailoring jobs, repairs and training.',4.6,7],
[27,'Cordless Drill & Bit Set',120,'Tools','Lusaka','FixIt Tools','drill','Powerful cordless drill, charger and assorted bits for DIY and fitting jobs.',4.8,13],
[28,'Elegant Wedding Dress',600,'Fashion','Ndola','Bridal Closet Zambia','dress','Classic bridal gown available in multiple sizes, with fitting appointment.',4.9,28],
[29,'Portable Power Station',280,'Electronics','Lusaka','PowerGo Rentals','inverter','Rechargeable portable backup power for laptops, lights and mobile devices.',4.7,15],
[30,'Commercial Chest Freezer',220,'Equipment','Kabwe','CoolStore Hire','freezer','Large freezer for food vendors, events and short-term catering needs.',4.6,8],
[31,'Mountain Bicycle',90,'Vehicles','Livingstone','Adventure Wheels','bike','Well-maintained bicycle with helmet for local exploration.',4.8,22],
[32,'Site Cleaning Equipment Set',380,'Tools','Solwezi','BuildClean Hire','washer2','Cleaning supplies and equipment for end-of-project cleanups.',4.7,9],
[33,'Premium Lounge Furniture Set',750,'Events','Lusaka','Event Style Africa','sofa','Comfortable lounge sofas and coffee tables for premium event seating.',4.9,19],
[34,'Roof Rack & Cargo Box',130,'Vehicles','Kitwe','RoadTrip Essentials','rooftop','Extra luggage space for family holidays and extended road trips.',4.7,11],
[35,'Professional Stage Lighting',1050,'Events','Lusaka','Spotlight Events','lights','Party lighting kit with stage wash lights and control console.',4.8,30],
[36,'Outdoor Pop-Up Gazebo',350,'Events','Chipata','Eastern Tent Company','canopy','Quick-install canopy for trade fairs, markets and family gatherings.',4.7,20],
[37,'Fishing Boat & Guide',1300,'Services','Siavonga','Lake Kariba Adventures','boat','Guided on-the-water rental experience with safety gear.',4.9,22],
[38,'Performance Road Bicycle',120,'Vehicles','Lusaka','Pedal Zambia','roadbike','Road bike with adjustable seat and helmet, for training or leisure.',4.8,17],
[39,'Conference Coffee Urn Set',110,'Events','Ndola','Brew & Gather','coffee','Tea and coffee urns for meetings, workshops and small conferences.',4.7,14],
[40,'Moving Van With Driver',1500,'Vehicles','Lusaka','MoveEasy Zambia','van','Convenient short-distance furniture or office moving van with driver.',4.8,26]
].map(([id,title,price,category,city,owner,img,description,rating,reviews])=>({id,title,price,category,city,owner,img,image:img==='lawn'?'lawn-mower.svg':photo(img),description,rating,reviews,unit:'day',deposit:Math.ceil(price*.25/10)*10,likes:17+(id*17)%109,comments:3+(id*7)%23,featured:id<=20,verified:id%4!==0,created:((id*3)%23)+1}));
const ATM_START_NOTICES=[
  {id:1,kind:'welcome',title:'Welcome to ATM!',text:'Find, hire and list almost anything in Zambia.',age:'Today',read:false,route:'explore'},
  {id:2,kind:'idea',title:'Discover what is trending',text:'Explore popular items for hire around Lusaka and beyond.',age:'Yesterday',read:false,route:'trending'},
  {id:3,kind:'tip',title:'Safety tip',text:'Inspect your hire item and agree on handover details.',age:'2 days ago',read:false,route:'help'}
];
const ATM_START_CHATS=[
  {id:1,listingId:1,person:'Lusaka Event Hire',messages:[{me:false,text:'Hello! Happy to answer any questions about our marquee tents.',time:'09:20'}]},
  {id:2,listingId:3,person:'Zambia Media Rentals',messages:[{me:false,text:'The Sony Alpha camera kit is available for enquiries.',time:'Yesterday'}]}
];
