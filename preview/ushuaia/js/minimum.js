/* ================= minimum spend ================= */
function showMinSpend(){$('#minSpend').hidden=false;updateMinSpend();if(window.vtRender)vtRender();}
function updateMinSpend(){
  if(!S.boothId)return;const t=T(S.boothId),spent=basket.credit,min=S.bookMin;
  if(!min){$('#msTable').textContent=t.name;$('#msSpent').textContent=AED(spent);$('#msMin').textContent='on request';$('#msFill').style.width='0%';$('#msMark').style.left='100%';$('#msBar').classList.remove('met');$('#msOver').textContent='The team confirms your minimum with you';$('#msOver').style.color='var(--ink2)';$('#msNote').textContent='Pre-order and pay 10% less than the table price. Everything counts at full value once your minimum is set.';$('#msPre').textContent=spent?'Add to your pre-order':'Pre-order from the menu';return;}
  $('#msTable').textContent=t.name;$('#msSpent').textContent=AED(spent);$('#msMin').textContent=AED(min);
  const scale=Math.max(min,spent),met=spent>=min;
  $('#msFill').style.width=(spent/scale*100)+'%';$('#msMark').style.left=(min/scale*100)+'%';
  $('#msBar').classList.toggle('met',met);
  $('#msOver').textContent=met?(spent>min?`Minimum met, ${AED(spent-min)} on top`:'Minimum met'):`${AED(min-spent)} to go`;
  $('#msOver').style.color=met?'var(--green)':'var(--ink2)';
  const save=basket.credit-basket.total;
  $('#msNote').textContent=met?`Everything from here is on top of your minimum.${save>0?` Pre-ordering has saved you ${AED(save)} so far.`:''}`:`Pre-order and pay 10% less than the table price, while every order still counts at full value toward your minimum.${save>0?` Saved so far: ${AED(save)}.`:''}`;
  $('#msPre').textContent=spent?'Add to your pre-order':'Pre-order from the menu';
}
$('#msPre').addEventListener('click',()=>openMenu('Packages'));
