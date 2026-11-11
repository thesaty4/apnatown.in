/* ===== utils ===== */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const rid=p=>p+Math.random().toString(36).slice(2,7);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const IST={timeZone:'Asia/Kolkata'};
const fdate=ts=>new Date(ts).toLocaleDateString('en-IN',{...IST,day:'numeric',month:'short',year:'numeric'});
const ftime=ts=>new Date(ts).toLocaleTimeString('en-IN',{...IST,hour:'numeric',minute:'2-digit',hour12:true});
const fdt=ts=>fdate(ts)+', '+ftime(ts);
const ago=ts=>{const m=Math.round((Date.now()-ts)/60000);if(m<1)return t('Just now');if(m<60)return m+' '+t('min ago');const h=Math.round(m/60);if(h<24)return h+' '+t('hr ago');return fdate(ts)};
const DAY=864e5,HR=36e5,MIN=6e4;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* ===== icons (24px line set) ===== */
const IC={
home:'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
cart:'M3 4h2l2.4 11h10.2l2-8H6.2M9 20.5h.01M17 20.5h.01',
bookmark:'M6 3h12v18l-6-4-6 4z',
heart:'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z',
share:'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
phone:'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
pin:'M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
nav:'M3 11l18-8-8 18-2-8z',
star:'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z',
bell:'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21a2 2 0 0 0 4 0',
user:'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM4 21a8 8 0 0 1 16 0',
users:'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7M18 21a7 7 0 0 0-3-5.7',
box:'M3 7.5L12 3l9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9',
truck:'M2 6h11v10H2zM13 9h5l3 3v4h-8zM6 19h.01M17 19h.01',
check:'M4 12.5l5 5L20 6.5',x:'M5 5l14 14M19 5L5 19',plus:'M12 5v14M5 12h14',minus:'M5 12h14',
cr:'M9 5l7 7-7 7',cl:'M15 5l-7 7 7 7',cd:'M5 9l7 7 7-7',cu:'M5 15l7-7 7 7',
filter:'M4 6h16M7 12h10M10 18h4',
clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
qr:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM20 14v3M14 20h3M20 20h.01',
camera:'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
mic:'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM6 11a6 6 0 0 0 12 0M12 17v4',
trash:'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
edit:'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
menu:'M4 6h16M4 12h16M4 18h16',
globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
moon:'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
sun:'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
store:'M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9M10 20v-6h4v6',
sliders:'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
map:'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
chart:'M4 20V10M10 20V4M16 20v-8M22 20H2',
shield:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
tag:'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
chat:'M4 20l1.3-4A8.5 8.5 0 1 1 8.2 18.8z',
mail:'M3 5h18v14H3zM3 6l9 7 9-7',
upload:'M12 16V4M7 9l5-5 5 5M4 20h16',
logout:'M9 21H4V3h5M16 17l5-5-5-5M21 12H9',
alert:'M12 3l10 18H2zM12 10v5M12 18h.01',
info:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
copy:'M9 9h11v11H9zM5 15H4V4h11v1',
eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
refresh:'M20 11a8 8 0 0 0-14-4L4 9M4 5v4h4M4 13a8 8 0 0 0 14 4l2-2M20 19v-4h-4',
rupee:'M6 4h12M6 9h12M9 4c5 0 7 2 7 5s-2 5-7 5h-3l8 7',
dots:'M5 12h.01M12 12h.01M19 12h.01',
bike:'M5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 14.5L9 7h5l3 7.5M9 7H7M13 7l-2 7.5',
doc:'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6',
lock:'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
wallet:'M3 7h17v13H3zM3 7l3-3h12v3M16 13.5h.01',
print:'M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z',
layers:'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
flag:'M5 21V4M5 4h11l-2 4 2 4H5',
send:'M21 3L3 11l7 3 3 7zM10 14l11-11',
wrench:'M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.700-6.700a4 4 0 0 0 5-5l-2.500 2.500-2.500-.5-.5-2.500z',
play:'M7 4l13 8-13 8z',heartf:'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z',lockic:'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',zoom:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.300-4.300M8 11h6M11 8v6',merge:'M6 3v6a6 6 0 0 0 6 6h6M18 15l-3-3M18 15l-3 3',candle:'M7 4v3M7 17v3M5 7h4v10H5zM17 3v5M17 15v4M15 8h4v7h-4z',chev:'M5 9l7 7 7-7'
};
const ic=(n,s=20,cls='')=>`<svg class="ic ${n==='star'?'fill':''} ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[n]||IC.dots}"/></svg>`;
const icf=(n,s=20)=>`<svg class="ic fill" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[n]}"/></svg>`;
const stars=(r,sz=15)=>{let h='';for(let i=1;i<=5;i++){h+=`<svg class="ic fill ${r>=i-.25?'':'e'}" width="${sz}" height="${sz}" viewBox="0 0 24 24"><path d="${IC.star}"/></svg>`}return `<span class="stars" role="img" aria-label="${(+r).toFixed(1)} ${t('out of 5')}">${h}</span>`};
const art=(emoji,hue,cls='')=>`<div class="art ${cls}" style="--h:${hue}" aria-hidden="true"><span>${emoji}</span></div>`;
/* ===== i18n ===== */
let HI={};
const t=(s)=>{ if(typeof S==='undefined'||S.lang!=='hi')return s; return HI[s]||s; };
const nm=o=>!o?'':typeof o==='string'?o:(S.lang==='hi'&&o.hi?o.hi:o.en);
