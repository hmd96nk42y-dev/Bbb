'use strict';
/* ============================================================
   DEMO DATA · loaded in demo mode only
   Everything in this file is made up for Sk's demo of BUBL OPS: the
   venue sheet as the build carries it, a season of events, Season 2
   figures, targets, a staff plan, a cost list, the people (staff,
   hosts, runners, promoters), the demo PINs, and the pools the
   simulated night (js/20-world.js) draws its guests from.
   A test or live page never loads this file or 20-world.js: there the
   venue's facts come from BUBL's back end (js/live-data.js) and
   nothing here exists. tests/unit/ops_no_demo_data.test.ts fails if
   any of it turns up in another file.
   The text below is Sk's own, moved here from "10 · venue + season
   configuration" without rewording.
   ============================================================ */
const OPS_DEMO={
VENUE:{name:'Ushuaïa Dubai Harbour',season:'Season 3',capacity:10000,minAge:21,
  graceMin:30,          /* table hold past arrive-by before it reads as a no-show */
  arriveByMin:120,      /* guest app: arrive by doors + 2h */
  earlyCutMin:120,      /* Early entry is valid until doors + 2h */
  earlyUpgrade:50,      /* door upgrade Early → Second wave */
  doorPrice:400,preOff:.10,depositPct:.5,extraMax:4},
/* id, date, short, head, tag, doors, lineup */
EVENTS:[
  ['bc','2026-10-24','Black Coffee','Black Coffee','Season 3 opening night','20:00',['Black Coffee']],
  ['adr','2026-11-14','Adriatique','Adriatique','X · Forever tour','19:00',['Adriatique']],
  ['art','2026-11-28','ARTBAT','ARTBAT','Upperground','20:00',['ARTBAT','Miss Monique','R3HAB','7 Skies']],
  ['mo','2026-12-12','Mahmut Orhan','Mahmut Orhan','Live at the harbour','20:00',['Mahmut Orhan']],
  ['nw','2026-12-31','NEWORLD','Argy presents NEWORLD','New Year’s Eve','19:00',['Argy','Chloé Caillet','Hardt Antoine','Solance']]
],
EVENTS_TO_COME:['2027-01-23','2027-02-13','2027-03-06','2027-03-27','2027-04-17'],
/* Season 2 actuals: the baseline for pace, no-show prediction and comparison */
PAST:[
  {id:'s2bc',name:'Black Coffee',date:'27 Dec 2025',att:9240,cap:10000,gross:7920000,profit:2410000,show:.905,tables:.90,noShowGA:.092,noShowSeat:.118,peak:'22:35',fb:1510000},
  {id:'s2mo',name:'Mahmut Orhan · NYE',date:'31 Dec 2025',att:9710,cap:10000,gross:8840000,profit:3020000,show:.931,tables:.96,noShowGA:.061,noShowSeat:.082,peak:'22:10',fb:1890000},
  {id:'s2adr',name:'Adriatique',date:'15 Nov 2025',att:8120,cap:10000,gross:6310000,profit:1540000,show:.884,tables:.81,noShowGA:.108,noShowSeat:.131,peak:'22:50',fb:1240000},
  {id:'s2avg',name:'Season 2 average',date:'9 events',att:8460,cap:10000,gross:6780000,profit:1820000,show:.893,tables:.84,noShowGA:.098,noShowSeat:.124,peak:'22:40',fb:1330000}
],
/* ---- tables: same sheet as the guest app (all nights the same price) ---- */
TIERS:{
  bsA:{label:'Backstage A',short:'BS·A',min:30000,cap:12,extra:2500,grp:'bs',w:13,h:10},
  bsB:{label:'Backstage B',short:'BS·B',min:40000,req:1,cap:12,extra:0,grp:'bs',w:13,h:10},
  bsC:{label:'Backstage C',short:'BS·C',min:60000,req:1,cap:12,extra:0,grp:'bs',w:13,h:10},
  vip:{label:'VIP',short:'VIP',min:18000,cap:12,extra:1500,grp:'vip',w:23,h:14},
  plat:{label:'Platinum',short:'PLAT',min:15000,cap:12,extra:1250,grp:'plat',w:23,h:14},
  gold:{label:'Gold',short:'GOLD',min:10000,cap:10,extra:1000,grp:'gold',w:22,h:13},
  silver:{label:'Silver',short:'SILV',min:6000,cap:8,extra:750,grp:'silver',w:15,h:11}
},
SECTIONS:{
  bsL:{label:'Backstage · Left',grp:'bs',host:'Nadia K.'},bsC:{label:'Backstage · Centre',grp:'bs',host:'Tomas R.'},bsR:{label:'Backstage · Right',grp:'bs',host:'Aisha B.'},
  vipL:{label:'VIP · Left',grp:'vip',host:'Marco D.'},vipR:{label:'VIP · Right',grp:'vip',host:'Priya S.'},
  plL:{label:'Platinum · Left',grp:'plat',host:'Yousef H.'},plR:{label:'Platinum · Right',grp:'plat',host:'Elena V.'},
  gdL:{label:'Gold · Left',grp:'gold',host:'Daniel O.'},gdR:{label:'Gold · Right',grp:'gold',host:'Sofia M.'},
  slL:{label:'Silver · Left',grp:'silver',host:'Hamza T.'},slR:{label:'Silver · Right',grp:'silver',host:'Lina F.'}
},
FLOAT_HOSTS:['Karim Z. (float)','Maya C. (float)'],
RUNNERS:['Ravi','Jonas','Abdul','Chen','Mateo','Ifeanyi','Tariq','Niko','Sami','Diego','Arjun','Luca'],
TABLE_DATA:'VD1,vip,-200.5,676,;VD2,vip,-171.5,676,;VD3,vip,-142,676,;VD4,vip,151,676,;VD5,vip,180.5,676,;VD6,vip,210,676,;VE1,vip,-200.5,656,;VE2,vip,-171.5,656,;VE3,vip,-142,656,;VE4,vip,151,656,;VE5,vip,180.5,656,;VE6,vip,210,656,;VF1,vip,-200.5,635.5,;VF2,vip,-171.5,635.5,;VF3,vip,-142,635.5,;VF4,vip,151,635.5,;VF5,vip,180.5,635.5,;VF6,vip,210,635.5,;VG1,vip,-200.5,615,;VG2,vip,-171.5,615,;VG3,vip,-142,615,;VG4,vip,151,615,;VG5,vip,180.5,615,;VG6,vip,210,615,;PL01,plat,-139.8,548.4,;PL02,plat,-169.7,548.4,;PL03,plat,-199.2,548.4,;PL04,plat,-139.9,527.5,;PL05,plat,-169.6,527.5,;PL06,plat,-199.2,527.5,;PL07,plat,-139.7,507.5,;PL08,plat,-169.4,507.5,;PL09,plat,-199.2,507.5,;PL10,plat,-221.9,507.5,;PL11,plat,-139.7,485,;PL12,plat,-169.2,485,;PL13,plat,-199.3,485,;PL14,plat,-222.1,485,;PL15,plat,-139.7,446,;PL16,plat,-169.3,446,;PL17,plat,-199.1,446,;PL18,plat,-221.9,446,;PL19,plat,-139.4,424.5,;PL20,plat,-169.2,424.5,;PL21,plat,-199.2,424.5,;PL22,plat,-221.9,424.5,;PL23,plat,-139.2,403.5,;PL24,plat,-169.1,403.5,;PL25,plat,-199,403.5,;PL26,plat,-222,403.5,;PL27,plat,-139.3,382.4,;PL28,plat,-168.9,382.4,;PL29,plat,-199.1,382.4,;PL30,plat,-222,382.4,;PR01,plat,149.3,548.5,;PR02,plat,179.4,548.5,;PR03,plat,208.5,548.5,;PR04,plat,149.3,527.6,;PR05,plat,179.2,527.6,;PR06,plat,208.6,527.6,;PR07,plat,149.2,507.6,;PR08,plat,179.2,507.6,;PR09,plat,208.5,507.6,;PR10,plat,231.4,507.6,;PR11,plat,149.3,485.2,;PR12,plat,179.3,485.2,;PR13,plat,208.6,485.2,;PR14,plat,231.5,485.2,;PR15,plat,149.2,446,;PR16,plat,179.1,446,;PR17,plat,208.4,446,;PR18,plat,231.3,446,;PR19,plat,149.1,424.6,;PR20,plat,179.1,424.6,;PR21,plat,208.5,424.6,;PR22,plat,231.2,424.6,;PR23,plat,149.1,403.6,;PR24,plat,179.2,403.6,;PR25,plat,208.4,403.6,;PR26,plat,231.4,403.6,;PR27,plat,149.2,382.3,;PR28,plat,179,382.3,;PR29,plat,208.4,382.3,;PR30,plat,231.4,382.3,;GL01,gold,-140.9,317.6,;GL02,gold,-170.1,317.6,;GL03,gold,-199.1,317.6,;GL04,gold,-140.5,296,;GL05,gold,-170,296,;GL06,gold,-199,296,;GL07,gold,-140.7,272.2,;GL08,gold,-170,272.2,;GL09,gold,-199,272.2,;GL10,gold,-226.1,272.2,;GL11,gold,-140.7,252.5,;GL12,gold,-170,252.5,;GL13,gold,-199,252.5,;GL14,gold,-140.5,232.7,;GL15,gold,-170,232.7,;GL16,gold,-198.9,232.7,;GL17,gold,-226.2,232.7,;GL18,gold,-140.2,209.6,;GL19,gold,-169.8,209.6,;GL20,gold,-198.8,209.6,;GL21,gold,-226.2,209.6,;GL22,gold,-140,186.9,;GL23,gold,-169.7,186.9,;GL24,gold,-198.7,186.9,;GL25,gold,-226.1,186.9,;GL26,gold,-169.6,167.1,;GL27,gold,-198.5,158.2,;GL28,gold,-225.9,160,;GR01,gold,150.2,317.5,;GR02,gold,179.9,317.5,;GR03,gold,208.3,317.5,;GR04,gold,150.2,296.1,;GR05,gold,179.9,296.1,;GR06,gold,208.3,296.1,;GR07,gold,150.3,272.2,;GR08,gold,179.8,272.2,;GR09,gold,208.3,272.2,;GR10,gold,235.6,272.2,;GR11,gold,150.4,252.7,;GR12,gold,179.7,252.7,;GR13,gold,208.3,252.7,;GR14,gold,150.3,232.8,;GR15,gold,179.8,232.8,;GR16,gold,208.3,232.8,;GR17,gold,235.6,232.8,;GR18,gold,150.4,209.9,;GR19,gold,179.8,209.9,;GR20,gold,208.2,209.9,;GR21,gold,235.6,209.9,;GR22,gold,150.3,187.1,;GR23,gold,179.7,187.1,;GR24,gold,208.2,187.1,;GR25,gold,235.5,187.1,;GR26,gold,179.7,167.3,;GR27,gold,208.2,158.6,;GR28,gold,235.4,160.2,;BA1,bsA,-209,712,c;BA2,bsA,-209,729,c;BA3,bsA,-209,746,c;BA4,bsA,-187,768,d;BA5,bsA,-165,790,d;BA6,bsA,-143,812,d;BA7,bsA,-121,834,d;BA8,bsA,-104,856,r;BA9,bsA,-88,856,r;BA10,bsA,-72,856,r;BA11,bsA,-56,856,r;BA12,bsA,-40,856,r;BA13,bsA,-24,856,r;BA14,bsA,-8,856,r;BA15,bsA,8,856,r;BA16,bsA,24,856,r;BA17,bsA,40,856,r;BA18,bsA,56,856,r;BA19,bsA,72,856,r;BA20,bsA,88,856,r;BA21,bsA,104,856,r;BA22,bsA,121,834,d;BA23,bsA,143,812,d;BA24,bsA,165,790,d;BA25,bsA,187,768,d;BA26,bsA,209,746,c;BA27,bsA,209,729,c;BA28,bsA,209,712,c;BB1,bsB,-180,712,c;BB2,bsB,-180,729,c;BB3,bsB,-180,746,c;BB4,bsB,-160,766,d;BB5,bsB,-140,786,d;BB6,bsB,-120,806,d;BB7,bsB,-85,826,r;BB8,bsB,-68,826,r;BB9,bsB,-51,826,r;BB10,bsB,-34,826,r;BB11,bsB,-17,826,r;BB12,bsB,0,826,r;BB13,bsB,17,826,r;BB14,bsB,34,826,r;BB15,bsB,51,826,r;BB16,bsB,68,826,r;BB17,bsB,85,826,r;BB18,bsB,120,806,d;BB19,bsB,140,786,d;BB20,bsB,160,766,d;BB21,bsB,180,746,c;BB22,bsB,180,729,c;BB23,bsB,180,712,c;BC1,bsC,-151,712,c;BC2,bsC,-151,729,c;BC3,bsC,-134.2,745.8,d;BC4,bsC,-117.5,762.5,d;BC5,bsC,-100.8,779.2,d;BC6,bsC,-70,796,r;BC7,bsC,-53,796,r;BC8,bsC,-36,796,r;BC9,bsC,36,796,r;BC10,bsC,53,796,r;BC11,bsC,70,796,r;BC12,bsC,100.8,779.2,d;BC13,bsC,117.5,762.5,d;BC14,bsC,134.2,745.8,d;BC15,bsC,151,729,c;BC16,bsC,151,712,c;SL01,silver,-86.6,71.1,;SR01,silver,86.6,71.1,;SL02,silver,-101.4,85.9,;SR02,silver,101.4,85.9,;SL03,silver,-116.3,100.8,;SR03,silver,116.3,100.8,;SL04,silver,-131.1,115.6,;SR04,silver,131.1,115.6,;SL05,silver,-146,130.5,;SR05,silver,146,130.5,;SL06,silver,-101.4,56.3,;SR06,silver,101.4,56.3,;SL07,silver,-116.3,71.1,;SR07,silver,116.3,71.1,;SL08,silver,-131.1,85.9,;SR08,silver,131.1,85.9,;SL09,silver,-146,100.8,;SR09,silver,146,100.8,;SL10,silver,-160.8,115.6,;SR10,silver,160.8,115.6,;SL11,silver,-175.7,130.5,;SR11,silver,175.7,130.5,;SL12,silver,-116.3,41.4,;SR12,silver,116.3,41.4,;SL13,silver,-131.1,56.3,;SR13,silver,131.1,56.3,;SL14,silver,-146,71.1,;SR14,silver,146,71.1,;SL15,silver,-160.8,85.9,;SR15,silver,160.8,85.9,;SL16,silver,-175.7,100.8,;SR16,silver,175.7,100.8,;SL17,silver,-190.5,115.6,;SR17,silver,190.5,115.6,;SL18,silver,-205.4,130.5,;SR18,silver,205.4,130.5,;SL19,silver,-131.1,26.6,;SR19,silver,131.1,26.6,;SL20,silver,-146,41.4,;SR20,silver,146,41.4,;SL21,silver,-160.8,56.3,;SR21,silver,160.8,56.3,;SL22,silver,-175.7,71.1,;SR22,silver,175.7,71.1,;SL23,silver,-190.5,85.9,;SR23,silver,190.5,85.9,',
/* ---- entry tickets (guest app GA sheet) + operator-side allocations ---- */
GA:[
  {id:'early',label:'Early entry',sub:'Before 22:00',price:250,alloc:2000},
  {id:'wave',label:'Second wave',sub:'General admission',price:300,alloc:4800},
  {id:'vips',label:'VIP standing',sub:'Pit, front of booth',price:1500,alloc:800}
],
GATES:[
  {id:'G1',label:'Gate 1',sub:'GA north',cap:30,lanes:6},{id:'G2',label:'Gate 2',sub:'GA south',cap:30,lanes:6},
  {id:'G3',label:'Gate 3',sub:'Tables and VIP',cap:18,lanes:4},{id:'G4',label:'Gate 4',sub:'Backstage and artist',cap:9,lanes:2}
],
SOURCES:[
  {id:'direct',label:'Ushuaïa direct',grp:'direct',comm:0},
  {id:'host',label:'The team (host desk)',grp:'direct',comm:0},
  {id:'ref',label:'Guest referral links',grp:'direct',comm:0},
  {id:'p1',label:'Nomad Nights',grp:'promoter',comm:.10},{id:'p2',label:'Velvet Rope',grp:'promoter',comm:.10},
  {id:'p3',label:'Karim A.',grp:'promoter',comm:.12},{id:'p4',label:'Harbour Social',grp:'promoter',comm:.10},
  {id:'p5',label:'Layla H.',grp:'promoter',comm:.12},{id:'p6',label:'After Dark DXB',grp:'promoter',comm:.08},
  {id:'con',label:'Hotel concierge desks',grp:'partner',comm:.07},{id:'corp',label:'Corporate hospitality',grp:'partner',comm:.05},
  {id:'art',label:'Artist and label list',grp:'other',comm:0},{id:'door',label:'Walk-up at the door',grp:'other',comm:0},{id:'comp',label:'House comps',grp:'other',comm:0}
],
ROLES:{
  owner:{label:'Owner / Manager',who:'Roland Keyali',tabs:['home','floor','chat','scan'],pin:true},
  host:{label:'Host',who:'Marco D.',sec:'vipL',tabs:['home','floor','chat','scan']},
  door:{label:'Door staff',who:'Farah N.',gate:'G2',tabs:['home','floor','chat','scan']},
  runner:{label:'Runner',who:'Ravi',tabs:['home','floor','chat']}
},
MANAGERS:{'2026':'Roland Keyali (Owner)','4417':'Duty manager'},   /* demo PINs; production = per-manager credential */
STAFF_PLAN:[
  {role:'Door and scanning',zone:'Gates',plan:28},{role:'Hosts',zone:'Tables',plan:13},{role:'Runners',zone:'Tables',plan:34},
  {role:'Bartenders',zone:'Bars',plan:64},{role:'Security',zone:'All zones',plan:72},{role:'Medics',zone:'First aid',plan:6},{role:'Floor and cleaning',zone:'All zones',plan:22}
],
/* editable event cost model: fixed AED, variable as a rate on a revenue base */
COST_DEFAULT:[
  {id:'artist',label:'Artist fees',kind:'fixed',amt:1650000},
  {id:'prod',label:'Production',kind:'fixed',amt:920000,note:'Stage, sound, light, visuals, pyro'},
  {id:'staff',label:'Staffing',kind:'fixed',amt:380000},
  {id:'sec',label:'Security',kind:'fixed',amt:240000},
  {id:'lic',label:'Licensing and permits',kind:'fixed',amt:185000},
  {id:'mkt',label:'Marketing',kind:'fixed',amt:210000},
  {id:'oth',label:'Other',kind:'fixed',amt:120000},
  {id:'cogs',label:'F&B cost of goods',kind:'var',rate:.24,base:'fb',note:'On table minimums and bar sales'},
  {id:'fees',label:'Payment processing',kind:'var',rate:.029,base:'all'},
  {id:'comm',label:'Promoter and partner commission',kind:'var',rate:1,base:'comm',note:'Per source agreement'}
],
TARGET:{gross:9200000,presale:7300000,att:9300},
STAFF_BUBL:['Door and scanning','Hosts','Runners'],   /* the roles that sign in to BUBL OPS; bar, security and medics run on the venue's own rota */
CHECKLIST:[
  {id:'staff',label:'Staffing confirmed',who:'Duty manager',due:-3*DAY,auto:-6*DAY},
  {id:'gates',label:'Gates and lanes assigned',who:'Door lead',due:-2*DAY,auto:-3*DAY},
  {id:'layout',label:'Layout locked',who:'Owner',due:-2*DAY,auto:null},
  {id:'comms',label:'Arrival brief sent to guests',who:'Owner',due:-1*DAY,auto:null,act:'Send brief'},
  {id:'pos',label:'Menu and prices read from the POS',who:'System',due:-1*DAY,auto:-2*DAY},
  {id:'drill',label:'Scan drill done at every gate',who:'Door lead',due:-4*HOUR,auto:null,act:'Open practice'},
  {id:'float',label:'Card readers charged, cash floats counted',who:'Duty manager',due:-3*HOUR,auto:-5*HOUR},
  {id:'wx',label:'Wind and heat check for pyro and dome',who:'Production',due:-2*HOUR,auto:-3*HOUR},
  {id:'manifest',label:'Ticket manifest on every device',who:'System',due:-1*HOUR,auto:-90*MIN}
],
MENU:{
  bottles:[['Grey Goose',1500],['Belvedere',1600],['Casamigos Reposado',1800],['Don Julio 1942',2500],['Macallan 12 Double Cask',1900],['Hennessy XO',3200],['Moët Impérial',1500],['Dom Pérignon 2013',3350],['Armand de Brignac Gold 1.5L',15500]],
  packs:[['The Opener',3150,3450,['silver','gold','plat','vip']],['Stage Left',4300,4800,['plat','vip','gold']],['Backstage',9200,10400,['vip','bsA','bsB','bsC']],['The Harbour',19500,21900,['bsA','bsB','bsC']]],
  small:[['Truffle fries',120],['Wagyu sliders',165],['Fruit platter',150],['Red Room × 4',380],['Clase Azul round',960],['Mixers and ice',180]]
},
FIRST:'Omar,Layla,Rami,Sara,Khalid,Noura,Yousef,Hana,Tariq,Dana,Faisal,Mariam,Zayed,Reem,Hassan,Lina,Karim,Yasmin,Nasser,Salma,Arjun,Priya,Rohan,Ananya,Vikram,Meera,Kabir,Isha,Dev,Tara,James,Olivia,Liam,Chloe,Marcus,Elena,Luca,Sofia,Mateo,Camila,Nikolai,Anya,Sven,Freya,Jonas,Mila,Pierre,Inès,Hugo,Clara,Kenji,Yuki,Wei,Mei,Jin,Soo-ah,Kwame,Amara,Tunde,Zola,Diego,Valentina,Rafael,Bianca,Emre,Selin,Cyrus,Roxana,Adam,Nadia,Elias,Maya,Theo,Zara,Noah,Leila'.split(','),
LAST:'Al Mansoori,Haddad,Khoury,Rahman,Al Falasi,Nasser,Farouk,Aziz,Sharma,Mehta,Kapoor,Iyer,Malhotra,Reddy,Bennett,Clarke,Hughes,Moretti,Rossi,Conti,García,Navarro,Silva,Costa,Petrov,Volkov,Lindqvist,Berg,Dubois,Laurent,Tanaka,Sato,Chen,Lin,Park,Kim,Mensah,Okafor,Adeyemi,Dlamini,Yilmaz,Demir,Tehrani,Karimi,Saleh,Darwish,Hakimi,Sabbagh,Fernandes,D’Souza,Novak,Kowalski,Fischer,Weber,Jansen,de Vries,Murphy,O’Brien,Campbell,Stewart,Ivanova,Popescu,Marin,Georgiou,Abdallah,Barakat,Qureshi,Siddiqui,Zhang,Wu'.split(','),
PREFS:['Don Julio 1942, no salt','No photos at the table','Stage left when it is free','Still water on arrival','Sparkler show on the first bottle','Nut allergy at the table','Prefers Dom Pérignon','Runs late, hold the table','Halal bites only','Wants the bill split by seat','Quiet side of the section','Brings clients, discreet service'],
NOTE_POOL:['Birthday at the table tonight','Hosting clients from Riyadh','Asked for the same host as last time','Complained about wait for ice last visit','Tipped the floor team generously','Second visit this season','Introduced by a Backstage List member'],
/* ---- promoter access, hotels and VIP links: the demo's rules, defaults and sample partners ---- */
RULES:{depOpts:[50,100],holdH:24,shortHoldH:2,shortHoldDays:7,cutoffMin:120,splitFeePct:2,bublPartnerSharePct:20},
PA_RATES:{p1:[10,10,0],p2:[10,10,2],p3:[12,12,3],p4:[10,10,0],p5:[12,12,2],p6:[8,8,0]},
PA_CONTACTS:['Omar Jaber','Lina Haddad','Rami Aoun','Tarek Saab'],
PA_BLANK:{offersFloor:20000,promoter:{cap:8,tix:{early:150,wave:100,vips:10},list:50,rates:{tix:10,tab:10,bar:3},payDays:14,release:48,settle:'dep',notice:7},
  exclusive:{cap:60,tix:{early:0,wave:0,vips:0},list:400,rates:{tix:15,tab:10,bar:5},payDays:14,release:48,settle:'choice',notice:7}},
/* id, name, area, contact, role, phone, tables, table %, ticket %, guarantee, no-show AED, release, status, booked, requests. Hotel names are fictional placeholders. */
HOTELS:[
  ['h1','The Harbour Grand','Dubai Harbour','Nadine R.','Chef Concierge','+971 4 000 1100',['VE5','VE6','PR04','PR05','GR04','GR05'],10,8,true,2000,'18:00','live',['VE5','PR04'],
    [{id:'R1',g:'Mr Petrov',tier:'bsA',party:10,occ:'Birthday',by:'Nadine R.',ago:36,lang:'ru'}]],
  ['h2','Marina Palace Hotel','Dubai Marina','Julien M.','Head Concierge','+971 4 000 2200',['VF5','PR08','GR08'],10,8,true,2000,'18:00','live',['PR08'],
    [{id:'R2',g:'Ms Al Qassimi',tier:'vip',party:6,occ:'',by:'Julien M.',ago:12,lang:'ar'}]],
  ['h3','Palm Crescent Resort','Palm Jumeirah','Aiko T.','Guest Experience','+971 4 000 3300',['VF6','PR09'],8,6,false,0,'18:00','live',[]],
  ['h4','Seventeen Residences','Bluewaters','Front desk','Concierge','+971 4 000 4400',[],8,6,false,0,'18:00','sent',[]]],
HT_BLANK:{role:'Chef Concierge',tab:10,tix:8,guar:true,noShow:2000,release:'18:00'},
VIP_LINKS:[{g:'Faisal Al Mansoori',ph:'+971 50 812 4410',settle:'night',grp:'vip',openHoursAgo:30,bookedHoursAgo:26},{g:'Elena Petrova',ph:'+971 52 330 9102',settle:'dep50',grp:'plat',openHoursAgo:5,bookedHoursAgo:0,pp:[{amt:2000,n:3},{amt:0,n:2}]}]
};
