const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function fixture(){
 const sheets=new Map();const rows=[];let writes=0;let locked=false;
 let columns=26;
 const sheet={getMaxColumns:()=>columns,insertColumnsAfter(after,count){assert.equal(after,columns);columns+=count;},getLastRow:()=>rows.length,setFrozenRows(){},appendRow(row){writes++;rows.push(Array.from(row));},getRange(row,col,count=1,width=1){assert.ok(col+width-1<=columns);return {getValues:()=>rows.slice(row-1,row-1+count).map(r=>Array.from({length:width},(_,i)=>r[col-1+i]??'')),setValues(values){values.forEach((values,i)=>values.forEach((value,j)=>rows[row-1+i][col-1+j]=value));},getValue:()=>rows[row-1][col-1],createTextFinder(value){return {matchEntireCell(){return this;},findNext(){const i=rows.findIndex((r,j)=>j>=row-1&&r[col-1]===value);return i<0?null:{getRow:()=>i+1};}};}};}};
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

test('question details and artwork revision save beside unchanged original columns',()=>{
 const f=fixture();f.p.details={home_preference:{selected:['recognition','colour'],custom:'More readable roof'},screen:{selected:[],custom:'Custom only'}};f.p.artworkRevision='sw-reasons-2026-09-24';f.ctx.saveResponse(f.p);
 assert.equal(f.rows[0].indexOf('response_json'),24);assert.equal(f.rows[0].indexOf('additional_details'),25);
 assert.match(f.rows[1][25],/Product recognition; Colours and contrast/);assert.match(f.rows[1][25],/Custom only/);
 assert.equal(JSON.parse(f.rows[1][26]).home_preference.custom,'More readable roof');assert.equal(f.rows[1][27],f.p.artworkRevision);
 f.ctx.saveResponse(f.p);assert.equal(f.rows.length,2);
 f.p.details.home_preference.custom='Changed';assert.throws(()=>f.ctx.saveResponse(f.p));assert.equal(f.rows.length,2);
});
test('old v3 header extends without altering existing responses or breaking old retries',()=>{
 const f=fixture();f.ctx.saveResponse(f.p);f.rows[0].splice(25);f.rows[1].splice(25);const original=f.rows[1].slice();
 f.ctx.saveResponse(f.p);assert.equal(f.rows[0].length,28);assert.deepEqual(f.rows[1],original);assert.equal(f.rows.length,2);
 f.p.id='01234567-89ab-4cde-8fab-0123456789ac';f.p.details={car_preference:{selected:['perspective'],custom:'Angle'}};f.ctx.saveResponse(f.p);assert.equal(f.rows.length,3);assert.match(f.rows[2][25],/Angle/);
});
test('unexpected existing metadata columns are never overwritten',()=>{
 const f=fixture();f.ctx.saveResponse(f.p);f.rows[0][25]='user column';const before=JSON.stringify(f.rows);assert.throws(()=>f.ctx.saveResponse(f.p));assert.equal(JSON.stringify(f.rows),before);
});
test('invalid, duplicate, unknown and oversized reasons are rejected before any write',()=>{
 const invalid=[{home_preference:{selected:['unknown'],custom:''}},{home_preference:{selected:['colour','colour'],custom:''}},{screen:{selected:['perspective'],custom:''}},{respondent_name:{selected:[],custom:''}},{home_preference:{selected:[],custom:'a'.repeat(1001)}},{home_preference:{selected:[],custom:'',extra:true}}];
 for(const details of invalid){const f=fixture();f.p.details=details;assert.throws(()=>f.ctx.saveResponse(f.p));assert.equal(f.rows.length,0);}
});
test('maximum normal details for every question are accepted and safely stored',()=>{
 const f=fixture(),r=f.ctx.SurveyRulesV3;f.p.details=Object.fromEntries(r.detailQuestions.map(k=>[k,{selected:Array.from(r.detailOptions[k]),custom:'x'.repeat(1000)}]));f.p.artworkRevision='sw-reasons-2026-09-24';assert.match(post(f),/"ok":true/);assert.equal(Object.keys(JSON.parse(f.rows[1][26])).length,11);
});
