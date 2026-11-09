(()=>{'use strict';
const VOICE_KEY='haru.fresh.voice.mode', KEY='haru.fresh.test.v1', $=id=>document.getElementById(id), dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, parse=s=>new Date(s+'T12:00:00'),today=dateKey(new Date());
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let detailDate=today, detailKind="events", detailCalYear=new Date().getFullYear(), detailCalMonth=new Date().getMonth();
let selected=today,month=new Date().getMonth(),year=new Date().getFullYear(),filter='all',editing=null;
let data={events:[],tasks:[]};try{let v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&Array.isArray(v.events)&&Array.isArray(v.tasks))data=v}catch{}
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const format=d=>`${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${['일','월','화','수','목','금','토'][d.getDay()]})`;
const lunar=d=>{try{return '음력 '+new Intl.DateTimeFormat('ko-KR-u-ca-chinese',{month:'numeric',day:'numeric'}).format(d)}catch{return '음력 표시 미지원'}};
function lunarParts(d){try{const parts=new Intl.DateTimeFormat('ko-KR-u-ca-chinese',{month:'numeric',day:'numeric'}).formatToParts(d),m=parts.find(x=>x.type==='month')?.value||'',day=parts.find(x=>x.type==='day')?.value||'';return day==='1'?`음 ${m}.${day}`:day}catch{return ''}}
function header(){const d=new Date();$('dateText').textContent=format(d);$('lunarText').textContent=lunar(d)}
function showPage(name){document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id===name));document.querySelectorAll('.nav button').forEach(e=>e.classList.toggle('selected',e.dataset.page===name));if(name==='calendar')renderCalendar();if(name==='all')renderAll();if(name.startsWith('today')){detailKind=name==='today-tasks'?'tasks':'events';detailDate=today;name='today-events';document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id===name));renderHome()};window.scrollTo(0,0)}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
const sortedEvents=a=>[...a].sort((x,y)=>x.date.localeCompare(y.date)||(x.time||'').localeCompare(y.time||'')||x.title.localeCompare(y.title));
function eventLine(e){return `<div class="item"><time>${esc(e.time)}</time><span class="item-title">${esc(e.title)}</span><button class="edit-mini" data-edit="event" data-id="${esc(e.id)}" aria-label="${esc(e.title)} 수정">✎</button></div>`}
function taskLine(t){return `<div class="item taskline"><input type="checkbox" data-task="${esc(t.id)}" ${t.done?'checked':''} aria-label="완료 표시"><span class="item-title ${t.done?'done':''}">${esc(t.title)}</span><button class="edit-mini" data-edit="task" data-id="${esc(t.id)}" aria-label="${esc(t.title)} 수정">✎</button></div>`}
function more(container,n,type){$(container).innerHTML=n>0?`<button class="more-link" data-page="today-${type}">+ ${n}개 더 보기 ›</button>`:''}
function renderHome(){const events=sortedEvents(data.events.filter(e=>e.date===today)),tasks=data.tasks.filter(t=>t.date===today);
$('todayEvents').innerHTML=events.length?events.map(eventLine).join(''):'<p class="empty">오늘 등록된 일정이 없어.</p>';
$('todayTasks').innerHTML=tasks.length?tasks.map(taskLine).join(''):'<p class="empty">오늘 할 일이 없어.</p>';
$('homeEventsCount').textContent=`총 ${events.length}개`;
$('homeTasksCount').textContent=`총 ${tasks.length}개`;
const detailEvents=sortedEvents(data.events.filter(e=>e.date===detailDate));
const detailTasks=data.tasks.filter(t=>t.date===detailDate);
$('todayEventsFull').innerHTML=detailEvents.length?detailEvents.map(eventLine).join(''):'<p class="empty">선택한 날짜에 등록된 일정이 없어.</p>';
$('todayTasksFull').innerHTML=detailTasks.length?detailTasks.map(taskLine).join(''):'<p class="empty">선택한 날짜에 할 일이 없어.</p>';
const dd=parse(detailDate);
$('detailDateText').textContent=format(dd);
$('detailLunarText').textContent=lunar(dd);
$('detailShortDate').textContent=detailKind==='events'?'시간순':'등록순';
$('detailListHeading').textContent=detailKind==='events'?`일정 ${detailEvents.length}건`:`할 일 ${detailTasks.length}건`;
$('todayEventsFull').hidden=detailKind!=='events';$('todayTasksFull').hidden=detailKind!=='tasks';
$('detailAddEvent').hidden=detailKind!=='events';$('detailAddTask').hidden=detailKind!=='tasks';
document.querySelectorAll('.detail-tab').forEach(b=>{const active=b.dataset.detailKind===detailKind;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
const upcoming=sortedEvents(data.events.filter(e=>e.date>today));
$('homeUpcomingCount').textContent=`총 ${upcoming.length}개`;
$('upcomingEvents').innerHTML=upcoming.length?upcoming.map(e=>`<div class="upcoming-row"><strong>${esc(e.date.slice(5).replace('-','/'))}</strong><time>${esc(e.time||'')}</time><span>${esc(e.title)}</span><button data-edit="event" data-id="${esc(e.id)}" aria-label="수정">✎</button></div>`).join(''):'<p class="empty">예정된 일정이 없어.</p>';
}
function dayItems(day){return [...sortedEvents(data.events.filter(e=>e.date===day)).map(x=>({...x,kind:'event'})),...data.tasks.filter(t=>t.date===day).map(x=>({...x,kind:'task'}))]}
function renderCalendar(){
 $('monthLabel').textContent=`${year}년 ${month+1}월`;
 const first=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate();let html='';
 for(let i=0;i<first;i++)html+='<span class="day blank" aria-hidden="true"></span>';
 for(let i=1;i<=days;i++){
  const d=dateKey(new Date(year,month,i)),items=dayItems(d),n=items.length,wd=(first+i-1)%7,ld=lunarParts(new Date(year,month,i));
  const rows=items.slice(0,2).map(x=>`<span class="eventname ${x.kind==='task'?'task-event':'schedule-event'}" title="${esc(x.title)}"><span class="kind-dot" aria-hidden="true"></span><span class="event-label">${esc(x.title)}</span></span>`).join('');
  html+=`<button type="button" class="day ${d===selected?'selected ':''}${n?'has ':''}${wd===0?'sun':wd===6?'sat':''}" data-date="${d}" aria-label="${i}일 ${n}개 항목 확인"><span class="daynum">${i}</span><span class="lunarday">${esc(ld)}</span><span class="day-event-slots">${rows}${n>2?`<span class="moreday">+${n-2}개</span>`:''}</span></button>`;
 }
 $('calendarGrid').innerHTML=html;
}
function openDayDialog(day){selected=day;renderCalendar();const d=parse(day),items=dayItems(day);
 $('dayDialogTitle').textContent=format(d);$('dayDialogLunar').textContent=lunar(d)+' · '+items.length+'개 항목';
 $('dayDialogItems').innerHTML=items.length?items.map((x,i)=>`${i===0||items[i-1].kind!==x.kind?`<div class="group-type ${x.kind==='task'?'task-type':'event-type'}">${x.kind==='task'?'할 일':'일정'}</div>`:''}<button class="day-dialog-item" data-edit="${x.kind}" data-id="${esc(x.id)}"><span class="day-dialog-time">${x.kind==='task'?'할 일':esc(x.time||'시간 미정')}</span><span class="day-dialog-name">${esc(x.title)}</span><span class="day-dialog-edit">수정 ›</span></button>`).join(''):'<p class="empty">이 날짜에 등록된 일정이 없어.</p>';
 $('dayDialog').showModal();
}
function renderAll(){
 document.querySelectorAll('.filter-btn').forEach(b=>b.classList.toggle('selected',b.dataset.filter===filter));
 const dates=[...new Set([...(filter!=='task'?data.events:[]),...(filter!=='event'?data.tasks:[])].map(x=>x.date))].sort();
 const eventRows=items=>sortedEvents(items).map(x=>`<div class="all-entry"><span class="all-entry-time">${esc(x.time||'미정')}</span><span class="all-entry-title">${esc(x.title)}</span><button class="all-entry-edit" data-edit="event" data-id="${esc(x.id)}" aria-label="${esc(x.title)} 수정">✎</button></div>`).join('');
 const taskRows=items=>items.slice().sort((a,b)=>Number(a.done)-Number(b.done)||a.title.localeCompare(b.title)).map(x=>`<div class="all-entry is-task"><input class="all-entry-check" type="checkbox" data-task="${esc(x.id)}" ${x.done?'checked':''} aria-label="${esc(x.title)} 완료 표시"><span class="all-entry-title ${x.done?'done':''}">${esc(x.title)}</span><button class="all-entry-edit" data-edit="task" data-id="${esc(x.id)}" aria-label="${esc(x.title)} 수정">✎</button></div>`).join('');
 $('allItems').innerHTML=dates.length?dates.map(date=>{const ev=data.events.filter(x=>x.date===date),tasks=data.tasks.filter(x=>x.date===date),n=(filter==='task'?0:ev.length)+(filter==='event'?0:tasks.length);return `<section class="date-group"><div class="date-group-head"><span class="date-group-label">${esc(format(parse(date)))}</span><span class="date-group-count">${filter==='all'?`${ev.length?`일정 ${ev.length}`:''}${ev.length&&tasks.length?' · ':''}${tasks.length?`할 일 ${tasks.length}`:''}`:`${n}개`}</span></div><div class="date-group-items">${ev.length&&filter!=='task'?`${eventRows(ev)}`:''}${tasks.length&&filter!=='event'?`${taskRows(tasks)}`:''}</div></section>`}).join(''):'<p class="empty all-empty">등록된 항목이 없어. 아래 버튼으로 추가해 봐.</p>';
}
function refresh(){renderHome();renderCalendar();renderAll()}
function openDialog(type,id=null){editing=id?{type,id}:null;const dialog=$(type==='event'?'eventDialog':'taskDialog'),f=dialog.querySelector('form');f.reset();f.elements.date.value=id?today:(document.querySelector('#calendar.page.active')?selected:document.querySelector('#today-events.page.active')?detailDate:today);const old=id?data[type==='event'?'events':'tasks'].find(x=>x.id===id):null;
if(type==='event'){f.elements.time.value=old?.time||'10:00';f.elements.place.value=old?.place||'';['prev','morning','before'].forEach(n=>f.elements[n].checked=old?.reminders?.[n]??true);$('eventDialogTitle').textContent=id?'일정 수정':'일정 등록';$('deleteEvent').hidden=!id}else{$('taskDialogTitle').textContent=id?'할 일 수정':'할 일 등록';$('deleteTask').hidden=!id}if(old){f.elements.namedItem("title").value=old.title;f.elements.date.value=old.date}dialog.showModal()}
function remove(type,id){if(!confirm(type==='event'?'이 일정을 삭제할까?':'이 할 일을 삭제할까?'))return;const k=type==='event'?'events':'tasks';data[k]=data[k].filter(x=>x.id!==id);save();$('eventDialog').close();$('taskDialog').close();editing=null;refresh()}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.date){openDayDialog(b.dataset.date)}else if(b.dataset.edit){if($('dayDialog').open)$('dayDialog').close();openDialog(b.dataset.edit,b.dataset.id)}else if(b.dataset.delete){remove(b.dataset.delete,b.dataset.id)}else if(b.classList.contains('more-link'))showPage(b.dataset.page)});
document.addEventListener('change',e=>{if(!e.target.matches('[data-task]'))return;const t=data.tasks.find(x=>x.id===e.target.dataset.task);if(t){t.done=e.target.checked;save();refresh()}});
document.querySelectorAll('.detail-tab').forEach(b=>b.addEventListener('click',()=>{detailKind=b.dataset.detailKind;renderHome()}));
function detailSetDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return;detailDate=value;renderHome()}
function detailShift(n){const d=parse(detailDate);d.setDate(d.getDate()+n);detailSetDate(dateKey(d))}
$('detailPrev').onclick=()=>detailShift(-1);$('detailNext').onclick=()=>detailShift(1);
function renderDetailCalendar(){
 $('detailCalMonth').textContent=`${detailCalYear}년 ${detailCalMonth+1}월`;
 const first=new Date(detailCalYear,detailCalMonth,1).getDay(),days=new Date(detailCalYear,detailCalMonth+1,0).getDate();let html='';
 for(let i=0;i<first;i++)html+='<span></span>';
 for(let i=1;i<=days;i++){const key=dateKey(new Date(detailCalYear,detailCalMonth,i)),weekday=(first+i-1)%7;html+=`<button type="button" class="detail-cal-day ${key===detailDate?'picked':''} ${weekday===0?'sun':weekday===6?'sat':''}" data-detail-date="${key}" aria-label="${i}일 선택">${i}</button>`}
 $('detailCalGrid').innerHTML=html;
}
$('detailDateOpen').onclick=()=>{const d=parse(detailDate);detailCalYear=d.getFullYear();detailCalMonth=d.getMonth();renderDetailCalendar();$('detailCalendarDialog').showModal()};
function detailChangeMonth(n){const d=new Date(detailCalYear,detailCalMonth+n,1);detailCalYear=d.getFullYear();detailCalMonth=d.getMonth();renderDetailCalendar()}
$('detailCalPrev').onclick=()=>detailChangeMonth(-1);$('detailCalNext').onclick=()=>detailChangeMonth(1);
$('detailCalGrid').addEventListener('click',e=>{const b=e.target.closest('[data-detail-date]');if(!b)return;detailSetDate(b.dataset.detailDate);$('detailCalendarDialog').close()});
document.querySelectorAll('.add-event').forEach(b=>b.addEventListener('click',()=>openDialog('event')));document.querySelectorAll('.add-task').forEach(b=>b.addEventListener('click',()=>openDialog('task')));
$('dayAddEvent').onclick=()=>{const d=selected;$('dayDialog').close();openDialog('event');$('eventForm').elements.date.value=d};$('dayAddTask').onclick=()=>{const d=selected;$('dayDialog').close();openDialog('task');$('taskForm').elements.date.value=d};document.querySelectorAll('.close').forEach(b=>b.addEventListener('click',()=>{if(b.closest('dialog')?.id==='voiceProgressDialog')return;b.closest('dialog').close()}));document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
$('eventForm').addEventListener('submit',e=>{e.preventDefault();const f=e.target,values={title:f.elements.namedItem("title").value.trim(),date:f.elements.date.value,time:f.elements.time.value,place:f.elements.place.value.trim(),reminders:{prev:f.elements.prev.checked,morning:f.elements.morning.checked,before:f.elements.before.checked}};if(!values.title)return;if(editing?.type==='event'){const item=data.events.find(x=>x.id===editing.id);if(item)Object.assign(item,values)}else data.events.push({id:crypto.randomUUID?.()||String(Date.now()),...values});save();if(voiceSavePending)rememberVoice('event',values);$('eventDialog').close();editing=null;refresh();voiceDone()});
$('taskForm').addEventListener('submit',e=>{e.preventDefault();const f=e.target,values={title:f.elements.namedItem("title").value.trim(),date:f.elements.date.value};if(!values.title)return;if(editing?.type==='task'){const item=data.tasks.find(x=>x.id===editing.id);if(item)Object.assign(item,values)}else data.tasks.push({id:crypto.randomUUID?.()||String(Date.now()),done:false,...values});save();if(voiceSavePending)rememberVoice('task',values);$('taskDialog').close();editing=null;refresh();voiceDone()});
$('deleteEvent').onclick=()=>{if(editing)remove('event',editing.id)};$('deleteTask').onclick=()=>{if(editing)remove('task',editing.id)};
$('prevMonth').onclick=()=>{month--;if(month<0){month=11;year--}renderCalendar()};$('nextMonth').onclick=()=>{month++;if(month>11){month=0;year++}renderCalendar()};document.querySelectorAll('.filter-btn').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;renderAll()});
 const voiceMode=$('voiceMode');voiceMode.value=localStorage.getItem(VOICE_KEY)||'sound';voiceMode.onchange=()=>localStorage.setItem(VOICE_KEY,voiceMode.value);
 const LEARN_KEY='haru.voice.learn.v1';let learned={places:{},titles:{}};try{const v=JSON.parse(localStorage.getItem(LEARN_KEY)||'null');if(v&&typeof v==='object')learned={places:v.places||{},titles:v.titles||{}}}catch{}
 function rememberVoice(type,values){if(!voiceDraft)return;const original=voiceDraft;if(type==='event'&&values.place){const key=values.place.replace(/\s+/g,'').toLowerCase();learned.places[key]=values.place;if(original.place&&original.place!==values.place)learned.places[original.place.replace(/\s+/g,'').toLowerCase()]=values.place}if(original.title!==values.title&&original.title)learned.titles[original.title]=values.title;try{localStorage.setItem(LEARN_KEY,JSON.stringify(learned))}catch{}voiceDraft=null}
 function playVoiceTone(kind){if(voiceMode.value==='silent')return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C();if(c.state==='suspended')c.resume().catch(()=>{});const notes=kind==='end'?[880,660]:kind==='start'?[720,940]:[440];notes.forEach((hz,i)=>{const t=c.currentTime+.03+i*.15,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.18,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.13);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.14)});setTimeout(()=>c.close().catch(()=>{}),900)}catch{}}
 function parseVoice(s){let text=s.trim(),date=today,time='10:00',place='';const now=new Date();let dateFound=false,timeFound=false;
 const relative=text.match(/(모레|내일|오늘)/);if(relative){const d=new Date(now);d.setDate(d.getDate()+(relative[1]==='모레'?2:relative[1]==='내일'?1:0));date=dateKey(d);dateFound=true}
 const dm=text.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일?/);if(dm){let y=dm[1]?Number(dm[1]):now.getFullYear(),m=Number(dm[2]),d=Number(dm[3]);if(!dm[1]&&new Date(y,m-1,d)<new Date(now.getFullYear(),now.getMonth(),now.getDate()))y++;if(m>=1&&m<=12&&d>=1&&d<=new Date(y,m,0).getDate()){date=dateKey(new Date(y,m-1,d));dateFound=true}}
 const weekday=text.match(/(이번\s*주|다음\s*주)?\s*(월|화|수|목|금|토|일)요일/);if(!dm&&!relative&&weekday){const wd={'일':0,'월':1,'화':2,'수':3,'목':4,'금':5,'토':6}[weekday[2]],d=new Date(now);let shift=(wd-now.getDay()+7)%7;if(weekday[1]?.replace(/\s/g,'')==='다음주')shift+=shift===0?7:7;else if(shift===0)shift=7;d.setDate(d.getDate()+shift);date=dateKey(d);dateFound=true}
 const nums={'열두':12,'열한':11,'열':10,'아홉':9,'여덟':8,'일곱':7,'여섯':6,'다섯':5,'네':4,'넷':4,'세':3,'셋':3,'두':2,'둘':2,'한':1,'하나':1};
 const tm=text.match(/(오전|오후|아침|저녁|밤)?\s*(\d{1,2}|열두|열한|열|아홉|여덟|일곱|여섯|다섯|네|넷|세|셋|두|둘|한|하나)\s*시(?:\s*(\d{1,2})\s*분|\s*반)?/);
 if(tm){let h=/^\d+$/.test(tm[2])?Number(tm[2]):nums[tm[2]],min=tm[0].includes('반')?30:Number(tm[3]||0);if(['오후','저녁','밤'].includes(tm[1])&&h<12)h+=12;if(['오전','아침'].includes(tm[1])&&h===12)h=0;if(h<24&&min<60){time=`${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;timeFound=true}}
 text=text.replace(/(?:(\d{4})년\s*)?\d{1,2}월\s*\d{1,2}일?/g,'').replace(/(이번\s*주|다음\s*주)?\s*[월화수목금토일]요일/g,'').replace(/(오전|오후|아침|저녁|밤)?\s*(?:\d{1,2}|열두|열한|열|아홉|여덟|일곱|여섯|다섯|네|넷|세|셋|두|둘|한|하나)\s*시(?:\s*\d{1,2}\s*분|\s*반)?/g,'').replace(/오늘|내일|모레/g,'');
 const loc=text.match(/(?:^|\s)([^,]+?)\s*에서(?=\s|$)/);if(loc){place=loc[1].trim();text=text.replace(loc[0],' ')}
 text=text.replace(/(?:일정|할\s*일)(?:으로)?\s*(?:추가|등록)(?:해\s*줘|해주세요|해줘)?/g,'').replace(/(?:추가|등록)(?:해\s*줘|해주세요|해줘)?$/g,'').replace(/\s*(?:있어|있어요|할\s*거야|할\s*거예요|예정이야|예정입니다)\s*$/,'').replace(/^(에|은|는|을|를)\s*/,'').replace(/\s+/g,' ').trim();
 if(place){const key=place.replace(/\s+/g,'').toLowerCase();place=learned.places[key]||place}
 const title=learned.titles[text]||text||s.trim();return {title,date,time,place,dateFound,timeFound}}
 function classifyVoice(s){const task=/(할\s*일|해야\s*할|체크리스트|투두|todo|장보기|구매할|사야\s*할|챙기기)/i.test(s),event=/(일정|예약|약속|회의|수업|미팅|방문|진료|운동\s*수업|라운딩|골프)/i.test(s);return task&&!event?'task':event&&!task?'event':null}
 let voiceBusy=false,voiceDraft=null,pendingVoice=null,voiceSavePending=false,recognition=null,voiceCancelled=false,voiceText='',voiceHadResult=false,voiceCompleted=false;
 const voiceProgress=$('voiceProgressDialog');function voiceStep(stage,message,spoken=''){voiceProgress.classList.toggle('is-listening',stage==='listen');$('voiceProgressText').textContent=message;$('voiceTranscript').textContent=spoken||'말씀하신 내용이 여기에 표시돼요.'}
 function voiceDone(){if(!voiceSavePending)return;voiceSavePending=false;voiceDraft=null;playVoiceTone('end')}
 function resetVoice(){voiceBusy=false;recognition=null;$('voice').classList.remove('listening')}
 function cancelVoice(){voiceCancelled=true;voiceCompleted=true;voiceSavePending=false;voiceDraft=null;pendingVoice=null;try{recognition?.abort()}catch{}resetVoice();if(voiceProgress.open)voiceProgress.close()}
 $('voiceCancel').onclick=cancelVoice;$('voiceProgressClose').onclick=cancelVoice;
 voiceProgress.addEventListener('cancel',e=>{e.preventDefault();cancelVoice()});
 function fillVoice(type,parsed){voiceSavePending=true;voiceDraft={...parsed};if(voiceProgress.open)voiceProgress.close();openDialog(type);const f=$(type==='event'?'eventForm':'taskForm').elements;f.namedItem('title').value=parsed.title;f.date.value=parsed.date;if(type==='event'){f.time.value=parsed.time;f.place.value=parsed.place||''}}
 $('voiceChooseEvent').onclick=()=>{if(!pendingVoice)return;$('voiceChoiceDialog').close();fillVoice('event',pendingVoice);pendingVoice=null};
 $('voiceChooseTask').onclick=()=>{if(!pendingVoice)return;$('voiceChoiceDialog').close();fillVoice('task',pendingVoice);pendingVoice=null};
 function finishVoice(){if(!voiceBusy||voiceCompleted)return;voiceCompleted=true;$('voiceFinish').disabled=true;voiceStep('parse','인식 결과를 확인하고 있어요…',voiceText);try{recognition?.stop()}catch{processVoice()}}
 $('voiceFinish').onclick=finishVoice;
 function processVoice(){if(voiceCancelled)return;const spoken=voiceText.trim();resetVoice();if(voiceProgress.open)voiceProgress.close();if(!spoken||spoken.length<3){alert('음성이 충분히 인식되지 않았어. 다시 말씀해 줘.');return}playVoiceTone('end');const parsed=parseVoice(spoken),kind=classifyVoice(spoken);if(kind)fillVoice(kind,parsed);else{pendingVoice=parsed;$('voiceChoiceText').textContent=spoken;$('voiceChoiceDialog').showModal()}}
 $('voice').onclick=()=>{if(voiceBusy)return;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){alert('이 브라우저에서는 음성 인식을 지원하지 않아.');return}voiceBusy=true;voiceCancelled=false;voiceCompleted=false;voiceHadResult=false;voiceText='';$('voiceFinish').disabled=true;voiceStep('prepare','마이크 준비 중…','준비가 되면 시작음이 울려요.');voiceProgress.showModal();const r=new SR();recognition=r;r.lang='ko-KR';r.interimResults=true;r.continuous=true;r.maxAlternatives=1;
 r.onstart=()=>{if(voiceCancelled)return;voiceStep('listen','지금 말씀하세요',voiceText);$('voiceFinish').disabled=false;$('voice').classList.add('listening');playVoiceTone('start')};
 r.onresult=e=>{if(voiceCancelled)return;let text='',hasFinal=false;for(let i=0;i<e.results.length;i++){text+=e.results[i][0].transcript+' ';if(e.results[i].isFinal)hasFinal=true}voiceText=text.trim();voiceHadResult=voiceHadResult||hasFinal;voiceStep('listen','듣고 있어요',voiceText)};
 r.onerror=e=>{if(voiceCancelled)return;if(e.error==='no-speech'){voiceText='';return}voiceCancelled=true;resetVoice();if(voiceProgress.open)voiceProgress.close();alert('음성 인식에 실패했어 ('+e.error+'). 다시 시도해 줘.')};
 r.onend=()=>{if(voiceCancelled)return;if(!voiceCompleted)voiceCompleted=true;processVoice()};
 try{r.start()}catch{cancelVoice();alert('마이크를 시작할 수 없어. 다시 시도해 줘.')}};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='haru-test-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};$('importButton').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error('파일 크기가 너무 커.');const imported=JSON.parse(await file.text());if(!imported||!Array.isArray(imported.events)||!Array.isArray(imported.tasks))throw Error('하루 백업 파일 형식이 아니야.');const valid=a=>a.every(x=>x&&typeof x==='object'&&typeof x.title==='string'&&typeof x.date==='string'&&/^\\d{4}-\\d{2}-\\d{2}$/.test(x.date)&&typeof x.id==='string');if(!valid(imported.events)||!valid(imported.tasks))throw Error('백업 데이터에 오류가 있어.');if(!confirm(`백업에서 일정 ${imported.events.length}개, 할 일 ${imported.tasks.length}개를 복원할까?\\n현재 저장된 데이터는 교체되지만 복원 전 자동 백업 파일을 내려받아.`))return;const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='haru-before-restore-'+dateKey(new Date())+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);data={events:imported.events,tasks:imported.tasks};save();refresh();alert('복원 완료! 일정과 할 일을 확인해 줘.')}catch(err){alert('복원하지 못했어: '+err.message)}finally{e.target.value=''}};
header();refresh();showPage('home')})();