/* ===== registries ===== */
const V={},A={},F={},CH={},INP={};let post=[];
/* ===== route/role map ===== */
const ROLEOF={};
const defR=(role,names)=>names.split(' ').forEach(n=>ROLEOF[n]=role);
defR('vendor','vfollow vhome vorders vorder vproducts vprod voffers vinv vreviews vqr vmedia vprofile vnotif vaccount vearn vonboard vservices venq');
defR('provider','sfollow shome senq sprofile sreviews sqr snotif saccount sanalytics sonboard sorders sorder sproducts sprod sservices smedia soffers');
defR('rider','rhome rreq ractive rhistory rearn rfeedback rprofile ronboard');
defR('admin','avideos akeys ahome aappr ausers acats alistings aorders areviews apromos acomms areports aaudit alive aprofile asubs');
defR('super','xhome xadmins xroles xgeo xsettings xanalytics xactivity xcity');
const NAV={
 vendor:{home:'vhome',label:'Vendor',prim:['vhome','vorders','vproducts','vreviews'],groups:[['Sell',[['vhome','Overview','chart'],['vorders','Orders','box'],['vproducts','Products','tag'],['vservices','Services','wrench'],['venq','Enquiries','chat'],['vinv','Inventory','layers'],['voffers','Offers','rupee']]],['Grow',[['vreviews','Reviews','star'],['vfollow','Followers','heart'],['vqr','QR & links','qr'],['vmedia','Gallery & media','camera'],['vprofile','Business profile','store']]],['Account',[['vearn','Earnings & plan','wallet'],['vnotif','Notifications','bell'],['vaccount','Account','sliders']]]]},
 provider:{home:'shome',label:'Service provider',prim:['shome','senq','sprofile','sreviews'],groups:[['Work',[['shome','Overview','chart'],['senq','Enquiries','chat'],['sorders','Orders','box'],['sproducts','Products','tag'],['sservices','Services','wrench'],['sprofile','Profile','store'],['sreviews','Reviews','star'],['sfollow','Followers','heart']]],['Grow',[['smedia','Gallery & media','camera'],['sqr','QR & links','qr'],['sanalytics','Analytics','chart']]],['Account',[['snotif','Notifications','bell'],['saccount','Account','sliders']]]]},
 rider:{home:'rhome',label:'Rider',prim:['rhome','rreq','rearn','rprofile'],groups:[['Deliver',[['rhome','Home','home'],['rreq','Requests','bike'],['ractive','Active delivery','truck'],['rhistory','History','list']]],['Me',[['rearn','Earnings','wallet'],['rfeedback','Feedback','star'],['rprofile','Profile & documents','user']]]]},
 admin:{home:'ahome',label:'Admin',prim:['ahome','aappr','aorders','areviews'],groups:[['Monitor',[['ahome','Overview','chart'],['alive','Live deliveries','map'],['aorders','Orders & disputes','box'],['areports','Reports','chart']]],['Manage',[['aappr','Approvals','shield'],['ausers','Users','users'],['acats','Categories','layers'],['asubs','Subcategory suggestions','list'],['alistings','Listings','tag'],['areviews','Review moderation','star']]],['Grow',[['apromos','Promotions','rupee'],['acomms','Communications','send'],['avideos','Videos & moderation','play'],['akeys','Search keywords','search']]],['System',[['aaudit','Audit log','doc'],['aprofile','Profile','user']]]]},
 super:{home:'xhome',label:'Super Admin',prim:['xhome','xadmins','xgeo','xsettings'],groups:[['Platform',[['xhome','Overview','chart'],['xanalytics','Analytics','chart'],['xactivity','Activity monitor','doc']]],['Control',[['xadmins','Admins & areas','users'],['xroles','Roles & permissions','lock'],['xgeo','Cities & zones','map'],['xsettings','Global settings','sliders']]],['Admin tools',[['ahome','Admin overview','shield'],['aappr','Approvals','shield'],['aorders','Orders & disputes','box'],['alive','Live map','map'],['areviews','Reviews','star'],['acomms','Communications','send'],['avideos','Videos & moderation','play'],['akeys','Search keywords','search'],['acats','Categories','layers'],['asubs','Subcategory suggestions','list'],['ausers','Users','users']]]]}};
