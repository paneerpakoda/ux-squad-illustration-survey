/* Shared by the browser and backend/Code.gs. */
var SurveyRules = (function () {
  'use strict';
  const version='ux-illustrations-2026-09-v2';
  const styles=['with_plinth','without_plinth','flat_2d'];
  const products=['home','personal'];
  const choices=[...styles,'no_preference','none'];
  const fields={home_preference:choices,personal_preference:choices,overall:[...choices,'depends'],improvements:1500};
  function validAnswer(key,value){const rule=fields[key];return typeof value==='string'&&(typeof rule==='number'?value.length<=rule:Array.isArray(rule)&&rule.includes(value));}
  function permutation(list,expected){return Array.isArray(list)&&list.length===expected.length&&new Set(list).size===expected.length&&list.every(x=>expected.includes(x));}
  function validate(p){
    if(!p||typeof p!=='object'||Array.isArray(p)||p.version!==version)throw Error('Unsupported survey version.');
    if(Object.keys(p).some(k=>!['version','id','styleOrder','productOrder','answers'].includes(k)))throw Error('Unexpected response field.');
    if(typeof p.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.id))throw Error('Invalid response ID.');
    if(!permutation(p.styleOrder,styles)||!permutation(p.productOrder,products))throw Error('Invalid presentation order.');
    if(!p.answers||typeof p.answers!=='object'||Array.isArray(p.answers))throw Error('Missing answers.');
    if(Object.keys(p.answers).some(k=>!Object.prototype.hasOwnProperty.call(fields,k)))throw Error('Unexpected answer field.');
    for(const k of Object.keys(fields))if(!validAnswer(k,p.answers[k]))throw Error('Missing or invalid answer: '+k);
    return p;
  }
  function shuffle(values,random){const result=values.slice();for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
  return {version,styles,products,choices,fields,validAnswer,validate,permutation,shuffle};
})();

var SurveyRulesV3 = (function(){
 'use strict';
 const version='ux-illustrations-2026-09-v3';
 const styles=['with_plinth','without_plinth','flat_2d'];
 const products=['home','personal','car','education','rupay','two_wheeler'];
 const choices=[...styles,'no_preference','none'];
 const fields={respondent_name:100,...Object.fromEntries(products.map(p=>[p+'_preference',choices]))};
 Object.assign(fields,{home_clarity:[...styles,'equal','none'],two_wheeler_clarity:[...styles,'equal','none'],screen:choices,consistency:[...styles,'equal','none'],recommendation:[...choices,'depends'],home_reason:1500,two_wheeler_reason:1500,reason:1500,changes:1500});
 function validAnswer(k,v){const r=fields[k];if(k==='respondent_name')return typeof v==='string'&&v.trim().length>0&&v.length<=100;return Object.prototype.hasOwnProperty.call(fields,k)&&typeof v==='string'&&(typeof r==='number'?v.length<=r:r.includes(v));}
 function permutation(a,b){return Array.isArray(a)&&a.length===b.length&&new Set(a).size===b.length&&a.every(v=>b.includes(v));}
 function validate(p){
  if(!p||typeof p!=='object'||Array.isArray(p)||p.version!==version)throw Error('Unsupported survey version.');
  if(Object.keys(p).some(k=>!['version','id','styleOrder','productOrder','assignments','answers'].includes(k)))throw Error('Unexpected response field.');
  if(typeof p.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.id))throw Error('Invalid response ID.');
  if(!permutation(p.productOrder,products)||!permutation(p.styleOrder,styles))throw Error('Invalid presentation order.');
  if(!p.assignments||!permutation(Object.keys(p.assignments),products)||products.some(id=>!permutation(p.assignments[id],styles)))throw Error('Invalid product assignments.');
  if(!p.answers||typeof p.answers!=='object'||Array.isArray(p.answers)||Object.keys(p.answers).some(k=>!Object.prototype.hasOwnProperty.call(fields,k)))throw Error('Unexpected answer field.');
  for(const k of Object.keys(fields))if(!validAnswer(k,p.answers[k]))throw Error('Missing or invalid answer: '+k);
  return p;
 }
 function shuffle(a,random){const r=a.slice();for(let i=r.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;}
 return {version,styles,products,choices,fields,validAnswer,validate,permutation,shuffle};
})();

/* Allowed survey origins. The loopback origin supports local integration checks. */
const SURVEY_ORIGINS = ['https://paneerpakoda.github.io', 'http://127.0.0.1:8891', 'http://127.0.0.1:8892'];
const SHEET_NAME = 'Responses';
const HEADER = ['received_at','response_id','survey_version','version_A','version_B','version_C','product_order',...Object.keys(SurveyRules.fields),'response_json'];

