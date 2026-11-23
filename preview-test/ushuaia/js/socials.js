/* ================= socials ================= */
const SOC=[
  {init:'U',name:'Ushua\u00efa Dubai',handle:'@ushuaiadubai',role:'Venue',bg:'#E2422C',fg:'#fff'},
  {init:'+*',name:'The Ushua\u00efa team',handle:'@ushuaiadubai',role:'Tables',bg:'#141418',fg:'#fff'}
];
function buildSocials(){const L=$('#socList');L.innerHTML='';SOC.forEach(a=>{const c=ce('div','soc-card',`<div class="soc-av" style="background:${a.bg};color:${a.fg}">${a.init}</div><div class="soc-body"><div class="soc-name">${a.name}</div><div class="soc-handle">${a.handle}</div></div><div class="soc-right">${a.role?`<div class="soc-followers">${a.role}</div><div class="soc-flabel">at Ushuaïa</div>`:`<div class="soc-followers">${a.followers}</div><div class="soc-flabel">followers</div>`}<button class="soc-follow" type="button">Follow</button></div>`);
  const b=$('.soc-follow',c);b.addEventListener('click',e=>{e.stopPropagation();const on=b.classList.toggle('ing');b.textContent=on?'Following':'Follow';toast(on?`Following ${a.handle}`:`Unfollowed ${a.handle}`);});
  c.addEventListener('click',()=>toast(`Opening ${a.handle} on Instagram`));L.appendChild(c);});}
$('#rsLocked').addEventListener('click',()=>toast('Your crowd unlocks with your CA'));