const ROLES=[['customer','Customer','🛍️'],['vendor','Vendor','🏪'],['provider','Service provider','🔧'],['rider','Rider','🛵'],['admin','Admin','🛡️'],['super','Super Admin','👑']];
const HOMEOF={customer:'home',vendor:'vhome',provider:'shome',rider:'rhome',admin:'ahome',super:'xhome'};
const cur=()=>{const h=(location.hash||'#home').slice(1)||'home';const m=h.match(/^([A-Za-z]+)(?:-(.+))?$/);return m?{name:m[1],arg:m[2]||'',raw:h}:{name:'nf',arg:'',raw:h}};
const go=r=>{if(location.hash==='#'+r)navigate();else location.hash=r};
let loading=false,loadTimer=0,online=true;
function navigate(){const c=cur();closeSheet();if(c.name!=='explore'&&location.search){try{history.replaceState(null,'',location.pathname+location.hash)}catch(e){}}loading=true;S.__err=S.demo.err;render();clearTimeout(loadTimer);window.scrollTo(0,0);loadTimer=setTimeout(()=>{loading=false;if(S.demo.err){S.demo.err=false;save()}render()},S.demo.slow?1100:260)}
window.addEventListener('hashchange',navigate);
window.addEventListener('online',()=>{online=true;render(true)});window.addEventListener('offline',()=>{online=false;render(true)});
/* ===== chrome ===== */
const LOGO=`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 30S5 20.5 5 13a11 11 0 0 1 22 0c0 7.5-11 17-11 17z" fill="var(--primary)"/><path d="M9.500 11.500h13L21 7.500H11z" fill="#fff"/><path d="M9.500 11.500h13v1.200a3.250 3.250 0 0 1-6.500 0 3.250 3.250 0 0 1-6.500 0z" fill="#FDBA74"/><rect x="11.500" y="15" width="9" height="5.500" rx="1" fill="#fff"/></svg>`;
const logoHtml=`<a class="logo" href="#home" aria-label="ApnaTown.in home">${LOGO}<span>Apna<b>Town</b></span></a>`;
const unread=role=>(D().notifs[role]||[]).filter(n=>!n.read).length;
const roleKey=r=>r==='customer'?'cust':r;
function topCustomer(c){const showLoc=!['cart','checkout','login'].includes(c.name);
 const menu=[['home','Home'],['explore','Explore'],['videos','Videos'],['services','Services'],['offers','Offers'],['orders','Orders']].map(([r,l])=>`<a href="#${r}" class="${c.name===r?'on':''}">${t(l)}</a>`).join('');
 return `<header class="top"><div class="wrap">${logoHtml}<nav class="deskmenu" aria-label="Main">${menu}</nav><span class="grow"></span>
 <button class="lang" data-act="lang" aria-label="Language: ${S.lang==='en'?'हिन्दी':'English'}">${S.lang==='en'?'हिं':'EN'}</button>
 <a class="iconbtn" href="#videos" aria-label="${t('Videos and reels')}" title="${t('Videos')}">${ic('play',22)}</a>
 <a class="iconbtn" href="#notifications" aria-label="${t('Notifications')}">${ic('bell',22)}${unread('cust')?`<span class="dot">${unread('cust')}</span>`:''}</a>
 <a class="iconbtn" href="#cart" aria-label="${t('Cart')}">${ic('cart',22)}${cartCount()?`<span class="dot">${cartCount()}</span>`:''}</a>
 <a class="iconbtn hide-m" href="${S.user?'#account':'#login'}" aria-label="${t('Account')}">${ic('user',22)}</a>
 ${showLoc?`<div class="top2"><button class="locbar" data-act="loc" aria-label="${t('Change location')}">${ic('pin',20)}<span><small>${t('Browsing near')}</small><strong>${esc(S.loc.id==='gps'?t('Current location'):nm(areaOf(S.loc.id)))}, Padrauna</strong></span>${ic('cd',16)}</button><a class="sbtn" href="#search" aria-label="${t('Search')}">${ic('search',20)}<span class="truncate">${t('Search shops, products, services')}</span>${ic('mic',20)}</a></div>`:''}
 </div></header>`}
