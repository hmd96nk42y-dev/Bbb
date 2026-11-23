function curView(){return S.view||((ready()&&!S.boothId&&!S.tixMode)?'top':'iso');}
function paintVtog(){document.querySelectorAll('.vtog button').forEach(b=>b.classList.toggle('on',b.dataset.v===curView()));}
function addVtog(host){
if(!host||host.querySelector('.vtog'))return;
const t=document.createElement('div');t.className='vtog';t.setAttribute('role','group');t.setAttribute('aria-label','Room view');
t.innerHTML='<button type="button" data-v="iso" aria-label="3D isometric view">3D</button><button type="button" data-v="top" aria-label="Floor plan view">Plan</button>';
t.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.view=b.dataset.v;dollPost({cmd:'setView',view:S.view});paintVtog();});
host.appendChild(t);paintVtog();
}
