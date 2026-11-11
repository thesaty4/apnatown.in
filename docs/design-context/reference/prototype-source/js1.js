/* ===== seed data (sample, Padrauna flavoured) ===== */
const CENTER={lat:26.9040,lng:83.9810};
const AREAS=[
 {id:'chauraha',en:'Padrauna Chauraha',hi:'पडरौना चौराहा',lat:26.9040,lng:83.9810},
 {id:'busstand',en:'Bus Stand',hi:'बस स्टैंड',lat:26.9075,lng:83.9755},
 {id:'station',en:'Station Road',hi:'स्टेशन रोड',lat:26.9010,lng:83.9885},
 {id:'hata',en:'Hata Road',hi:'हाटा रोड',lat:26.9090,lng:83.9870},
 {id:'ramkola',en:'Ramkola Road',hi:'रामकोला रोड',lat:26.8970,lng:83.9755},
 {id:'tehsil',en:'Tehsil Road',hi:'तहसील रोड',lat:26.9115,lng:83.9790},
 {id:'collect',en:'Collectorate Chauraha',hi:'कलेक्ट्रेट चौराहा',lat:26.9140,lng:83.9840}];
const CITIES=[{id:'padrauna',en:'Padrauna',hi:'पडरौना',state:'active',areas:AREAS.length},{id:'kasia',en:'Kasia (Kushinagar)',hi:'कसया (कुशीनगर)',state:'soon',areas:0},{id:'deoria',en:'Deoria',hi:'देवरिया',state:'planned',areas:0},{id:'gorakhpur',en:'Gorakhpur',hi:'गोरखपुर',state:'planned',areas:0}];
const CATS=[
 {id:'grocery',en:'Grocery',hi:'किराना',e:'🛒',h:30},{id:'medical',en:'Medical',hi:'दवाइयाँ',e:'💊',h:160},{id:'electronics',en:'Electronics',hi:'इलेक्ट्रॉनिक्स',e:'📺',h:215},
 {id:'mobile',en:'Mobile',hi:'मोबाइल',e:'📱',h:260},{id:'food',en:'Food & Sweets',hi:'खाना व मिठाई',e:'🍬',h:350},{id:'clothing',en:'Clothing',hi:'कपड़े',e:'👕',h:300},
 {id:'hardware',en:'Hardware',hi:'हार्डवेयर',e:'🔧',h:200},{id:'stationery',en:'Stationery',hi:'स्टेशनरी',e:'✏️',h:50},{id:'furniture',en:'Furniture',hi:'फर्नीचर',e:'🛋️',h:20},{id:'jewellery',en:'Jewellery',hi:'ज्वेलरी',e:'💍',h:45}];
const SCATS=[
 {id:'wedding',en:'Wedding & Events',hi:'शादी व इवेंट',e:'💒',h:330},{id:'builder',en:'Home Builders',hi:'भवन निर्माण',e:'🏗️',h:25},{id:'mechanic',en:'Mechanic & Repair',hi:'मैकेनिक व रिपेयर',e:'🛠️',h:200},
 {id:'education',en:'Coaching & Education',hi:'कोचिंग व शिक्षा',e:'📚',h:240},{id:'electrician',en:'Electrician',hi:'इलेक्ट्रीशियन',e:'⚡',h:48},{id:'plumber',en:'Plumber',hi:'प्लंबर',e:'🚿',h:190},{id:'other',en:'Other Services',hi:'अन्य सेवाएँ',e:'➕',h:120}];
const catOf=id=>CATS.find(c=>c.id===id)||SCATS.find(c=>c.id===id)||{en:id,hi:id,e:'🏪',h:30};
const areaOf=id=>AREAS.find(a=>a.id===id)||AREAS[0];
const H=(o,c,off=[])=>[0,1,2,3,4,5,6].map(d=>off.includes(d)?null:[o,c]);
const T=(s)=>{const [h,m]=s.split(':').map(Number);return h*60+m};
const mkB=(id,en,hi,cat,area,addr,dx,dy,phone,rating,rc,x={})=>({id,name:{en,hi},cat,emoji:catOf(cat).e,hue:catOf(cat).h,area,addr,lat:CENTER.lat+dy,lng:CENTER.lng+dx,phone,wa:phone,email:id+'@example.com',rating,rc,verified:true,featured:false,popular:false,status:'approved',since:2015+(+id.slice(1)%8),
 hours:H('09:00','21:00',[]),del:{mode:'rider',radius:5,fee:0,min:150,pickup:true,note:'Show the pickup code at the counter.'},desc:'',social:{ig:'',yt:'',fb:''},gallery:['🏬','🧺','🪧','🛍️'],closedNow:false,...x});
