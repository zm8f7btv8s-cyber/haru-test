const fs=require('fs'),assert=require('assert'),path=require('path');
const dir=__dirname,html=fs.readFileSync(path.join(dir,'index.html'),'utf8'),assistant=fs.readFileSync(path.join(dir,'assistant.js'),'utf8'),app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
const checks=[
 ['AI assistant input',html.includes('id="assistantInput"')],
 ['AI endpoint opt in',html.includes('id="aiConsent"')],
 ['AI local fallback',assistant.includes('localAnalyze(text)')],
 ['AI server request',assistant.includes('fetch(config.endpoint')],
 ['No client secret',!assistant.includes('OPENAI_API_KEY')],
 ['Existing calendar',html.includes('id="calendarGrid"')],
 ['Existing events',html.includes('id="eventForm"')],
 ['Existing tasks',html.includes('id="taskForm"')],
 ['Existing voice correction',html.includes('id="voiceChoiceText"')],
 ['Same storage key',app.includes("KEY='haru.fresh.test.v1'")],
 ['No robot image reference',!html.includes('hero-robot.png')],
 ['AI never auto-saves',!assistant.includes('localStorage.setItem(\'haru.fresh.test.v1\'')],
 ['Worker refuses missing rate limit',fs.readFileSync(path.join(dir,'server/worker.js'),'utf8').includes('!env.DAILY_LIMIT')],
 ];
checks.forEach(([n,ok])=>{console.log(`${ok?'PASS':'FAIL'} ${n}`);assert(ok,n)});console.log(`${checks.length}/${checks.length} checks passed`);
