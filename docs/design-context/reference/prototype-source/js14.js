/* ===== init ===== */
(function(){
 if(typeof qrcode==='undefined'){const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';s.onload=()=>{try{render(true)}catch(e){}};document.head.appendChild(s)}
 ['online','offline'].forEach(ev=>0);
 if(location.search&&/tab=/.test(location.search)){applyQuery();if(!location.hash||location.hash==='#'||location.hash==='#home')location.hash='explore'}if(!location.hash||location.hash==='#')location.hash='home';
 online=navigator.onLine!==false;
 navigate();
})();