const BIZ=[
 mkB('b1','Shri Ram Kirana Store','श्री राम किराना स्टोर','grocery','hata','Near Hata Road Chauraha, Padrauna',.008,.0045,'9876500001',4.6,212,{featured:true,popular:true,desc:'Family-run kirana since 2015. Atta, dal, oil, spices and daily needs at fair prices. Same-day home delivery in Padrauna.',del:{mode:'rider',radius:4,fee:20,min:149,pickup:true,note:'Collect from the counter. Show your pickup code.'},hours:H('07:30','21:30',[]),social:{ig:'shriramkirana',yt:'',fb:''}}),
 mkB('b2','Gupta Medical Hall','गुप्ता मेडिकल हॉल','medical','busstand','Opp. Bus Stand, Padrauna',-.005,.0035,'9876500002',4.7,164,{featured:true,popular:true,desc:'Licensed pharmacy. Medicines, health devices and baby care. Prescription needed for scheduled drugs.',hours:H('08:00','23:00',[]),del:{mode:'rider',radius:6,fee:0,min:99,pickup:true,note:'Bring prescription for Rx items.'}}),
 mkB('b3','Singh Electronics','सिंह इलेक्ट्रॉनिक्स','electronics','chauraha','Main Market, Padrauna Chauraha',.0015,-.001,'9876500003',4.4,98,{popular:true,desc:'TVs, fans, coolers, mixers and home appliances. Free installation within town.',hours:H('10:00','20:30',[0])}),
 mkB('b4','Raj Mobile Point','राज मोबाइल पॉइंट','mobile','station','Station Road, Padrauna',.0075,-.0025,'9876500004',4.3,121,{featured:true,desc:'New phones, accessories, recharge and repair.',hours:H('10:00','21:00',[])}),
 mkB('b5','Kushinagar Sweets & Namkeen','कुशीनगर स्वीट्स एवं नमकीन','food','tehsil','Tehsil Road, Padrauna',-.002,.0075,'9876500005',4.8,340,{featured:true,popular:true,desc:'Fresh mithai made daily in pure desi ghee. Party orders welcome.',hours:H('07:00','22:00',[]),del:{mode:'self',radius:5,fee:30,min:200,pickup:true,note:'Ready in 20 minutes.'}}),
 mkB('b6','Maa Durga Cloth House','माँ दुर्गा क्लॉथ हाउस','clothing','chauraha','Gandhi Chowk, Padrauna',-.0025,-.0015,'9876500006',4.2,76,{desc:'Sarees, kurtas, kids wear and bedsheets. Wedding season specials.',hours:H('10:30','21:00',[1])}),
 mkB('b7','Sharma Hardware & Paints','शर्मा हार्डवेयर एवं पेंट्स','hardware','ramkola','Ramkola Road, Padrauna',-.0055,-.0065,'9876500007',4.5,88,{desc:'Cement, paints, pipes, tools and electrical goods for builders.',hours:H('09:00','19:30',[0]),del:{mode:'rider',radius:8,fee:0,min:500,pickup:true,note:'Heavy items loaded at the godown.'}}),
 mkB('b8','Student Stationery Corner','स्टूडेंट स्टेशनरी कॉर्नर','stationery','collect','Near Collectorate, Padrauna',.003,.011,'9876500008',4.4,59,{desc:'Books, notebooks, art supplies and school bags.',hours:H('09:30','20:00',[0])}),
 mkB('b9','Shree Furniture Mart','श्री फर्नीचर मार्ट','furniture','ramkola','Ramkola Road, Padrauna',-.0075,-.0085,'9876500009',4.1,41,{desc:'Beds, almirahs, tables and chairs. Custom orders on request.',hours:H('10:00','20:00',[]),del:{mode:'self',radius:10,fee:150,min:1000,pickup:true,note:'Showroom pickup on request.'}}),
 mkB('b10','Lakshmi Jewellers','लक्ष्मी ज्वेलर्स','jewellery','chauraha','Sarafa Bazaar, Padrauna',.0025,.0015,'9876500010',4.7,132,{desc:'Silver, gold-plated and imitation jewellery. Hallmark on request.',hours:H('10:30','20:30',[0])})];
