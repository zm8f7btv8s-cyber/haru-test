/* Scroll position indicators, visual only. Does not change stored data or scrolling behavior. */
(()=>{'use strict';
const ids=['todayEvents','todayTasks','upcomingEvents','allScroll'];
const getNodes=()=>[...ids.map(id=>document.getElementById(id)),document.querySelector('#today-events .detail-list-scroll')].filter(Boolean);
function update(el){const host=el.closest('.haru-scroll-host');if(!host)return;const rail=host.querySelector('.haru-scroll-rail');const thumb=host.querySelector('.haru-scroll-thumb');if(!rail||!thumb)return;
const total=el.scrollHeight,visible=el.clientHeight,max=Math.max(0,total-visible);
rail.style.opacity=max>2?'1':'.28';const track=Math.max(1,rail.clientHeight);const size=max>2?Math.max(24,Math.min(track,track*visible/Math.max(total,1))):track;
thumb.style.height=size+'px';thumb.style.top=(max>2?(el.scrollTop/max)*Math.max(0,track-size):0)+'px';}
const nodes=getNodes();nodes.forEach(el=>el.addEventListener('scroll',()=>update(el),{passive:true}));
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;nodes.forEach(update);});}
if('ResizeObserver'in window){const ro=new ResizeObserver(schedule);nodes.forEach(el=>{ro.observe(el);if(el.parentElement)ro.observe(el.parentElement);});}
if('MutationObserver'in window){const mo=new MutationObserver(schedule);nodes.forEach(el=>mo.observe(el,{childList:true,subtree:true,attributes:false}));}
window.addEventListener('resize',schedule,{passive:true});document.addEventListener('click',schedule);schedule();
})();