function bottomCustomer(c){const items=[['home','Home','home'],['explore','Explore','map'],['videos','Videos','play'],['cart','Cart','cart'],['orders','Orders','box'],[S.user?'account':'login','Account','user']];
 return `<nav class="bottom cust" aria-label="Main">${items.map(([r,l,i])=>`<a href="#${r}" class="${c.name===r||(r==='account'&&['profile','addresses','prefs','help','bookmarks','reviews'].includes(c.name))?'on':''}" ${c.name===r?'aria-current="page"':''}>${ic(i,22)}${t(l)}${r==='cart'&&cartCount()?`<span class="dot">${cartCount()}</span>`:''}</a>`).join('')}</nav>`}
function footer(){return `<footer class="foot hide-m"><div class="wrap grid g4"><div>${logoHtml}<p class="small muted" style="margin-top:8px">${t(D().cfg.brand.tag)}</p></div><div><h4>${t('Company')}</h4><a href="#about">${t('About us')}</a><a href="#help">${t('Contact & help')}</a><a href="#design">${t('Design system')}</a></div><div><h4>${t('Join us')}</h4><a href="#vonboard" data-act="asRole" data-role="vendor">${t('Sell on ApnaTown (Vendor signup)')}</a><a href="#ronboard" data-act="asRole" data-role="rider">${t('Become a rider')}</a><a href="#sonboard" data-act="asRole" data-role="provider">${t('List your service')}</a></div><div><h4>${t('Legal')}</h4><a href="#terms">${t('Terms')}</a><a href="#privacy">${t('Privacy')}</a><a href="#refund">${t('Refund policy')}</a><button class="lang" style="margin-top:8px" data-act="lang">${S.lang==='en'?'हिन्दी':'English'}</button></div></div></footer>`}
function dashChrome(role,c,inner){const N=NAV[role],all=N.groups.flatMap(g=>g[1]);const on=r=>c.name===r||(c.name==='vorder'&&r==='vorders')||(c.name==='vprod'&&r==='vproducts')||(c.name==='senq'&&r==='senq')||(c.name==='aappr'&&r==='aappr')||(c.name==='aorder'&&r==='aorders');
 const nk=roleKey(role),un=unread(nk);
 const side=N.groups.map(([h,it])=>`<h6>${t(h)}</h6>${it.map(([r,l,i])=>`<a href="#${r}" class="${on(r)?'on':''}" ${on(r)?'aria-current="page"':''}>${ic(i,20)}${t(l)}</a>`).join('')}`).join('');
 const bn=N.prim.map(r=>{const x=all.find(a=>a[0]===r);return `<a href="#${r}" class="${on(r)?'on':''}">${ic(x[2],22)}${t(x[1])}</a>`}).join('');
 const noteR={vendor:'vnotif',provider:'snotif'}[role]||'';
 return `<header class="top"><div class="wrap dh">${logoHtml}<span class="badge sec" style="margin-left:4px">${ROLES.find(r=>r[0]===role)[2]} ${t(N.label)}</span><span class="grow"></span><button class="lang" data-act="lang">${S.lang==='en'?'हिं':'EN'}</button>${noteR?`<a class="iconbtn" href="#${noteR}" aria-label="${t('Notifications')}">${ic('bell',22)}${un?`<span class="dot">${un}</span>`:''}</a>`:`<button class="iconbtn" data-act="notifs" aria-label="${t('Notifications')}">${ic('bell',22)}${un?`<span class="dot">${un}</span>`:''}</button>`}<button class="iconbtn" data-act="demo" aria-label="${t('Switch role')}">${ic('users',22)}</button></div></header>
 <div class="dash-wrap"><aside class="side" aria-label="Sections">${side}<h6>${t('Switch')}</h6><a href="#home" data-act="asRole" data-role="customer">${ic('home',20)}${t('Customer app')}</a><a href="#design">${ic('layers',20)}${t('Design system')}</a></aside><main id="main" tabindex="-1" class="wrap">${inner}</main></div>
 <nav class="bottom dash" aria-label="Sections">${bn}<button data-act="moreNav" class="${all.some(a=>on(a[0])&&!N.prim.includes(a[0]))?'on':''}">${ic('menu',22)}${t('More')}</button></nav>`}
