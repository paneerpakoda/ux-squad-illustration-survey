const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function fixture(){
 const sheets=new Map();const rows=[];let writes=0;let locked=false;
 const sheet={getLastRow:()=>rows.length,setFrozenRows(){},appendRow(row){writes++;rows.push(Array.from(row));},getRange(row,col,count=1,width=1){return {getValues:()=>rows.slice(row-1,row-1+count).map(r=>r.slice(col-1,col-1+width)),getValue:()=>rows[row-1][col-1],createTextFinder(value){return {matchEntireCell(){return this;},findNext(){const i=rows.findIndex((r,j)=>j>=row-1&&r[col-1]===value);return i<0?null:{getRow:()=>i+1};}};}};}};
 const ctx=vm.createContext({Date,SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush(){}},PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'test-sheet'})},LockService:{getScriptLock:()=>({tryLock:()=>{locked=true;return true;},releaseLock:()=>{locked=false;}})},HtmlService:{XFrameOptionsMode:{ALLOWALL:'allowall'},createHtmlOutput:html=>({html,setXFrameOptionsMode(){return this;}})}});
 vm.runInContext(fs.readFileSync(path.join(root,'backend/Code.gs'),'utf8'),ctx);
 const R=ctx.SurveyRulesV3;
 const answers=Object.fromEntries(Object.entries(R.fields).map(([k,v])=>[k,typeof v==='number'?'':v[0]]));answers.respondent_name='QA test';answers.recommendation='depends';
 const p={version:R.version,id:'01234567-89ab-4cde-8fab-0123456789ab',styleOrder:['without_plinth','flat_2d','with_plinth'],productOrder:Array.from(R.products),assignments:Object.fromEntries(R.products.map(p=>[p,Array.from(R.styles)])),answers};
 return {ctx,p,rows,getWrites:()=>writes,isLocked:()=>locked};
}
function post(f,origin='https://paneerpakoda.github.io'){return f.ctx.doPost({parameter:{origin,nonce:'01234567-89ab-4cde-8fab-0123456789ab',payload:JSON.stringify(f.p)}}).html;}

test('valid response stores one row plus header with canonical style mapping',()=>{const f=fixture();f.ctx.saveResponse(f.p);assert.equal(f.rows.length,2);assert.deepEqual(f.rows[1].slice(3,6),f.p.styleOrder);assert.equal(f.isLocked(),false);});
test('retry of the same response never adds a second row',()=>{const f=fixture();f.ctx.saveResponse(f.p);f.ctx.saveResponse(f.p);assert.equal(f.rows.length,2);});
test('changing an already saved response fails rather than overwriting it',()=>{const f=fixture();f.ctx.saveResponse(f.p);f.p.answers.recommendation='none';assert.throws(()=>f.ctx.saveResponse(f.p));assert.equal(f.rows.length,2);assert.equal(f.isLocked(),false);});
test('formula-like comments are stored as literal text',()=>{const f=fixture();f.p.answers.reason=' =IMPORTXML("https://example.com")';f.ctx.saveResponse(f.p);const col=f.rows[0].indexOf('reason');assert.equal(f.rows[1][col][0],"'");});
test('malformed responses cannot write any rows',()=>{const f=fixture();delete f.p.answers.recommendation;assert.throws(()=>f.ctx.saveResponse(f.p));assert.equal(f.getWrites(),0);});
test('wrong page origin cannot write and cannot receive a success acknowledgment',()=>{const f=fixture();assert.match(post(f,'https://unrelated.example'),/"ok":false/);assert.equal(f.getWrites(),0);});
test('confirmation is emitted only after valid storage',()=>{const f=fixture();assert.match(post(f),/"ok":true/);assert.equal(f.rows.length,2);});
test('storage failure returns failure acknowledgment',()=>{const f=fixture();f.ctx.SpreadsheetApp.openById=()=>{throw Error('offline');};assert.match(post(f),/"ok":false/);assert.equal(f.getWrites(),0);assert.equal(f.isLocked(),false);});
test('a script tag in a comment cannot become executable confirmation HTML',()=>{const f=fixture();f.p.answers.reason='</script><script>alert(1)</script>';const html=post(f);assert.equal(html.includes('alert(1)'),false);assert.match(html,/"ok":true/);});

test('invalid product mappings rejected before writing',()=>{const f=fixture();f.p.assignments.car=['flat_2d','flat_2d','with_plinth'];assert.throws(()=>f.ctx.saveResponse(f.p));assert.equal(f.getWrites(),0)});
test('v3 never uses the original Responses tab',()=>{const f=fixture();let name;const book=f.ctx.SpreadsheetApp.openById();f.ctx.SpreadsheetApp.openById=()=>({getSheetByName:n=>{name=n;return book.getSheetByName(n);}});f.ctx.saveResponse(f.p);assert.equal(name,'Responses v3');assert.equal(f.rows[0].includes('product_assignments'),true)});

test('blank names are rejected',()=>{const f=fixture();f.p.answers.respondent_name='  ';assert.throws(()=>f.ctx.saveResponse(f.p));assert.equal(f.getWrites(),0)});
