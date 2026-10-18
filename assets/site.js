var hd=document.getElementById('hd');function sc(){hd.classList.toggle('s',scrollY>40)}sc();addEventListener('scroll',sc,{passive:true});
var nv=document.getElementById('nav'),bg=document.getElementById('bg'),mq=matchMedia('(max-width:1120px)');
bg.onclick=function(){var o=nv.classList.toggle('open');bg.setAttribute('aria-expanded',o)};
document.querySelectorAll('.dd>.dl').forEach(function(l){l.addEventListener('click',function(e){if(mq.matches){e.preventDefault();var d=l.parentNode,o=d.classList.contains('open');document.querySelectorAll('.dd.open').forEach(function(x){x.classList.remove('open')});if(!o)d.classList.add('open')}})});
nv.addEventListener('click',function(e){var l=e.target.closest('a');if(l&&!l.classList.contains('dl')){nv.classList.remove('open');bg.setAttribute('aria-expanded',false)}});
var h=document.getElementById('h1');if(h)h.innerHTML=h.textContent.split(' ').map(function(w,i){return '<span style="animation-delay:'+(.15+i*.12)+'s">'+w+'</span>'}).join(' ');
var hero=document.getElementById('hero');if(hero){for(var i=0;i<26;i++){var b=document.createElement('i');b.className='bub';var s=4+Math.random()*12;b.style.cssText='left:'+Math.random()*100+'%;width:'+s+'px;height:'+s+'px;animation-duration:'+(8+Math.random()*10)+'s;animation-delay:-'+Math.random()*14+'s';hero.appendChild(b)}
var st=document.getElementById('stage'),hv=hero.querySelector('video');if(hv){hv.muted=true;var pp=hv.play();if(pp&&pp.catch)pp.catch(function(){})}
if(st)hero.addEventListener('mousemove',function(e){st.style.transform='translate('+(e.clientX/innerWidth-.5)*24+'px,'+(e.clientY/innerHeight-.5)*24+'px)'})}
function count(el){var n=+el.dataset.n,s=el.dataset.s||'',t=0;var f=function(){t+=Math.max(1,n/60);if(t>=n){el.textContent=n+s;return}el.textContent=Math.floor(t)+s;requestAnimationFrame(f)};f()}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');var c=e.target.querySelector('[data-n]');if(c)count(c);io.unobserve(e.target)}})},{threshold:.1});
document.querySelectorAll('.rv').forEach(function(el,i){el.style.transitionDelay=(i%3)*.12+'s';io.observe(el)});
var cf=document.getElementById('cf');if(cf)cf.onsubmit=function(e){e.preventDefault();var m='Hello, my name is '+f1.value+(f2.value?' ('+f2.value+')':'')+'.'+(f3.value?' I am interested in: '+f3.value+'.':'')+' '+f4.value;window.open('https://wa.me/971586839100?text='+encodeURIComponent(m),'_blank')};
var lb=document.getElementById('lb');document.addEventListener('click',function(e){var g=e.target.closest('.gt img');if(g){lb.querySelector('img').src=g.src;lb.querySelector('img').alt=g.alt;lb.hidden=false}else if(e.target.closest('#lb'))lb.hidden=true});
addEventListener('keydown',function(e){if(e.key==='Escape')lb.hidden=true});
document.querySelectorAll('.flt button').forEach(function(b){b.onclick=function(){document.querySelectorAll('.flt button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');document.querySelectorAll('.gal figure').forEach(function(f){f.hidden=!(b.dataset.f==='all'||f.dataset.c===b.dataset.f)})}});
