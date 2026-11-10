/* Haru Korean voice parser v2: offline, deterministic, no network. */
(function(root){'use strict';
const weekdays={일:0,월:1,화:2,수:3,목:4,금:5,토:6};
const words={열두:12,열한:11,아홉:9,여덟:8,일곱:7,여섯:6,다섯:5,넷:4,네:4,셋:3,세:3,둘:2,두:2,하나:1,한:1,열:10};
const pad=n=>String(n).padStart(2,'0');
const key=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const at=(base,days)=>{const d=new Date(base.getFullYear(),base.getMonth(),base.getDate());d.setDate(d.getDate()+days);return d};
function parse(input, options={}){
 const original=String(input||'').replace(/\s+/g,' ').trim();let text=original;
 const now=options.now?new Date(options.now):new Date();const base=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 let date=key(base),time='',place='',dateFound=false,timeFound=false,ambiguous=[];
 function consume(re,cb){const m=text.match(re);if(!m)return false;const value=cb(m);if(value===false)return false;text=(text.slice(0,m.index)+' '+text.slice(m.index+m[0].length)).replace(/\s+/g,' ').trim();return true}
 const num=s=>/^\d+$/.test(s)?Number(s):words[s];
 if(!consume(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일?/,m=>{let y=m[1]?+m[1]:base.getFullYear(),mo=+m[2],day=+m[3];if(mo<1||mo>12||day<1||day>new Date(y,mo,0).getDate())return false;let d=new Date(y,mo-1,day);if(!m[1]&&d<base)d=new Date(y+1,mo-1,day);date=key(d);dateFound=true;return true})){
  if(!consume(/그저께|어제|오늘|내일\s*모레|글피|모레|내일/,m=>{const n={'그저께':-2,'어제':-1,'오늘':0,'내일모레':2,'글피':3,'모레':2,'내일':1}[m[0].replace(/\s/g,'')];date=key(at(base,n));dateFound=true;return true})){
   consume(/(?:(이번\s*주|다음\s*주|다다음\s*주)\s*)?([월화수목금토일])요일/,m=>{const prefix=(m[1]||'').replace(/\s/g,''),target=weekdays[m[2]];let delta;if(prefix){delta=-((base.getDay()+6)%7)+((target+6)%7)+(prefix==='다다음주'?14:prefix==='다음주'?7:0)}else{delta=(target-base.getDay()+7)%7;if(delta===0)delta=7}date=key(at(base,delta));dateFound=true;return true});
  }
 }
 // Time: 10시, 열 시, 오후 세 시 반, 3시 20분, 15:30
 if(!consume(/(?:오전|오후|아침|점심|저녁|밤|새벽)?\s*(?:[01]?\d|2[0-3]):[0-5]\d/,m=>{const x=m[0].match(/(오전|오후|아침|점심|저녁|밤|새벽)?\s*(\d{1,2}):(\d{2})/);if(!x)return false;let h=+x[2],min=+x[3];if(['오후','점심','저녁','밤'].includes(x[1])&&h<12)h+=12;if(['오전','아침','새벽'].includes(x[1])&&h===12)h=0;if(h>23)return false;time=`${pad(h)}:${pad(min)}`;timeFound=true;return true})){
  consume(/(오전|오후|아침|점심|저녁|밤|새벽)?\s*(\d{1,2}|열두|열한|아홉|여덟|일곱|여섯|다섯|넷|네|셋|세|둘|두|하나|한|열)\s*시(?:\s*(\d{1,2})\s*분|\s*반)?/,m=>{let h=num(m[2]),min=/반\s*$/.test(m[0])?30:+(m[3]||0);if(['오후','점심','저녁','밤'].includes(m[1])&&h<12)h+=12;if(['오전','아침','새벽'].includes(m[1])&&h===12)h=0;if(h>23||min>59)return false;time=`${pad(h)}:${pad(min)}`;timeFound=true;return true});
 }
 if(!timeFound&&/(점심|저녁|아침|오후|오전|밤)\s*(?:에|쯤|경)?/.test(text))ambiguous.push('시간을 확인해 주세요');
 // Separate spoken location clauses before cleaning the event title.
 // Example: "병원은 충대병원이야", "장소는 시청 회의실이야".
 consume(/(?:^|[.?!]\s*|\s+)(?:장소|병원|식당|위치|모임\s*장소)(?:은|는)\s+([가-힣A-Za-z0-9 ]{2,30}?)(?:이야|야|입니다|이에요|예요|라고\s*해|이래)?[.!?\s]*$/,m=>{place=m[1].trim();return !!place});
 // A common conversational phrasing: "병원은 충대병원이야" after an earlier event clause.
 if(!place)consume(/(?:^|\s)(?:병원|장소|식당|위치)(?:은|는)\s*([가-힣A-Za-z0-9 ]{2,25}?)(?:이야|야|이에요|예요|입니다)[.!?\s]*$/,m=>{place=m[1].trim();return !!place});
 // Don't infer locations without explicit marker; avoid swallowing long sentence.
 consume(/(?:^|\s)([가-힣A-Za-z0-9 ]{2,24}?)\s*에서(?=\s|$)/,m=>{place=m[1].trim();return !!place});
 text=text.replace(/^(?:에|에는|에선|까지|부터)\s*/, '');
 text=text.replace(/(?:일정|할\s*일)(?:으로)?\s*(?:추가|등록)(?:해\s*줘|해주세요|해줘)?/g,' ')
 .replace(/(?:추가|등록|기록)(?:해\s*줘|해주세요|해줘)?\s*$/g,' ')
 .replace(/\s*(?:있어|있어요|있습니다|있다|있는데|잡혀\s*있어|예약했어|예약했어요|예약해\s*뒀어|해야\s*해|해야\s*돼|해야겠어|할\s*거야|할\s*거예요|예정이야|예정입니다|잡아\s*줘|기억해\s*줘|알려\s*줘|등록해\s*줘|추가해\s*줘)[.!?\s]*$/,' ')
 .replace(/^(?:에|에는|에서|은|는|을|를)\s+/,' ')
 .replace(/\s+(?:에|에는|부터|쯤|경)(?=\s|$)/g,' ')
 .replace(/[.!?]+/g,' ').replace(/\s+/g,' ').trim();
 // Only remove standalone, grammatically clear particles; never guess away content.
 // Korean subject particles attached to the event phrase: remove only when a spoken predicate was removed.
 if (/(?:있어|있어요|있습니다|있다|있는데|잡혀\s*있어|예약했어|예약했어요|해야\s*해|해야\s*돼|예정이야)[.!?\s]*$/.test(original)) {
   text=text.replace(/(수업|회의|약속|예약|운동|진료|모임|방문|점검|상담|검사|검진|면접|식사|점심|저녁|미팅|라운딩|골프|발표|교육|강의|행사|모임|수리|청소|납부|입금|쇼핑|장보기)(이|가)$/, '$1').trim();
 }
 // A dangling postposition is often left after removing a time phrase: '오 에 PT 수업이'.
 text=text.replace(/^(?:오|에|에는|에서|이|가)\s+(?=[가-힣A-Za-z])/, '').trim();
 if(!dateFound)ambiguous.push('날짜를 확인해 주세요');
 if(!timeFound)ambiguous.push('시간을 확인해 주세요');
 // Remove a subject particle from an event phrase only when it is a recognized predicate construction.
 if(/(?:있어|있어요|있습니다|있다|있는데)[.!?\s]*(?:병원|장소|식당|위치)(?:은|는)/.test(original))text=text.replace(/(수업|회의|약속|예약|운동|진료|모임|방문|점검|상담|검사|검진|면접|식사|미팅|라운딩|교육|강의|행사)(이|가)(?=\s|$)/,'$1');
 const title=text||original;
 return {title,date,time:time||'10:00',place,dateFound,timeFound,needsReview:ambiguous.length>0,reviewReasons:[...new Set(ambiguous)],original};
}
root.HaruVoiceEngine={parse};
})(typeof globalThis!=='undefined'?globalThis:this);