/** Run once from the Apps Script editor attached to your Google Sheet. */
function setup() {
  const book=SpreadsheetApp.getActiveSpreadsheet();
  if(!book)throw Error('Open this script using Extensions → Apps Script from your Google Sheet.');
  PropertiesService.getScriptProperties().setProperty('SHEET_ID',book.getId());
  let sheet=book.getSheetByName(SHEET_NAME);
  if(!sheet)sheet=book.insertSheet(SHEET_NAME);
  ensureHeader(sheet);
}
function configuration(p){
  if(p.version===SurveyRules.version)return {rules:SurveyRules,name:SHEET_NAME,header:HEADER};
  if(p.version===SurveyRulesV3.version)return {rules:SurveyRulesV3,name:'Responses v3',header:['received_at','response_id','survey_version','version_A','version_B','version_C','product_order','product_assignments',...Object.keys(SurveyRulesV3.fields),'response_json']};
  throw Error('Unsupported survey version.');
}
function ensureHeader(sheet,header=HEADER){
  if(sheet.getLastRow()===0){sheet.appendRow(header);sheet.setFrozenRows(1);return;}
  if(JSON.stringify(sheet.getRange(1,1,1,header.length).getValues()[0])!==JSON.stringify(header))throw Error('Unexpected response sheet columns.');
}
function cell(value){const text=String(value);return /^[\s]*[=+\-@]/.test(text)?"'"+text:text;}
function canonical(p,rules){return JSON.stringify({version:p.version,id:p.id,styleOrder:p.styleOrder,productOrder:p.productOrder,...(p.assignments?{assignments:Object.fromEntries(rules.products.map(id=>[id,p.assignments[id]]))}:{}),answers:Object.fromEntries(Object.keys(rules.fields).map(k=>[k,p.answers[k]]))});}
function saveResponse(p){
  const config=configuration(p);config.rules.validate(p);
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw Error('Please retry.');
  try{
    const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if(!id)throw Error('Run setup first.');
    const book=SpreadsheetApp.openById(id);
    let sheet=book.getSheetByName(config.name);
    if(!sheet)sheet=book.insertSheet(config.name);
    ensureHeader(sheet,config.header);
    const serialized=canonical(p,config.rules);
    if(sheet.getLastRow()>1){
      const match=sheet.getRange(2,2,sheet.getLastRow()-1,1).createTextFinder(p.id).matchEntireCell(true).findNext();
      if(match){if(sheet.getRange(match.getRow(),config.header.length).getValue()!==serialized)throw Error('Response already saved with different answers.');return;}
    }
    const row=[new Date().toISOString(),p.id,p.version,...p.styleOrder,p.productOrder.join(' → '),...(p.assignments?[JSON.stringify(p.assignments)]:[]),...Object.keys(config.rules.fields).map(k=>cell(p.answers[k])),serialized];
    sheet.appendRow(row);SpreadsheetApp.flush();
  }finally{lock.releaseLock();}
}
function doPost(e){
  const input=e&&e.parameter||{};
  const nonce=typeof input.nonce==='string'&&/^[0-9a-f-]{36}$/i.test(input.nonce)?input.nonce:'';
  let id='',ok=false;
  try{
    if(!SURVEY_ORIGINS.includes(input.origin)||!nonce)throw Error('Invalid origin.');
    if(typeof input.payload!=='string'||input.payload.length>16000)throw Error('Invalid response size.');
    const p=JSON.parse(input.payload);id=typeof p.id==='string'?p.id:'';
    saveResponse(p);ok=true;
  }catch(error){/* No response contents or personal comments in logs. */}
  const message=JSON.stringify({type:'ux-survey-saved',nonce,id,ok}).replace(/</g,'\\u003c');
  const target=JSON.stringify(SURVEY_ORIGINS.includes(input.origin)?input.origin:SURVEY_ORIGINS[0]).replace(/</g,'\\u003c');
  // Apps Script nests HTML in a sandbox iframe. Send to the host page with an exact target origin.
  const html='<!doctype html><html><body><p>'+ (ok?'Feedback saved.':'Feedback could not be saved. Please return to the survey and retry.') +'</p><script>const m='+message+';const o='+target+';for(const w of [window.parent,window.parent.parent,window.top]){try{w.postMessage(m,o);}catch(e){}}</script></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doGet(){return HtmlService.createHtmlOutput('Illustration survey collector v3. Supports v2 and v3. Open the survey link to participate.');}
