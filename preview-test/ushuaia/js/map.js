(function(){
const LAT=25.0914,LON=55.1279,DX=.0055,DY=.0033;
const OSM=`https://www.openstreetmap.org/export/embed.html?bbox=${(LON-DX).toFixed(4)}%2C${(LAT-DY).toFixed(4)}%2C${(LON+DX).toFixed(4)}%2C${(LAT+DY).toFixed(4)}&layer=mapnik`;
const APPLE=`https://maps.apple.com/?ll=${LAT},${LON}&q=Usha%C3%AFa%20Dubai%20Harbour&z=16`;
const GOOGLE=`https://www.google.com/maps/search/?api=1&query=Ushuaia+Dubai+Harbour+Experience`;
window.lcMapHTML=function(where){
const head=where==='ip'?`<div class="ip-thd"><b>Where</b><span>Dubai Harbour</span></div>`
:`<div class="sec-hd"><h2 class="sech">Find us</h2><span>Dubai Harbour</span></div>`;
return `<section class="lc-loc">${head}
<div class="lc-map"><iframe src="${OSM}" title="Map showing Ushuaïa at Dubai Harbour" loading="lazy" tabindex="-1" referrerpolicy="no-referrer" onload="this.classList.add('ok')"></iframe>
<span class="lc-pin" aria-hidden="true"><i></i></span><a class="lc-hit" href="${APPLE}" target="_blank" rel="noopener" aria-label="Open Ushuaïa in Maps"></a></div>
<div class="lc-addr"><div><b>Ushuaïa Dubai Harbour Experience</b><span>Dubai Harbour, off Sheikh Mohammed bin Rashid Boulevard</span></div><a class="lc-open" href="${APPLE}" target="_blank" rel="noopener">Open in Maps</a></div>
<p class="lc-alt"><a href="${GOOGLE}" target="_blank" rel="noopener">Google Maps</a><span>Map data © OpenStreetMap contributors</span></p></section>`;
};
const slot=document.getElementById('bkLoc');if(slot)slot.outerHTML=window.lcMapHTML('bk');
})();