const mkS=(id,en,hi,cat,area,dx,dy,phone,rating,rc,desc,services,x={})=>({id,name:{en,hi},cat,emoji:catOf(cat).e,hue:catOf(cat).h,area,addr:areaOf(area).en+', Padrauna',lat:CENTER.lat+dy,lng:CENTER.lng+dx,phone,wa:phone,email:id+'@example.com',rating,rc,verified:true,status:'approved',desc,services,hours:H('09:00','19:00',[0]),social:{ig:'',yt:'',fb:''},gallery:['📸','🎉','🛠️','🏠'],serviceArea:'Padrauna and 15 km around',...x});
const SVC=[
 mkS('s1','Shubh Vivah Events & Tent House','शुभ विवाह इवेंट्स एवं टेंट हाउस','wedding','tehsil',-.003,.0065,'9876500101',4.8,87,'Complete wedding planning: tent, lighting, DJ, catering and decoration.',[{n:'Wedding decoration',p:'from ₹25,000'},{n:'Tent & lighting',p:'from ₹8,000'},{n:'DJ & sound',p:'from ₹6,000'}]),
 mkS('s2','Sai Builders & Contractors','साईं बिल्डर्स एवं कॉन्ट्रैक्टर्स','builder','ramkola',-.0065,-.0045,'9876500102',4.5,34,'House construction, renovation and RCC work with transparent estimates.',[{n:'House construction',p:'₹1,650 / sq ft'},{n:'Renovation',p:'On quote'},{n:'Boundary wall',p:'On quote'}]),
 mkS('s3','Ansari Auto Works','अंसारी ऑटो वर्क्स','mechanic','station',.009,-.004,'9876500103',4.6,102,'Two-wheeler and four-wheeler servicing, puncture, denting and painting.',[{n:'Bike service',p:'from ₹399'},{n:'Car service',p:'from ₹1,499'},{n:'Puncture repair',p:'₹60'}]),
 mkS('s4','Bright Future Coaching','ब्राइट फ्यूचर कोचिंग','education','collect',.0035,.0125,'9876500104',4.7,156,'Classes 6-12, board exams and competitive foundation. Small batches.',[{n:'Class 9-10 (all subjects)',p:'₹700 / month'},{n:'Class 11-12 Science',p:'₹1,200 / month'},{n:'Spoken English',p:'₹500 / month'}]),
 mkS('s5','Verma Electricals','वर्मा इलेक्ट्रिकल्स','electrician','hata',.006,.0075,'9876500105',4.6,73,'Wiring, inverter, fan and appliance repair. Quick visits in Padrauna.',[{n:'House wiring',p:'on visit'},{n:'Inverter install',p:'₹500'},{n:'Fan / geyser repair',p:'from ₹150'}]),
 mkS('s6','Rajesh Plumbing Service','राजेश प्लंबिंग सर्विस','plumber','busstand',-.0045,-.0005,'9876500106',4.3,51,'Leakage, bathroom fitting, motor and tank cleaning.',[{n:'Tap / pipe repair',p:'from ₹150'},{n:'Bathroom fitting',p:'on quote'},{n:'Tank cleaning',p:'₹600'}])];