/* ===== render ===== */
function render(keep){
 const y=keep?window.scrollY:0;const c=cur();
 document.documentElement.dataset.theme=S.theme;document.documentElement.lang=S.lang==='hi'?'hi':'en';document.body.classList.toggle('lite',!!S.demo.lite);
 const need=ROLEOF[c.name];let body,role='customer';
 const allowed=!need||S.role===need||(S.role==='super'&&need==='admin');
 if(need&&allowed)role=S.role==='super'&&need==='admin'?'super':need;
 post=[];
 if(loading)body=c.name==='videos'?reelSkel():skel(6);
 else if(S.__err&&S.demo.err===false&&false)body='';
 else if(S.demo.err&&!loading)body=errState();
 else if(!allowed)body=noPerm(need==='super'?'Super Admin area. Admins can’t open it.':undefined);
 else{const fn=V[c.name];try{body=fn?fn(c.arg):V.nf()}catch(e){console.error(e);body=errState('This page hit a snag.')}}
 let html;
 if(need&&allowed&&c.name!=='vonboard'&&c.name!=='ronboard'&&c.name!=='sonboard')html=dashChrome(role,c,body);
 else if(c.name==='videos')html=body;else html=topCustomer(c)+`<main id="main" tabindex="-1" class="wrap">${body}</main>`+(c.name==='checkout'?'':footer())+bottomCustomer(c);
 const app=$('#app');app.innerHTML=(online?'':`<div class="offline" role="status">${t('You are offline. Showing saved data.')} <button class="btn sm g" data-act="retry" style="min-height:28px;padding:0 10px">${t('Retry')}</button></div>`)+html;
 const ban=$('#consent');if(ban)ban.innerHTML=S.consent.cookies===null?`<div class="banner" role="dialog" aria-label="Cookies"><b>${t('Cookies & privacy')}</b><p class="small t2" style="margin:4px 0 10px">${t('We use cookies to remember your language, location and cart. No ads.')}</p><div class="row"><button class="btn g sm grow" data-act="cookie" data-v="0">${t('Only essential')}</button><button class="btn p sm grow" data-act="cookie" data-v="1">${t('Accept all')}</button></div></div>`:'';
 post.forEach(f=>{try{f()}catch(e){console.error(e)}});
 window.scrollTo(0,y);
}
/* ===== global actions ===== */
A.closeSheet=()=>closeSheet();
A.cb=el=>{const f=CB[el.dataset.id];closeSheet();f&&f()};
A.retry=()=>{S.demo.err=false;save();loading=true;render();setTimeout(()=>{loading=false;render()},400)};
A.lang=()=>{S.lang=S.lang==='en'?'hi':'en';save();render(true);toast(S.lang==='hi'?'भाषा: हिन्दी':'Language: English','globe')};
A.cookie=el=>{S.consent.cookies=el.dataset.v==='1';save();render(true)};
A.fakeUpload=el=>{toast(t('Photo added (demo)'),'camera')};
A.back=()=>history.length>1?history.back():go('home');
A.asRole=el=>{S.role=el.dataset.role;save();};
A.moreNav=()=>{const role=S.role==='super'&&ROLEOF[cur().name]==='admin'?'super':S.role;const N=NAV[role];if(!N)return;sheet(`<h3>${t('All sections')}</h3><div class="stack" style="margin-top:10px">${N.groups.map(([h,it])=>`<div><div class="lbl muted xs" style="text-transform:uppercase;letter-spacing:.06em">${t(h)}</div><div class="grid g2" style="margin-top:6px">${it.map(([r,l,i])=>`<a class="card pad row" href="#${r}" data-act="closeSheet">${ic(i,20)} ${t(l)}</a>`).join('')}</div></div>`).join('')}<a class="btn o block" href="#home" data-act="asRole" data-role="customer">${t('Open customer app')}</a></div>`,{label:'Sections'})};
A.notifs=()=>{const nk=roleKey(S.role),l=D().notifs[nk]||[];sheet(`<div class="row between"><h3>${t('Notifications')}</h3><button class="btn t sm" data-act="readAll" data-k="${nk}">${t('Mark all read')}</button></div><div class="stack" style="margin-top:10px">${l.length?l.map(n=>notifCard(n)).join(''):empty('🔔','All caught up','New alerts will show here.')}</div>`,{label:'Notifications'})};
A.readAll=el=>{(D().notifs[el.dataset.k]||[]).forEach(n=>n.read=true);save();closeSheet();render(true)};
const notifIcon={order:'box',offer:'tag',review:'star',appr:'shield',enq:'chat',job:'bike',admin:'info',sys:'bell'};
const notifCard=n=>`<a class="card pad row" style="align-items:flex-start;${n.read?'':'border-color:var(--primary)'}" href="#${n.link||'home'}" data-act="readOne" data-id="${n.id}"><span class="mini art" style="width:40px;height:40px;--h:30;font-size:1rem">${ic(notifIcon[n.type]||'bell',20)}</span><div class="grow"><b>${esc(t(n.title))}</b>${n.read?'':' <span class="badge solid">'+t('New')+'</span>'}<div class="small t2">${esc(t(n.body))}</div><div class="xs muted">${ago(n.ts)}</div></div></a>`;
A.readOne=el=>{Object.values(D().notifs).flat().forEach(n=>{if(n.id===el.dataset.id)n.read=true});save();closeSheet()};
/* demo panel */
A.demo=()=>{const dm=S.demo,vb=biz(S.vend.bid),pv=svc(S.prov.sid),rd=rider(S.rider.rid);
 const st=(k,id,cur,fn)=>`<div class="field"><span class="lbl small">${k}</span><div class="chips">${['pending','approved','rejected','suspended','inactive'].map(s=>`<button class="chip ${cur===s?'on':''}" data-act="setStatus" data-w="${fn}" data-id="${id}" data-s="${s}">${t(AP[s][0])}</button>`).join('')}</div></div>`;
 sheet(`<div class="row between"><h3>${t('Demo controls')}</h3><button class="iconbtn" data-act="closeSheet" aria-label="${t('Close')}">${ic('x')}</button></div><p class="small muted">${t('This prototype runs in your browser with sample data. Switch roles to see each dashboard. Changes you make are shared across roles.')}</p><div class="stack" style="margin-top:10px">
 <div><span class="lbl small">${t('View as')}</span><div class="grid g2" style="margin-top:6px">${ROLES.map(([r,l,e])=>`<button class="btn ${S.role===r?'p':'g'} sm" data-act="pickRole" data-role="${r}">${e} ${t(l)}</button>`).join('')}</div></div>
 <div><span class="lbl small">${t('Theme')}</span><div class="chips">${[['auto','Auto'],['light','Light'],['dark','Dark']].map(([k,l])=>`<button class="chip ${S.theme===k?'on':''}" data-act="theme" data-v="${k}">${t(l)}</button>`).join('')}<button class="chip" data-act="lang">${S.lang==='en'?'हिन्दी':'English'}</button></div></div>
 ${toggle('failPay',dm.failPay,'Simulate payment failure','dm')}${toggle('slow',dm.slow,'Slow connection (longer skeletons)','dm')}${toggle('lite',dm.lite,'Lite mode (lighter images)','dm')}${toggle('err',dm.err,'Show error state on next page','dm')}${toggle('chartErr',dm.chartErr,'Show error in the Super Admin chart','dm')}${toggle('videoFail',dm.videoFail,'Videos fail to load (retry state)','dm')}
 ${st('Vendor account status ('+nm(vb.name)+')',vb.id,vb.status,'biz')}${st('Service provider status ('+nm(pv.name)+')',pv.id,pv.status,'svc')}${st('Rider status ('+rd.name+')',rd.id,rd.status,'rider')}
 <div class="field"><span class="lbl small">${t('Admin account')}</span><div class="chips">${D().admins.map(a=>`<button class="chip ${S.adminId===a.id?'on':''}" data-act="pickAdmin" data-id="${a.id}">${esc(a.name)}</button>`).join('')}</div></div>
 <div class="row"><a class="btn g grow" href="#design" data-act="closeSheet">${ic('layers',18)} ${t('Design system')}</a><button class="btn d grow" data-act="resetAll">${ic('refresh',18)} ${t('Reset demo data')}</button></div></div>`,{label:'Demo controls'})};
