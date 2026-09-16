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
