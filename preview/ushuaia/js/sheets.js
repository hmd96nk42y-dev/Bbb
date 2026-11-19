/* ================= shared sheet ================= */
let openSheetEl=null,sheetClose=null;
function openSheet(el,onClose){closeSheet(true);openSheetEl=el;sheetClose=onClose||null;try{updatePause();}catch(_){}$('#mshScrim').classList.add('on');requestAnimationFrame(()=>{if(openSheetEl===el)el.classList.add('on');});}
function closeSheet(silent){if(!openSheetEl)return;const el=openSheetEl,cb=sheetClose;openSheetEl=null;sheetClose=null;setTimeout(()=>{try{updatePause();}catch(_){}},60);el.classList.remove('on');$('#mshScrim').classList.remove('on');if(cb&&!silent)cb();}
$('#mshScrim').addEventListener('click',()=>closeSheet());
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeSheet()));
(function(){ /* swipe the sheet down to dismiss */
  $$('.msh').forEach(sh=>{let y0=null,dy=0;const grip=sh.querySelector('.msh-grip'),hd=sh.querySelector('.msh-hd');
    [grip,hd].forEach(h=>{h.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;y0=e.clientY;dy=0;sh.style.transition='none';});});
    window.addEventListener('pointermove',e=>{if(y0===null)return;dy=Math.max(0,e.clientY-y0);sh.style.transform=`translateY(${dy}px)`;});
    window.addEventListener('pointerup',()=>{if(y0===null)return;y0=null;sh.style.transition='';sh.style.transform='';if(dy>80)closeSheet();});
  });
})();
