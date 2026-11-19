/* ================= the room · renders gallery ================= */
const _VURL={};
function vidURL(d){if(!d||d.indexOf('data:')!==0)return d;if(_VURL[d.length])return _VURL[d.length];const i=d.indexOf(','),bin=atob(d.slice(i+1)),n=bin.length,u=new Uint8Array(n);for(let j=0;j<n;j++)u[j]=bin.charCodeAt(j);
  return _VURL[d.length]=URL.createObjectURL(new Blob([u],{type:'video/mp4'}));}
const ROOM_MEDIA=[
  {vid:GAL.v1,poster:GAL.v1p,cap:'<b>Under the dome.</b> Ushua\u00efa Dubai Harbour at full tilt.'},
  {src:GAL.u2,cap:'<b>The arch.</b> Black Coffee on the screen, the whole harbour in front of him.'},
  {vid:GAL.v2,poster:GAL.v2p,cap:'<b>Lights down.</b> The ring goes up and the floor goes with it.'},
  {src:GAL.u1,cap:'<b>Front row.</b> Black Coffee at the booth.'}
];
function buildMedia(){
  const sc=$('#mediaScroll'),dots=$('#mediaDots');if(sc.childElementCount)return;
  ROOM_MEDIA.forEach((m,i)=>{sc.appendChild(ce('div','media-card'+(m.vid?' mv':''),`<img src="${m.vid||m.src}" alt=""><p>${m.cap}</p>`));dots.appendChild(ce('span',i?'':'on'));});
  sc.addEventListener('scroll',()=>{const i=Math.round(sc.scrollLeft/(sc.clientWidth+10));$$('span',dots).forEach((d,k)=>d.classList.toggle('on',k===i));},{passive:true});
}
$('#mediaBtn').addEventListener('click',()=>{buildMedia();$('#mediaOvr').classList.add('show');});
$('#medClose').addEventListener('click',()=>$('#mediaOvr').classList.remove('show'));
(function(){const a=$('#mediaBtn .vbg'),b=$('#menuBtn .vbg');if(a)a.style.backgroundImage=`url('${GAL.tIn}')`;if(b)b.style.backgroundImage=`url('${GAL.tMenu}')`;})();