A.pickRole=el=>{S.role=el.dataset.role;save();closeSheet();const r=el.dataset.role;go(HOMEOF[r]);toast(t('Viewing as')+' '+t(ROLES.find(x=>x[0]===r)[1]),'users')};
A.theme=el=>{S.theme=el.dataset.v;save();render(true)};
CH.dm=el=>{S.demo[el.dataset.k]=el.checked;save()};
CH.tg=el=>{};
A.pickAdmin=el=>{S.adminId=el.dataset.id;save();closeSheet();toast(t('Admin switched'),'users');render(true)};
A.setStatus=el=>{const{w,id,s}=el.dataset;const e=w==='biz'?biz(id):w==='svc'?svc(id):rider(id);e.status=s;save();closeSheet();render(true);toast(t('Status')+': '+t(AP[s][0]))};
A.resetAll=()=>confirmBox(t('Reset all demo data?'),t('Your cart, orders and changes will be cleared.'),t('Reset'),()=>{resetAll();location.hash='home';navigate()},true);
/* delegated events */
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;const f=A[el.dataset.act];if(f){if(el.tagName==='BUTTON'||(el.tagName==='A'&&(!el.getAttribute('href')||el.getAttribute('href')==='#')))e.preventDefault();f(el,e)}});
document.addEventListener('submit',e=>{const f=e.target.closest('form[data-form]');if(!f)return;e.preventDefault();const fn=F[f.dataset.form];fn&&fn(Object.fromEntries(new FormData(f)),f)});
document.addEventListener('input',e=>{const el=e.target.closest('[data-in]');if(el&&INP[el.dataset.in])INP[el.dataset.in](el.value,el)});
document.addEventListener('change',e=>{const el=e.target.closest('[data-chg]');if(el&&CH[el.dataset.chg])CH[el.dataset.chg](el)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});
/* login gate */
function needLogin(why){if(S.user)return false;sheet(`<div class="stack center"><div class="ill state" style="padding:0"><div class="ill">🔐</div></div><h3>${t('Please log in to continue')}</h3><p class="t2">${t(why||'Log in with your mobile number to continue.')}</p><a class="btn p block" href="#login" data-act="loginNext">${t('Log in / Sign up')}</a><button class="btn t" data-act="closeSheet">${t('Not now')}</button></div>`,{label:'Login required'});return true}
A.loginNext=()=>{S.next=location.hash.slice(1);save();closeSheet()};
/* location */
A.loc=()=>sheet(`<div class="row between"><h3>${t('Choose your location')}</h3><button class="iconbtn" data-act="closeSheet" aria-label="${t('Close')}">${ic('x')}</button></div><p class="small muted">${t('Browsing never needs your location. Pick your area or use GPS.')}</p><div class="stack" style="margin-top:12px"><button class="btn o block" data-act="gps">${ic('pin',18)} ${t('Use my current location')}</button><div class="divider"></div><div class="lbl small">${t('Padrauna areas')}</div><div class="grid g2">${AREAS.map(a=>`<button class="chip ${S.loc.id===a.id?'on':''}" data-act="setArea" data-id="${a.id}">${esc(nm(a))}</button>`).join('')}</div><form data-form="pin" class="row"><input class="input" name="pin" inputmode="numeric" maxlength="6" placeholder="${t('Enter PIN code (e.g. 274304)')}" aria-label="PIN code"><button class="btn p">${t('Go')}</button></form><div class="lbl small">${t('Other cities')}</div><div class="grid g2">${D().cities.filter(c=>c.id!=='padrauna').map(c=>`<button class="chip" data-act="otherCity" data-id="${c.id}">${esc(nm(c))}</button>`).join('')}</div></div>`,{label:'Location'});
A.setArea=el=>{const a=areaOf(el.dataset.id);S.loc={id:a.id,name:nm(a),lat:a.lat,lng:a.lng,city:'padrauna',gps:false};S.locAsked=true;save();closeSheet();render(true);toast(t('Location set')+': '+nm(a),'pin')};
F.pin=d=>{const p=(d.pin||'').trim();if(!/^\d{6}$/.test(p)){toast(t('Enter a 6-digit PIN code'),'alert');return}if(p.startsWith('2743')||p==='274304'){A.setArea({dataset:{id:'chauraha'}})}else{closeSheet();sheet(outsideCity('PIN '+p))}};
const outsideCity=(name)=>`<div class="state"><div class="ill">🗺️</div><h3>${t('We are not in your city yet')}</h3><p>${t('ApnaTown is live in Padrauna. Tell us where you are and we will notify you when we launch there.')}</p><form data-form="notifyCity" class="stack block" style="width:100%"><input type="hidden" name="city" value="${esc(name)}"><input class="input" name="phone" inputmode="tel" placeholder="${t('Mobile number')}" aria-label="${t('Mobile number')}" required><button class="btn p block">${t('Notify me')}</button></form><button class="btn t" data-act="closeSheet">${t('Browse Padrauna instead')}</button></div>`;
A.otherCity=el=>{const c=D().cities.find(x=>x.id===el.dataset.id);closeSheet();sheet(outsideCity(nm(c)))};
F.notifyCity=d=>{S.notifyCity[d.city]=(S.notifyCity[d.city]||0)+1;save();closeSheet();toast(t('We will notify you when we launch'),'bell')};
A.gps=el=>{closeSheet();if(!navigator.geolocation){toast(t('GPS is not available. Pick your area.'),'alert');A.loc();return}toast(t('Finding your location…'),'pin');navigator.geolocation.getCurrentPosition(p=>{const d=km({lat:p.coords.latitude,lng:p.coords.longitude},CENTER);if(d>25){sheet(outsideCity('GPS'));return}S.loc={id:'gps',name:t('Current location'),lat:p.coords.latitude,lng:p.coords.longitude,city:'padrauna',gps:true};S.locAsked=true;save();render(true)},err=>{sheet(`<div class="state"><div class="ill">📍</div><h3>${t('Location is off')}</h3><p>${t('No problem. You can still browse by choosing your area manually.')}</p><button class="btn p" data-act="loc">${t('Choose area')}</button></div>`)},{timeout:8000})};
