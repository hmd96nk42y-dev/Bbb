/* ================= menu ================= */
const MENU=[
  {cat:'Bottles',d:[
    {nm:'Grey Goose',ds:'Vodka, 70cl',pr:1500},
    {nm:'Belvedere',ds:'Vodka, 70cl',pr:1600},
    {nm:'Casamigos Reposado',ds:'Tequila, 70cl',pr:1800},
    {nm:'Don Julio 1942',ds:'Tequila, 70cl',pr:2500},
    {nm:'Macallan 12 Double Cask',ds:'Whisky, 70cl',pr:1900},
    {nm:'Hennessy XO',ds:'Cognac, 70cl',pr:3200},
    {nm:'Moët Impérial',ds:'Champagne, 75cl',pr:1500},
    {nm:'Dom Pérignon 2013',ds:'Champagne, 75cl',pr:3350},
    {nm:'Armand de Brignac Gold',ds:'Champagne, 1.5L',pr:15500}
  ]},
  {cat:'Packages',pk:1,d:[
    {nm:'The Opener',ds:'Two Grey Goose, mixers, fruit platter',pr:3150,at:3450,tier:'Any table'},
    {nm:'Stage Left',ds:'Don Julio 1942, Moët Impérial, mixers, snack board',pr:4300,at:4800,tier:'Best for VIP and Platinum'},
    {nm:'Backstage',ds:'Two Dom Pérignon 2013, Hennessy XO, sparkler parade',pr:9200,at:10400,tier:'Backstage and VIP'},
    {nm:'The Harbour',ds:'Armand de Brignac Gold 1.5L, two Don Julio 1942, the sparkler show',pr:19500,at:21900,tier:'Backstage tables'}
  ]},
  {cat:'Shots',d:[{nm:'Patrón Silver',ds:'Tequila',pr:70},{nm:'Don Julio Blanco',ds:'Tequila',pr:80},{nm:'Jägermeister',ds:'Herbal liqueur',pr:60},{nm:'Clase Azul Reposado',ds:'Tequila',pr:120}]},
  {cat:'Cocktails',d:[{nm:'Red Room',ds:'Tequila, blood orange, chilli',pr:95},{nm:'Afterhours',ds:'Vodka, espresso, vanilla',pr:85},{nm:'Strobe',ds:'Gin, yuzu, tonic',pr:85},{nm:'Velvet',ds:'Vodka, raspberry, champagne',pr:110},{nm:'Night Shift',ds:'Zero proof, passionfruit, ginger',pr:40}]},
  {cat:'Snacks',d:[{nm:'Truffle fries',ds:'Parmesan, rosemary',pr:120},{nm:'Crispy chicken bites',ds:'Hot honey',pr:135},{nm:'Fruit platter',ds:'For the table',pr:150},{nm:'Wagyu sliders',ds:'Three, caramelised onion',pr:165}]}
];
let curCat='Bottles';
function paintMenuMin(){
  const box=$('#menuMin');if(!box)return;
  if(S.boothId&&!S.bookMin){box.className='mmin hint';box.innerHTML='Pre-order at <b style="color:#fff">10% off</b>. The team confirms your table\'s minimum with you.';return;}
  if(!S.boothId){box.className='mmin hint';box.innerHTML='Hold a table to pre-order: <b style="color:#fff">10% off</b> everything, and each order counts toward your minimum at full menu value.';return;}
  const min=S.bookMin,c=basket.credit,met=c>=min,scale=Math.max(min,c),save=basket.credit-basket.total;
  box.className='mmin';
  box.innerHTML=`<div class="mm-top"><b>${AED(c)}</b><span>toward <b>${AED(min)}</b> minimum</span></div>
    <div class="ms-bar${met?' met':''}"><i style="width:${(c/scale*100).toFixed(1)}%"></i><em style="left:${(min/scale*100).toFixed(1)}%"></em></div>
    <p class="mm-note">${met?`Minimum met${c>min?`, ${AED(c-min)} on top`:''}. `:`${AED(min-c)} to go. `}${save>0?`Pre-ordering has saved you <b>${AED(save)}</b>.`:'Pre-order price is 10% off and counts at full value.'}</p>`;
}
function updateBasket(){
  paintMenuMin();
  const n=basket.items.length;$('#bbItems').textContent=n?`${n} item${n===1?'':'s'}`:'Nothing added yet';$('#bbTotal').textContent=AED(basket.total);
  const booked=!!S.boothId;$('#bbLabel').textContent=booked?`Pre-order for ${BNAMES[S.boothId]}`:'Your basket';
  const pg=$('#bbProg');pg.hidden=!booked;
  pg.hidden=true;
  $('#menuNote').textContent=booked?'Pre-order prices, 10% under the table':'Table prices shown. Hold a table to pre-order for less';
  updateMinSpend();
}
function addItem(d,btn,price,credit){
  credit=credit||price;basket.items.push(d.nm);basket.total+=price;basket.credit+=credit;btn.classList.add('added');btn.textContent='✓';setTimeout(()=>{btn.classList.remove('added');btn.textContent='+';},800);
  updateBasket();
  if(S.boothId){if(basket.credit>=S.bookMin&&basket.credit-credit<S.bookMin){flash();toast('Minimum met. Everything else is on top.');}else toast(`${d.nm} added, ${AED(price)}${credit>price?`, counts ${AED(credit)}`:''}`);}
  else toast(`${d.nm} added. Hold a table to pre-order it.`);
}
function renderMenu(){
  const tabs=$('#mTabs');tabs.innerHTML='';
  MENU.forEach(c=>{const b=ce('button','mtab'+(c.cat===curCat?' on':''),c.cat);b.type='button';b.addEventListener('click',()=>{curCat=c.cat;renderMenu();});tabs.appendChild(b);});
  const L=$('#menuList');L.innerHTML='';L.scrollTop=0;const cat=MENU.find(c=>c.cat===curCat);
  if(cat.pk){
    const booked=!!S.boothId;L.appendChild(ce('p','mnote',booked?'Pre-order price, locked for your table.':'Pre-order prices apply once you hold a table. Until then you see table prices.'));
    cat.d.forEach(d=>{const price=booked?d.pr:d.at;const el=ce('div','pkg',`<div class="ph"><b class="n">${esc(d.nm)}</b><div class="pp"><b>${AED(price)}</b>${booked?`<s>${AED(d.at)} at the table</s>`:`<s>${AED(d.pr)} pre-order</s>`}</div></div><p>${esc(d.ds)}</p><div class="pf"><span class="pt">${esc(d.tier)}</span><button class="madd" type="button" aria-label="Add">+</button></div>`);
      $('.madd',el).addEventListener('click',e=>addItem(d,e.currentTarget,price,d.at));L.appendChild(el);});
    return;
  }
  cat.d.forEach(d=>{
    const row=ce('div','mrow');
    const pre=S.boothId?Math.round(d.pr*(1-PRE_OFF)/5)*5:d.pr;
    row.innerHTML=`<div class="mi"><div class="mnm">${esc(d.nm)}</div><div class="mdesc">${esc(d.ds)}</div></div><span class="mpr">${AED(pre)}${S.boothId?`<s>${AED(d.pr)}</s>`:''}</span><button class="madd" type="button" aria-label="Add">+</button>`;
    $('.madd',row).addEventListener('click',e=>{e.stopPropagation();addItem(d,e.currentTarget,pre,d.pr);});
    L.appendChild(row);
  });
}
function openMenu(cat){curCat=cat||'Bottles';renderMenu();updateBasket();openSheet($('#menuSheet'));}
function openDrinksMenu(){openMenu('Cocktails');}
$('#menuBtn').addEventListener('click',()=>openMenu('Bottles'));
