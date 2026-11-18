/* ATM v13 catalogue — fictional items, owners, popularity and prices.
   Six parent categories, distinct subcategories, 48 listings per category.
   Browser-only simulation, not real inventory or real hosts. */
const ATM_TAXONOMY = [
 {name:'Transport',icon:'car',description:'Cars, motorcycles, safaris, haulage and water transport',subcategories:['Sedans & Hatchbacks','SUVs & 4×4s','Safari & Tour Vehicles','Motorbikes & Scooters','Buses & Minibuses','Pickups & Vans','Trucks & Haulage','Bicycles & E-bikes','Boats & Watercraft','Aircraft & Helicopters','Campers & Motorhomes','Specialised Vehicles'],filters:['Seats','Driver included','Transmission','Delivery','Fuel type']},
 {name:'Hardware',icon:'wrench',description:'Tools, machinery, farming, power systems and electronics',subcategories:['Hand & Power Tools','Construction Machinery','Agricultural Equipment','Gardening & Landscaping','Power & Electrical','Cleaning Equipment','Industrial & Workshop','Lifting & Access','Cameras & Electronics','Specialist Equipment'],filters:['Operator included','Power rating','Capacity','Accessories','Delivery']},
 {name:'Events',icon:'party',description:'Tents, stages, sound systems, furniture and event packages',subcategories:['Tents & Marquees','Chairs & Tables','Sound & DJ Equipment','Lighting & Stage','Decor & Accessories','Catering Equipment','Photography Booths','Children’s Events','Screens & Displays','Event Packages'],filters:['Guest capacity','Setup included','Delivery','Event type','Package size']},
 {name:'Spaces & Property',icon:'home',description:'Accommodation, venues, workspaces, storage and facilities',subcategories:['Houses & Apartments','Lodges & Accommodation','Event Venues','Offices & Workspaces','Warehouses & Storage','Retail & Commercial','Studios & Creative Spaces','Outdoor & Agricultural Land','Parking & Garages','Sports Facilities'],filters:['Capacity','Bedrooms','Amenities','Parking','Accessibility']},
 {name:'Lifestyle',icon:'sparkles',description:'Fashion, sport, camping, household and recreation rentals',subcategories:['Fashion & Formal Wear','Sports & Fitness','Outdoor & Camping','Recreation & Games','Household & Furniture','Baby & Family','Travel Accessories','Costumes & Cultural Wear'],filters:['Size','Condition','Brand','Delivery','Accessories']},
 {name:'Services',icon:'briefcase',description:'Skilled professionals and services booked for a date or job',subcategories:['Photography & Videography','Drivers & Transport Services','Cleaning & Maintenance','Construction & Repairs','Event Professionals','Beauty & Personal Care','Agricultural Services','Tutors & Trainers','Moving & Delivery','Business & Technical'],filters:['Experience','Travel available','Qualifications','Duration','Service package']}
];
const ATM_LEGACY_CATEGORY = {'Vehicles':'Transport','Tools':'Hardware','Equipment':'Hardware','Electronics':'Hardware','Farming':'Hardware','Fashion':'Lifestyle','Property':'Spaces & Property','Events':'Events','Services':'Services'};
const ATM_EXISTING_SUBS = {
 1:'Tents & Marquees',2:'Pickups & Vans',3:'Cameras & Electronics',4:'Sound & DJ Equipment',5:'Power & Electrical',6:'Chairs & Tables',
 7:'SUVs & 4×4s',8:'Construction Machinery',9:'Construction Machinery',10:'Screens & Displays',11:'Cleaning Equipment',12:'Decor & Accessories',
 13:'Cameras & Electronics',14:'Agricultural Equipment',15:'Cameras & Electronics',16:'Outdoor & Camping',17:'Children’s Events',
 18:'Cameras & Electronics',19:'Catering Equipment',20:'Buses & Minibuses',21:'Gardening & Landscaping',22:'Photography Booths',
 23:'Trucks & Haulage',24:'Lodges & Accommodation',25:'Cameras & Electronics',26:'Hand & Power Tools',27:'Hand & Power Tools',
 28:'Fashion & Formal Wear',29:'Power & Electrical',30:'Catering Equipment',31:'Bicycles & E-bikes',32:'Cleaning Equipment',
 33:'Chairs & Tables',34:'Travel Accessories',35:'Lighting & Stage',36:'Tents & Marquees',37:'Boats & Watercraft',
 38:'Bicycles & E-bikes',39:'Catering Equipment',40:'Pickups & Vans'
};
const ATM_CATALOG_CITIES = ['Lusaka','Kitwe','Ndola','Livingstone','Chipata','Solwezi','Kabwe','Kasama','Chingola','Mazabuka','Mongu','Mansa','Choma','Chililabombwe','Siavonga','Lundazi'];
const ATM_CATALOG_GROUPS = {
 'Transport':[
 ['Sedans & Hatchbacks','car',450,'Toyota Vitz','Honda Fit','Toyota Corolla','Hyundai i20'],
 ['SUVs & 4×4s','suv',1700,'Toyota Fortuner','Nissan Patrol','Mitsubishi Pajero','Jeep Wrangler'],
 ['Safari & Tour Vehicles','suv',2600,'Open-Roof Safari Land Cruiser','Game-Drive Safari Jeep','Touring Land Rover','Safari Tour Minibus'],
 ['Motorbikes & Scooters','bike',180,'Honda CB125 Motorcycle','Yamaha Trail Bike','City Scooter','Courier Motorcycle'],
 ['Buses & Minibuses','bus',1100,'25-Seater Coaster Bus','14-Seater Passenger Van','40-Seater Tour Bus','School Minibus'],
 ['Pickups & Vans','van',850,'Toyota Hilux Pickup','Ford Ranger Double Cab','Cargo Delivery Van','Nissan Hardbody Pickup'],
 ['Trucks & Haulage','truck',1950,'Five-Ton Cargo Truck','Flatbed Haulage Truck','Refrigerated Delivery Truck','Tipper Truck'],
 ['Bicycles & E-bikes','roadbike',80,'Mountain Bicycle','Electric City Bicycle','Road Training Bicycle','Touring Bicycle'],
 ['Boats & Watercraft','boat',650,'Lake Kariba Speedboat','Fishing Pontoon Boat','Passenger Canoe','Guided Lake Cruiser'],
 ['Aircraft & Helicopters','rooftop',9800,'Charter Light Aircraft','Scenic Helicopter Flight','Private Air Charter','Aerial Survey Aircraft'],
 ['Campers & Motorhomes','van',2100,'Camper Van for Two','Family Motorhome','Off-Grid Camping Van','Safari Camping Vehicle'],
 ['Specialised Vehicles','truck',1950,'Wheelchair-Accessible Van','Tow-Recovery Truck','Water Bowser Truck','Medical Transport Van']
 ],
 'Hardware':[
 ['Hand & Power Tools','drill',140,'Cordless Drill Kit','Angle Grinder','Electric Circular Saw','Rotary Hammer Drill','Portable Welding Kit'],
 ['Construction Machinery','construction',850,'Concrete Mixer','Plate Compactor','Mini Excavator','Concrete Cutter','Scaffolding Kit'],
 ['Agricultural Equipment','tractor',1400,'Two-Wheel Tractor','Farm Field Sprayer','Disc Harrow','Maize Sheller','Irrigation Pump'],
 ['Gardening & Landscaping','lawn',200,'Walk-Behind Lawn Mower','Brush Cutter','Leaf Blower','Tree Pruning Saw','Hedge Trimmer'],
 ['Power & Electrical','generator',600,'Silent 8kVA Generator','20kVA Diesel Generator','Portable Inverter','Solar Backup Power Kit','Cable Distribution Kit'],
 ['Cleaning Equipment','washer',150,'Pressure Washer','Industrial Wet Vacuum','Floor Polisher','Upholstery Cleaner','Steam Cleaner'],
 ['Industrial & Workshop','construction',950,'Air Compressor','Pipe Threading Machine','Heavy Welding Set','Workshop Lathe','Hydraulic Press'],
 ['Lifting & Access','excavator',1000,'Access Scaffolding Tower','Forklift Truck','Manual Pallet Jack','Articulating Boom Lift','Mobile Platform Ladder'],
 ['Cameras & Electronics','camera',320,'Sony Mirrorless Camera','Canon DSLR Kit','DJI Camera Drone','Video Projector','Professional Laptop'],
 ['Specialist Equipment','projector',380,'Surveying Total Station','Laser Distance Meter','Soil Testing Kit','Thermal Imaging Camera','GPS Mapping Unit']
 ],
 'Events':[
 ['Tents & Marquees','tent',1000,'100-Seat Marquee Tent','Premium Wedding Gazebo','Clear-Roof Event Tent','Outdoor Canopy Set','Conference Tent'],
 ['Chairs & Tables','wedding',350,'Chiavari Wedding Chairs','Round Banquet Tables','Conference Table Sets','Lounge Seating Set','Folding Chair Bundle'],
 ['Sound & DJ Equipment','sound',550,'DJ Console & Mixer','PA Speaker Package','Wireless Microphone Set','Subwoofer Set','Portable Sound System'],
 ['Lighting & Stage','lights',700,'Stage Lighting Package','Modular Stage Platform','Moving Head Lights','LED Uplights','Stage Truss System'],
 ['Decor & Accessories','decor',450,'Wedding Floral Backdrop','Bridal Aisle Decor','Table Centrepiece Set','Ceremony Arch','Photo Wall Package'],
 ['Catering Equipment','catering',180,'Buffet Chafing Dish Bundle','Commercial Food Warmer','Large Cooking Pots','Catering Serving Set','Beverage Urns'],
 ['Photography Booths','booth',650,'360 Video Booth','Instant Print Photo Booth','Selfie Mirror','Green-Screen Photo Station','Event Portrait Booth'],
 ['Children’s Events','bounce',500,'Bouncy Castle','Water Slide Inflatable','Children’s Play Tent','Party Games Set','Ball Pit'],
 ['Screens & Displays','screen',750,'Outdoor LED Screen','Projection Screen','Digital Signage Panels','Conference Display','Video Wall'],
 ['Event Packages','wedding',1950,'Wedding Essentials Bundle','Corporate Conference Package','Birthday Party Kit','Graduation Ceremony Set','Garden Reception Package']
 ],
 'Spaces & Property':[
 ['Houses & Apartments','chalet',650,'Furnished Two-Bedroom Apartment','Family Holiday House','Studio Apartment','Private Guest Apartment','Garden Cottage'],
 ['Lodges & Accommodation','chalet',550,'Lakeview Chalet','City Guesthouse Room','Safari Lodge Cabin','Riverside Cottage','Executive Guest Suite'],
 ['Event Venues','wedding',1800,'Garden Wedding Venue','Conference Hall','Private Function Room','Outdoor Reception Grounds','Banquet Hall'],
 ['Offices & Workspaces','rooftop',350,'Private Office Suite','Day Coworking Desk','Training Room','Boardroom','Meeting Office'],
 ['Warehouses & Storage','construction',650,'Secure Storage Bay','Small Warehouse Unit','Cold Storage Room','Commercial Storage Shed','Temporary Container Storage'],
 ['Retail & Commercial','rooftop',500,'Pop-Up Retail Space','Exhibition Booth','Market Stall','Shopfront Unit','Business Kiosk'],
 ['Studios & Creative Spaces','booth',350,'Photography Studio','Recording Booth','Content Creation Studio','Dance Practice Studio','Art Workshop Space'],
 ['Outdoor & Agricultural Land','tractor',650,'Open Event Field','Farm Demonstration Plot','Agricultural Drying Yard','Picnic Garden','Outdoor Training Field'],
 ['Parking & Garages','van',90,'Secure Car Parking Bay','Lock-Up Garage','Covered Parking Space','Truck Parking Yard','Motorbike Garage'],
 ['Sports Facilities','roadbike',450,'Football Pitch','Indoor Basketball Court','Tennis Court','Training Gym Space','Multi-Sport Court']
 ],
 'Lifestyle':[
 ['Fashion & Formal Wear','dress',200,'Men’s Formal Suit','Bridal Wedding Dress','Graduation Gown','Evening Dress','Tuxedo Package','Wedding Jewellery Set'],
 ['Sports & Fitness','roadbike',130,'Exercise Bicycle','Gym Weight Set','Football Training Kit','Yoga Class Equipment','Tennis Rackets','Home Treadmill'],
 ['Outdoor & Camping','camping',120,'Four-Person Camping Tent','Camping Chairs','Hiking Backpack','Portable Camping Stove','Adventure Sleeping Bag','Outdoor Cooler'],
 ['Recreation & Games','sofa',130,'PlayStation Console','Party Board Games','Outdoor Table Tennis','Family Karaoke Machine','Portable Gaming Projector','Garden Party Games'],
 ['Household & Furniture','sofa',170,'Two-Seat Sofa','Dining Table Set','Household Freezer','Portable Washing Machine','Baby-Safe High Chair','Outdoor Patio Furniture'],
 ['Baby & Family','sofa',100,'Infant Travel Pram','Baby Car Seat','Travel Cot','Toddler Feeding Chair','Baby Changing Station','Family Stroller'],
 ['Travel Accessories','rooftop',70,'Roof Cargo Box','Hard-Shell Suitcase','Backpacking Luggage','Travel Bike Rack','Cooler Box','Portable Travel Fridge'],
 ['Costumes & Cultural Wear','dress',130,'Traditional Ceremony Outfit','Theatre Stage Costume','Graduation Cap & Gown','Cultural Dance Attire','Fancy Dress Party Outfit','Wedding Traditional Wear']
 ],
 'Services':[
 ['Photography & Videography','camera',700,'Wedding Photographer','Corporate Videographer','Product Photographer','Drone Filming Operator','Event Portrait Photographer'],
 ['Drivers & Transport Services','car',450,'Professional Chauffeur','Airport Transfer Driver','Safari Tour Driver','Corporate Delivery Driver','Day Trip Driver'],
 ['Cleaning & Maintenance','washer',300,'Office Deep Cleaning','Residential Garden Maintenance','End-of-Tenancy Cleaning','Carpet Cleaning Team','Post-Construction Cleaning'],
 ['Construction & Repairs','construction',500,'Qualified Electrician','Plumbing Repair Service','House Painting Crew','Carpentry Service','Appliance Repair Technician'],
 ['Event Professionals','sound',650,'Wedding DJ','Event Master of Ceremonies','Professional Event Decorator','Conference Coordinator','Wedding Planner'],
 ['Beauty & Personal Care','dress',280,'Event Makeup Artist','Mobile Hairstylist','Bridal Makeup Package','Nail Care Technician','Traditional Styling Artist'],
 ['Agricultural Services','tractor',800,'Field Preparation Operator','Agricultural Extension Adviser','Irrigation Technician','Crop Spraying Team','Farm Equipment Operator'],
 ['Tutors & Trainers','projector',220,'Mathematics Tutor','Driving Instructor','Business Skills Trainer','English Tutor','Personal Fitness Coach'],
 ['Moving & Delivery','van',450,'Household Moving Team','Furniture Delivery Crew','Office Relocation Service','Local Courier Service','Loading & Unloading Crew'],
 ['Business & Technical','camera',450,'IT Support Technician','Website Design Consultant','Graphic Design Service','Event AV Technician','Small Business Bookkeeper']
 ]
};
(function initializeTaxonomy(){
  ATM_CATEGORIES.splice(0,ATM_CATEGORIES.length,{name:'All',icon:'grid'},...ATM_TAXONOMY.map(function(t){return {name:t.name,icon:t.icon};}));
  // Preserve original listing IDs, including the booked sample property id 24.
  ATM_LISTINGS.forEach(function(l){
    l.category=ATM_LEGACY_CATEGORY[l.category]||'Lifestyle';
    if(l.id===16||l.id===34)l.category='Lifestyle';
    if(l.id===30)l.category='Events';
    if(l.id===37)l.category='Transport';
    l.subcategory=ATM_EXISTING_SUBS[l.id]||ATM_TAXONOMY.find(function(t){return t.name===l.category;}).subcategories[0];
    l.unit=l.category==='Spaces & Property'?'night':'day';
    l.trendScore=1000-(l.id*19)%161 + l.reviews*3;
    l.featured=false;
  });
  var number=1000;
  ATM_TAXONOMY.forEach(function(t,catIndex){
    var groups=ATM_CATALOG_GROUPS[t.name];
    if(!groups||groups.length!==t.subcategories.length)throw new Error('Incomplete ATM taxonomy for '+t.name);
    var count=ATM_LISTINGS.filter(function(l){return l.category===t.name;}).length;
    var loop=0;
    while(count<48){
      var group=groups[loop%groups.length];
      var variant=Math.floor(loop/groups.length);
      var list=group.slice(3);
      var itemName=list[variant%list.length];
      var city=ATM_CATALOG_CITIES[(loop*3+catIndex*5)%ATM_CATALOG_CITIES.length];
      var title=itemName+' — '+city;
      var price=Math.round(group[2]*(1+variant*.10+((loop+catIndex)%4)*.05)/10)*10;
      var id=number++;
      var owner=['ATM Transport Partners','Copperbelt Hire Co.','Zambezi Rentals','Local Hire Network','Zambia Service Partners','Citywide Hire Hub'][(loop+catIndex)%6];
      ATM_LISTINGS.push({
        id:id,title:title,category:t.name,subcategory:group[0],city:city,owner:owner,
        price:price,img:group[1],image:photo(group[1]),
        description:itemName+' available for hire in '+city+'. Review the sample terms, dates and any included items before placing a demo offer or reservation.',
        rating:Math.round((4.3+(loop%7)*.1)*10)/10,reviews:8+(loop*7+catIndex*11)%60,
        unit:t.name==='Spaces & Property'?'night':'day',
        deposit:Math.round(price*.2/10)*10,likes:12+(loop*13)%120,comments:0,
        featured:false,verified:loop%4!==1,created:1+(loop*7)%23,
        offersAllowed:(t.name==='Spaces & Property'&&loop%11===0)?false:true,
        trendScore:800+((loop*43+catIndex*37)%170),
        demo:true
      });
      count++;loop++;
    }
  });
  // Demo feature attributes power real subcategory-specific filter choices.
  ATM_LISTINGS.forEach(function(l){
    var taxonomy=ATM_TAXONOMY.find(function(t){return t.name===l.category;});
    if(!taxonomy)return;
    var id=Number(l.id)||0;
    l.features=taxonomy.filters.filter(function(_,i){return ((id+i*3)%5)<3;});
    // Every category has at least two meaningful filter dimensions in the demo.
    if(!l.features.length)l.features=[taxonomy.filters[id%taxonomy.filters.length]];
  });
  // Previous auto-open host chats are not authorised until a demo payment completes.
  ATM_START_CHATS.splice(0,ATM_START_CHATS.length);
})();
