'use strict';
/* ============================================================
   94 · INVITATION PREVIEW
   The guest's invitation, exactly as the Ushuaïa booking web app draws
   it: envelope, wax seal, tear, the room with their table lit, who
   is at the table, table votes and the claim. Only the sender
   changes: it comes from the person responsible for this client.
   It runs in its own frame so the guest app's styles stay its own.
   ============================================================ */
const EV_ACC={bc:['#FFC23A','255,194,58','#000'],adr:['#3DD8FF','61,216,255','#000'],art:['#E6D3A3','230,211,163','#000'],mo:['#8FA8FF','143,168,255','#000'],nw:['#FF2A6D','255,42,109','#fff']};
let _invTpl=null,_venueHTML=null,_invFontCSS=null;
function _b64utf8(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return new TextDecoder('utf-8').decode(u);}
function invTpl(){if(_invTpl)return _invTpl;_invTpl=(window.OPS_PAGES||{}).invitation||null;return _invTpl;}
window.__invVenue=function(){if(_venueHTML)return _venueHTML;_venueHTML=(window.OPS_PAGES||{}).room||null;return _venueHTML;};
window.__invClose=function(){const o=$('#invOv');if(!o)return;o.classList.remove('on');setTimeout(()=>o.remove(),300);};
function invFonts(){if(_invFontCSS!=null)return _invFontCSS;let c='';try{[['sg5','100 599'],['sg7','600 900']].forEach(a=>{const f=FONTS[a[0]];if(f&&f.b64)c+='@font-face{font-family:"Space Grotesk";src:url(data:font/ttf;base64,'+f.b64+') format("truetype");font-weight:'+a[1]+';font-style:normal;font-display:swap}';});}catch(_){}
  return _invFontCSS=c;}
function safeTop(){const p=document.createElement('div');p.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;visibility:hidden;padding-top:env(safe-area-inset-top)';document.body.appendChild(p);const v=parseFloat(getComputedStyle(p).paddingTop)||0;p.remove();return Math.round(v);}
function invData(o){const t=now(),ev=W.ev,acc=EV_ACC[ev.id]||['#FF1414','255,20,20','#fff'],gst=G(o.gi),b=o.b||null,s=S(),p=phase();
  const ph=String(gst.ph||'').replace(/\s/g,''),mm=ph.match(/^\+(971|966|974|965|973|968|961|44|33|1)(\d+)$/);
  const generic=o.kind==='claim'&&o.forBooker;
  const to=generic?{name:'',first:''}:{name:gst.n,first:gst.n.split(' ')[0],cc:mm?mm[1]:'971',tel:mm?mm[2]:''};
  let table=null,party=1,joined=[],host={name:gst.n},arr=W.D+2*HOUR,gate=null,ticket=null;
  if(b){const T=W.T[tableAt(b,t)];table={id:T.id,name:T.name,tier:T.tier,grp:T.grp,minTxt:aed(b.min),comp:!!b.comp};party=b.party;host={name:gName(b.booker)};arr=b.arriveBy;
    joined=b.seats.filter(x=>x.g>=0&&x.g!==b.booker&&(generic||x.g!==o.gi)&&x.cl&&x.cl<=t).map(x=>gName(x.g));}
  else if(o.tx){ticket={tier:KN[o.tx.k]};gate=o.tx.gt&&GATE[o.tx.gt]?GATE[o.tx.gt].label:'Gate 1';arr=o.tx.k===0?W.D+105*MIN:W.D+150*MIN;}
  const booked=s.tb&&s.tb.total?Math.round(s.tb.booked/s.tb.total*100):0,floor=p==='pre'?Math.round((s.fc&&s.fc.att)||TARGET.att):Math.round(s.inAll||0);
  return {kind:o.kind,ev:{id:ev.id,short:ev.short,head:ev.head,acc:acc[0],rgb:acc[1],on:acc[2]},to,host,from:o.from,note:o.note||'',table,ticket,gate,
    day:fD(W.D),t12:t12(arr),arriveAt:arr,off:now()-Date.now(),party,joined,prePicks:b?b.pre.map(x=>x.nm):[],
    stats:{pct:booked,floor,floorL:p==='pre'?'Expected':p==='live'?'Through the doors':'Came',intr:120+h32(ev.id)%260+W.waitlist.filter(w=>w.at<=t).length},sat:safeTop()};}
function openInvite(o){const tpl=invTpl();if(!tpl){toast('The invitation preview is not in this build.');return;}
  if($('#invOv'))$('#invOv').remove();
  const data=invData(o),html=tpl.replace('/*__FONTS__*/',invFonts()).replace('/*__DATA__*/','window.__INV='+JSON.stringify(data).replace(/</g,'\\u003c')+';');
  const ov=document.createElement('div');ov.id='invOv';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Invitation preview');
  ov.innerHTML='<div class="inv-bar"><span class="inv-tag">'+I('star',13)+'Preview · what '+esc(data.to.first||'the guest')+' sees</span></div><iframe title="Invitation preview"></iframe>';
  document.body.appendChild(ov);const f=$('iframe',ov);f.srcdoc=html;
  requestAnimationFrame(()=>requestAnimationFrame(()=>ov.classList.add('on')));
  setTimeout(()=>{const t=$('.inv-tag',ov);if(t)t.classList.add('out');},2800);
  log('Invitation previewed',gName(o.gi)+', from '+(o.from&&o.from.name));}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#invOv'))window.__invClose();});