SVC[0].featured=true;SVC[3].featured=true;SVC[2].popular=true;SVC[4].popular=true;
/* products: [name_en, name_hi, price, mrp, unit, emoji, stock, variants] */
const PD={
b1:[['Chakki Fresh Atta','चक्की फ्रेश आटा',265,295,'5 kg','🌾',48,['5 kg','10 kg']],['Refined Soya Oil','रिफाइंड सोया तेल',118,135,'1 L','🛢️',60],['Iodised Salt','आयोडीन नमक',28,30,'1 kg','🧂',120],['Basmati Rice','बासमती चावल',420,480,'5 kg','🍚',22],['Arhar Dal','अरहर दाल',165,180,'1 kg','🫘',3],['Instant Noodles','इंस्टेंट नूडल्स',84,90,'6-pack','🍜',0]],
b2:[['Paracetamol 500 mg','पैरासिटामोल 500 मि.ग्रा.',22,25,'strip of 10','💊',200],['ORS Sachets','ओआरएस पैकेट',45,50,'pack of 5','🧃',80],['Digital Thermometer','डिजिटल थर्मामीटर',180,250,'1 pc','🌡️',25],['Cough Syrup','खाँसी की दवा',96,110,'100 ml','🧴',40],['BP Monitor','बीपी मॉनिटर',1499,1899,'1 pc','🩺',6]],
b3:[['LED TV 32 inch','एलईडी टीवी 32 इंच',10990,14990,'1 pc','📺',5],['Ceiling Fan 1200 mm','सीलिंग फैन 1200 मिमी',1850,2200,'1 pc','🌀',14,['White','Brown']],['Mixer Grinder 500 W','मिक्सर ग्राइंडर 500 W',2199,2799,'1 pc','🍹',9],['LED Bulb 9 W','एलईडी बल्ब 9 W',249,320,'pack of 4','💡',70]],
b4:[['Smartphone 6GB/128GB','स्मार्टफोन 6GB/128GB',10499,12999,'1 pc','📱',11,['Black','Blue']],['Fast Charger 33 W','फास्ट चार्जर 33 W',599,899,'1 pc','🔌',35],['Tempered Glass','टेम्पर्ड ग्लास',99,199,'1 pc','🛡️',100],['Wireless Earbuds','वायरलेस ईयरबड्स',799,1499,'1 pc','🎧',2]],
b5:[['Kaju Katli','काजू कतली',520,560,'500 g','🍬',18],['Motichoor Laddu','मोतीचूर लड्डू',380,400,'1 kg','🟠',25],['Samosa','समोसा',60,60,'6 pcs','🥟',40],['Rasgulla Tin','रसगुल्ला टिन',240,260,'1 kg','⚪',16],['Namkeen Mix','नमकीन मिक्स',140,150,'500 g','🥨',30]],
b6:[['Men’s Cotton Kurta','पुरुष कॉटन कुर्ता',799,1099,'1 pc','👘',20,['M','L','XL']],['Cotton Saree','कॉटन साड़ी',1199,1599,'1 pc','🥻',12],['Kids T-shirt','बच्चों की टी-शर्ट',299,399,'1 pc','👕',33,['2-4 yr','4-6 yr','6-8 yr']],['Double Bedsheet','डबल बेडशीट',649,899,'1 set','🛏️',15]],
b7:[['Wall Paint','वॉल पेंट',1450,1650,'4 L','🎨',24,['White','Cream','Sky Blue']],['Hammer Set','हथौड़ा सेट',349,450,'3 pcs','🔨',18],['Cement','सीमेंट',390,420,'50 kg bag','🧱',150],['Electrical Wire','इलेक्ट्रिकल वायर',1320,1500,'90 m coil','🪢',20]],
b8:[['Notebooks','नोटबुक',210,240,'pack of 6','📓',60],['Gel Pens','जेल पेन',90,110,'pack of 10','🖊️',90],['Geometry Box','ज्योमेट्री बॉक्स',120,150,'1 pc','📐',40],['School Bag','स्कूल बैग',549,799,'1 pc','🎒',12]],
b9:[['Steel Almirah','स्टील अलमारी',7999,9999,'1 pc','🗄️',4],['Wooden Study Table','लकड़ी की स्टडी टेबल',3499,4299,'1 pc','🪑',6],['Plastic Chair','प्लास्टिक कुर्सी',399,499,'1 pc','💺',40],['Single Bed','सिंगल बेड',6499,7999,'1 pc','🛏️',3]],
b10:[['Silver Anklet','चाँदी की पायल',1299,1499,'pair','🔔',20],['Necklace Set','नेकलेस सेट',699,999,'1 set','📿',14],['Silver Coin','चाँदी का सिक्का',1050,1100,'10 g','🪙',30],['Gold-plated Earrings','गोल्ड प्लेटेड झुमके',499,699,'pair','✨',26]]};
const SUBS={b1:['Atta & Oil','Atta & Oil','Salt & Spices','Rice & Dal','Rice & Dal','Instant Food'],b2:['Medicines','Health Drinks','Devices','Medicines','Devices'],b3:['TV','Fans','Kitchen','Lighting'],b4:['Phones','Accessories','Accessories','Audio'],b5:['Sweets','Sweets','Snacks','Sweets','Snacks'],b6:['Men','Women','Kids','Home'],b7:['Paints','Tools','Building','Electrical'],b8:['Notebooks','Writing','Geometry','Bags'],b9:['Storage','Tables','Chairs','Beds'],b10:['Silver','Fashion','Silver','Fashion']};
const mkP=()=>{const out=[];Object.entries(PD).forEach(([bid,list])=>list.forEach((r,i)=>{const [en,hi,price,mrp,unit,e,stock,vars]=r;out.push({id:'p'+(out.length+1),bid,name:{en,hi},cat:BIZ.find(b=>b.id===bid).cat,price,mrp,unit,emoji:e,hue:BIZ.find(b=>b.id===bid).hue+i*8,stock,low:5,variants:vars||[],sku:bid.toUpperCase()+'-'+(i+1),sub:(SUBS[bid]||[])[i]||'Items',desc:en+' from '+BIZ.find(b=>b.id===bid).name.en+'. Quality checked and fairly priced.',specs:[['Pack size',unit],['Sold by',BIZ.find(b=>b.id===bid).name.en]],tags:[],featured:i===0||i===2,status:'active',avail:stock>0})}));return out};
const NOW=Date.now();
const mkSeed=()=>{
 const products=mkP();
 const L=(pid,q,v)=>{const p=products.find(x=>x.id===pid);return{pid,name:p.name,price:p.price,qty:q,variant:v||'',emoji:p.emoji}};
 const hist=(arr)=>arr.map(([s,m])=>({s,ts:NOW-m*MIN}));
 const orders=[
  {id:'AT10231',uid:'u1',bid:'b1',mode:'delivery',items:[L('p1',1,'5 kg'),L('p2',2),L('p3',1)],subtotal:265+236+28,delivery:20,fee:5,discount:0,pay:{method:'COD',status:'pending'},status:'preparing',ts:NOW-25*MIN,history:hist([['placed',25],['accepted',22],['preparing',15]]),otp:'4729',pickupCode:'',addr:'Home: 14, Shivpuri Colony, near Hata Road, Padrauna 274304',addrPos:{lat:26.9102,lng:83.9893},riderId:null,cust:'Rohit Kumar',phone:'9876543210'},
  {id:'AT10232',uid:'u1',bid:'b2',mode:'pickup',items:[L('p7',2),L('p8',1)],subtotal:44+45,delivery:0,fee:5,discount:0,pay:{method:'UPI',status:'paid'},status:'ready',ts:NOW-70*MIN,history:hist([['placed',70],['accepted',66],['ready',20]]),otp:'',pickupCode:'4821',addr:'',riderId:null,cust:'Rohit Kumar',phone:'9876543210'},
  {id:'AT10198',uid:'u1',bid:'b5',mode:'delivery',items:[L('p20',1),L('p21',1)],subtotal:900,delivery:30,fee:5,discount:50,pay:{method:'UPI',status:'paid'},status:'delivered',ts:NOW-2*DAY,history:hist([['placed',2*1440],['accepted',2*1440-3],['preparing',2*1440-9],['ready',2*1440-30],['out',2*1440-36],['delivered',2*1440-58]]),otp:'1182',pickupCode:'',addr:'Home: 14, Shivpuri Colony, near Hata Road, Padrauna 274304',addrPos:{lat:26.9102,lng:83.9893},riderId:'r1',cust:'Rohit Kumar',phone:'9876543210'},
  {id:'AT10177',uid:'u1',bid:'b6',mode:'delivery',items:[L('p25',1,'L')],subtotal:799,delivery:35,fee:5,discount:0,pay:{method:'UPI',status:'refunded'},status:'cancelled',ts:NOW-5*DAY,history:hist([['placed',5*1440],['cancelled',5*1440-30]]),otp:'',pickupCode:'',cancel:{by:'vendor',reason:'Item out of stock'},refund:{status:'completed',steps:[['requested',5*1440-31],['approved',5*1440-60],['completed',4*1440]]},addr:'Home: 14, Shivpuri Colony, near Hata Road, Padrauna 274304',riderId:null,cust:'Rohit Kumar',phone:'9876543210'},
  {id:'AT10240',uid:'u2',bid:'b1',mode:'delivery',items:[L('p2',1),L('p4',1)],subtotal:538,delivery:20,fee:5,discount:0,pay:{method:'COD',status:'pending'},status:'placed',ts:NOW-4*MIN,history:hist([['placed',4]]),otp:'6034',pickupCode:'',addr:'22, Kaushal Nagar, Padrauna 274304',addrPos:{lat:26.9060,lng:83.9920},riderId:null,cust:'Anita Devi',phone:'9876500888'},
  {id:'AT10236',uid:'u3',bid:'b1',mode:'delivery',items:[L('p3',3),L('p5',1)],subtotal:84+165,delivery:20,fee:5,discount:0,pay:{method:'UPI',status:'paid'},status:'ready',ts:NOW-40*MIN,history:hist([['placed',40],['accepted',37],['preparing',30],['ready',8]]),otp:'7741',pickupCode:'',addr:'Ward 5, Station Road, Padrauna',addrPos:{lat:26.9021,lng:83.9902},riderId:null,cust:'Mohd Imran',phone:'9876500777'}];
 const jobs=[{id:'J1',oid:'AT10236',riderId:null,status:'requested',ts:NOW-6*MIN,dist:2.1,earn:35,expires:NOW+60*60*1000},{id:'J0',oid:'AT10198',riderId:'r1',status:'delivered',ts:NOW-2*DAY,dist:3.2,earn:42}];
 const reviews=[
  {id:'rv1',type:'b',tid:'b1',uid:'u9',name:'Sunita Gupta',rating:5,text:'Delivery was quick and the atta was fresh. Fair prices too.',ts:NOW-3*DAY,tags:['On time','Fair price'],helpful:6,status:'published',reply:'Thank you, behenji! Visit again.'},
  {id:'rv2',type:'b',tid:'b1',uid:'u8',name:'Vikas Yadav',rating:4,text:'Good shop. Sometimes rush in the evening.',ts:NOW-6*DAY,tags:[],helpful:2,status:'published',reply:''},
  {id:'rv3',type:'b',tid:'b2',uid:'u7',name:'Rakesh Pandey',rating:5,text:'Always has the medicines in stock. Helpful pharmacist.',ts:NOW-9*DAY,tags:['Helpful staff'],helpful:9,status:'published',reply:''},
  {id:'rv4',type:'b',tid:'b5',uid:'u6',name:'Priya Singh',rating:5,text:'Best kaju katli in Padrauna!',ts:NOW-1*DAY,tags:['Tasty'],helpful:11,status:'published',reply:''},
  {id:'rv5',type:'p',tid:'p1',uid:'u8',name:'Vikas Yadav',rating:5,text:'Soft rotis. Value for money.',ts:NOW-8*DAY,tags:[],helpful:3,status:'published',reply:''},
  {id:'rv6',type:'s',tid:'s5',uid:'u5',name:'Neha Verma',rating:5,text:'Came within an hour and fixed the inverter wiring.',ts:NOW-4*DAY,tags:['Quick visit'],helpful:4,status:'published',reply:''},
  {id:'rv7',type:'s',tid:'s1',uid:'u4',name:'Amit Tiwari',rating:5,text:'Our wedding decoration was beautiful.',ts:NOW-20*DAY,tags:[],helpful:7,status:'published',reply:''},
  {id:'rv8',type:'r',tid:'r1',uid:'u1',name:'Rohit Kumar',rating:5,text:'Polite and on time.',ts:NOW-2*DAY,tags:['Polite'],helpful:0,status:'published',reply:''},
  {id:'rv9',type:'b',tid:'b1',uid:'u5',name:'Anonymous',rating:1,text:'Spam link: visit www.cheap-deals.example now!!!',ts:NOW-1*DAY,tags:[],helpful:0,status:'reported',reply:'',reports:3}];
 const enq=[
  {id:'e1',sid:'s5',name:'Neha Verma',phone:'9876500201',msg:'Need inverter installation at home, 2BHK.',date:'Sat',ts:NOW-5*HR,status:'new'},
  {id:'e2',sid:'s5',name:'Rohit Kumar',phone:'9876543210',msg:'Ceiling fan not working, please visit.',date:'Tomorrow',ts:NOW-1*DAY,status:'contacted'},
  {id:'e3',sid:'s5',name:'Anil Mishra',phone:'9876500202',msg:'Full wiring for new shop.',date:'Next week',ts:NOW-3*DAY,status:'converted'},
  {id:'e4',sid:'s5',name:'Pooja Rani',phone:'9876500203',msg:'Geyser installation',date:'Any',ts:NOW-6*DAY,status:'closed'},
  {id:'e5',sid:'s1',name:'Sandeep Rai',phone:'9876500204',msg:'Wedding on 28 Feb, need decor quote.',date:'28 Feb',ts:NOW-2*HR,status:'new'}];
 const offers=[
  {id:'of1',bid:'b1',title:'10% off on Atta & Oil',type:'percent',value:10,pids:['p1','p2'],from:NOW-2*DAY,to:NOW+5*DAY,status:'active',featured:true,views:420,uses:38},
  {id:'of2',bid:'b5',title:'Free delivery on orders above ₹500',type:'freedel',value:0,pids:[],from:NOW-DAY,to:NOW+10*DAY,status:'active',featured:true,views:610,uses:71},
  {id:'of3',bid:'b4',title:'₹100 off on accessories',type:'flat',value:100,pids:['p17','p18'],from:NOW-DAY,to:NOW+7*DAY,status:'active',featured:false,views:240,uses:12},
  {id:'of4',bid:'b6',title:'Wedding season sale: 15% off sarees',type:'percent',value:15,pids:['p26'],from:NOW,to:NOW+14*DAY,status:'pending',featured:false,views:0,uses:0},
  {id:'of5',bid:'b1',title:'Diwali dhamaka (ended)',type:'percent',value:20,pids:[],from:NOW-60*DAY,to:NOW-40*DAY,status:'ended',featured:false,views:2100,uses:260}];
 const apps=[
  {id:'ap1',type:'business',name:'Mahadev Dairy & Sweets',owner:'Dinesh Kushwaha',phone:'9876500301',area:'Ramkola Road',ts:NOW-5*HR,status:'pending',docs:['GST certificate','Shop photo','Aadhaar (owner)'],hist:[]},
  {id:'ap2',type:'service',name:'Pandit Ji Catering',owner:'Ram Avadh Pandey',phone:'9876500302',area:'Tehsil Road',ts:NOW-1*DAY,status:'pending',docs:['Aadhaar (owner)','Work photos'],hist:[]},
  {id:'ap3',type:'rider',name:'Rakesh Kumar',owner:'Rakesh Kumar',phone:'9876500303',area:'Station Road',ts:NOW-2*DAY,status:'pending',docs:['Driving licence','Aadhaar','RC book','Selfie'],hist:[]},
  {id:'ap4',type:'business',name:'City Optical',owner:'Faisal Khan',phone:'9876500304',area:'Chauraha',ts:NOW-4*DAY,status:'rejected',docs:['Shop photo'],hist:[{by:'Admin Kavita',s:'rejected',note:'Shop photo unclear. Please upload again.',ts:NOW-3*DAY}]}];
 const riders=[
  {id:'r1',name:'Sunil Yadav',phone:'9876500401',vehicle:'Bike UP57 AB 2210',rating:4.8,rc:96,online:true,status:'approved',area:'Hata Road',earnToday:0},
  {id:'r2',name:'Imran Ansari',phone:'9876500402',vehicle:'Scooter UP57 CD 7781',rating:4.6,rc:61,online:true,status:'approved',area:'Station Road'},
  {id:'r3',name:'Deepak Maurya',phone:'9876500403',vehicle:'Bike UP57 EF 1145',rating:4.5,rc:40,online:false,status:'approved',area:'Bus Stand'},
  {id:'r4',name:'Pintu Singh',phone:'9876500404',vehicle:'Bike UP57 GH 9022',rating:4.1,rc:12,online:false,status:'suspended',area:'Tehsil Road'}];
 const users=[{id:'u1',name:'Rohit Kumar',phone:'9876543210',role:'customer',status:'active',orders:4,joined:NOW-80*DAY},{id:'u2',name:'Anita Devi',phone:'9876500888',role:'customer',status:'active',orders:2,joined:NOW-30*DAY},{id:'u3',name:'Mohd Imran',phone:'9876500777',role:'customer',status:'active',orders:7,joined:NOW-120*DAY},{id:'u5',name:'Spam Account',phone:'9000000000',role:'customer',status:'suspended',orders:0,joined:NOW-3*DAY}];
 const notifs={
  cust:[{id:rid('n'),type:'order',title:'Order AT10231 is being prepared',body:'Shri Ram Kirana Store started preparing your order.',ts:NOW-15*MIN,read:false,link:'order-AT10231'},{id:rid('n'),type:'order',title:'Ready for pickup',body:'Order AT10232 is ready at Gupta Medical Hall. Code 4821.',ts:NOW-20*MIN,read:false,link:'order-AT10232'},{id:rid('n'),type:'offer',title:'Free delivery on sweets',body:'Kushinagar Sweets: free delivery above ₹500.',ts:NOW-1*DAY,read:true,link:'offers'}],
  vendor:[{id:rid('n'),type:'order',title:'New order AT10240',body:'Anita Devi placed an order worth ₹563.',ts:NOW-4*MIN,read:false,link:'vorder-AT10240'},{id:rid('n'),type:'review',title:'New 5★ review',body:'Sunita Gupta reviewed your shop.',ts:NOW-3*DAY,read:true,link:'vreviews'},{id:rid('n'),type:'admin',title:'Offer pending approval',body:'Your offer “Diwali dhamaka” has ended.',ts:NOW-40*DAY,read:true,link:'voffers'}],
  provider:[{id:rid('n'),type:'enq',title:'New enquiry from Neha Verma',body:'Need inverter installation at home, 2BHK.',ts:NOW-5*HR,read:false,link:'senq-e1'}],
  rider:[{id:rid('n'),type:'job',title:'New delivery nearby',body:'Pickup: Shri Ram Kirana Store · earn ₹35',ts:NOW-6*MIN,read:false,link:'rreq'}],
  admin:[{id:rid('n'),type:'appr',title:'3 approvals waiting',body:'Mahadev Dairy, Pandit Ji Catering, Rakesh Kumar',ts:NOW-1*HR,read:false,link:'aappr'},{id:rid('n'),type:'review',title:'Review reported 3 times',body:'Spam review on Shri Ram Kirana Store.',ts:NOW-5*HR,read:false,link:'areviews'}],
  super:[{id:rid('n'),type:'sys',title:'Kasia city waitlist: 48 people',body:'Consider enabling Kasia (Kushinagar).',ts:NOW-1*DAY,read:false,link:'xgeo'}]};
 const audit=[
  {id:rid('a'),ts:NOW-3*DAY,actor:'Admin Kavita',action:'Rejected business application',detail:'City Optical',before:{status:'pending'},after:{status:'rejected'}},
  {id:rid('a'),ts:NOW-6*DAY,actor:'Super Admin',action:'Changed rider earning rule',detail:'Per-km rate',before:{perKm:6},after:{perKm:7}},
  {id:rid('a'),ts:NOW-9*DAY,actor:'Admin Kavita',action:'Unpublished review',detail:'rv-old-12 (abusive language)',before:{status:'published'},after:{status:'hidden'}}];
 const admins=[{id:'ad1',name:'Admin Kavita',email:'kavita@apnatown.in',areas:['chauraha','busstand','hata','tehsil','collect'],status:'active',perms:{approvals:['view','edit'],orders:['view','edit'],users:['view'],reviews:['view','edit'],comms:['view'],reports:['view']}},{id:'ad2',name:'Admin Manoj',email:'manoj@apnatown.in',areas:['station','ramkola'],status:'active',perms:{approvals:['view'],orders:['view','edit'],users:['view'],reviews:['view'],comms:[],reports:['view']}},{id:'ad3',name:'Admin Seema',email:'seema@apnatown.in',areas:[],status:'inactive',perms:{approvals:[],orders:['view'],users:[],reviews:[],comms:[],reports:['view']}}];
 const cfg={slabs:[{upto:2,fee:20},{upto:4,fee:35},{upto:7,fee:50}],riderBase:20,riderPerKm:7,commission:6,platformFee:5,plans:[{id:'basic',n:'Basic',price:0,comm:6},{id:'growth',n:'Growth',price:499,comm:4},{id:'pro',n:'Pro',price:999,comm:3}],promos:[{id:'pr1',n:'Featured listing (7 days)',price:199},{id:'pr2',n:'Homepage banner (7 days)',price:699}],cod:true,online:true,refundHrs:24,flags:{reviews:true,guestBrowse:true,whatsapp:true,booking:false,donations:false},seo:{title:'ApnaTown.in | Padrauna’s local marketplace',desc:'Shops, products and services in Padrauna.'},reviewRule:'Only verified purchasers or enquirers can review.',brand:{name:'ApnaTown',tag:'Apna Shehar, Apni Dukaan'}};
 return{v:3,biz:BIZ,svc:SVC,products,orders,jobs,reviews,enq,offers,apps,riders,users,notifs,audit,admins,cfg,
  banners:[{id:'bn1',t:'Kushinagar Sweets: free delivery',s:'On orders above ₹500 this week',c1:'#C2410C',c2:'#F59E0B',link:'biz-b5',on:true},{id:'bn2',t:'Shop local, save time',s:'Delivery from Padrauna’s own shops',c1:'#0F766E',c2:'#15803D',link:'explore',on:true},{id:'bn3',t:'Wedding season is here',s:'Find trusted event planners & tent houses',c1:'#6D28D9',c2:'#BE185D',link:'cat-wedding',on:true}],
  cats:CATS.map(c=>({...c,on:true})),scats:SCATS.map(c=>({...c,on:true})),cities:CITIES,coupons:[{code:'APNA50',type:'flat',value:50,min:299,desc:'₹50 off on orders above ₹299'},{code:'WELCOME10',type:'percent',value:10,max:100,min:0,desc:'10% off (up to ₹100) for new users'}],
  comms:[{id:'c1',ts:NOW-2*DAY,target:'Shri Ram Kirana Store',ch:['WhatsApp','In-app'],tpl:'Offer',sent:128,delivered:121,failed:7,optout:3,status:'sent'}]};
};
/* ===== store ===== */
const KEY='apnatown_v3';
let S=null;
const defaults=()=>({lang:'en',theme:'auto',role:'customer',user:null,splash:false,loc:{id:'chauraha',name:'Padrauna Chauraha',lat:AREAS[0].lat,lng:AREAS[0].lng,city:'padrauna',gps:false},locAsked:false,
 cart:[],saved:[],bookmarks:[],recent:[],recentSearch:['atta','medical','electrician'],addrs:[{id:'ad1',label:'Home',name:'Rohit Kumar',phone:'9876543210',line:'14, Shivpuri Colony',landmark:'Near Hata Road Chauraha',pin:'274304',area:'hata',lat:26.9102,lng:83.9893,def:true}],selAddr:'ad1',
 prefs:{inapp:true,email:true,wa_orders:true,wa_offers:false,wa_enq:true},consent:{cookies:null},notifyCity:{},coupon:'',
 demo:{failPay:false,slow:false,err:false,lite:false},vend:{bid:'b1'},prov:{sid:'s5'},rider:{rid:'r1'},adminId:'ad1',db:mkSeed()});
function load(){try{const r=JSON.parse(localStorage.getItem(KEY));if(r&&r.db&&r.db.v===3){S={...defaults(),...r};return}}catch(e){}S=defaults()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function resetAll(){try{localStorage.removeItem(KEY)}catch(e){}S=defaults();save()}
load();
