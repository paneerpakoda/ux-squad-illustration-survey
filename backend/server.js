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
  if(p.version===SurveyRulesV3.version || p.version==='ux-illustrations-2026-09-v3.1') {
    const header=['received_at','response_id','survey_version','version_A','version_B','version_C','product_order','product_assignments'];
    for(const k of Object.keys(SurveyRulesV3.fields)){
      header.push(k);
      if(SurveyRulesV3.detailQuestions.includes(k)) header.push(k+'_details');
    }
    header.push('response_json','artwork_revision');
    return {rules:SurveyRulesV3,name:'Responses v7',header,fields:Object.keys(SurveyRulesV3.fields)};
  }
  throw Error('Unsupported survey version.');
}
function ensureHeader(sheet,header=HEADER){
  const columns=sheet.getMaxColumns();
  if(columns<header.length)sheet.insertColumnsAfter(columns,header.length-columns);
  if(sheet.getLastRow()===0){sheet.appendRow(header);sheet.setFrozenRows(1);return header;}
  const existing=sheet.getRange(1,1,1,header.length).getValues()[0];
  if(JSON.stringify(existing)===JSON.stringify(header))return header;
  throw Error('Unexpected response sheet columns.');
}
function cell(value){const text=String(value);return /^[\s]*[=+\-@]/.test(text)?"'"+text:text;}
function canonical(p,rules){return JSON.stringify({version:p.version,id:p.id,styleOrder:p.styleOrder,productOrder:p.productOrder,...(p.assignments?{assignments:Object.fromEntries(rules.products.map(id=>[id,p.assignments[id]]))}:{}),answers:Object.fromEntries(Object.keys(rules.fields).map(k=>[k,p.answers[k]])),...(p.details!==undefined?{details:orderedDetails(p.details,rules)}:{}),...(p.artworkRevision!==undefined?{artworkRevision:p.artworkRevision}:{})});}
function orderedDetails(details,rules){return Object.fromEntries(rules.detailQuestions.filter(k=>Object.prototype.hasOwnProperty.call(details,k)).map(k=>[k,{selected:rules.detailOptions[k].filter(v=>details[k].selected.includes(v)),custom:details[k].custom}]));}
function readableDetails(details,rules){return Object.entries(orderedDetails(details,rules)).filter(([,d])=>d.selected.length||d.custom).map(([k,d])=>k+'\nReasons: '+(d.selected.map(v=>rules.detailLabels[v]).join('; ')||'—')+(d.custom?'\nAdditional: '+d.custom:'')).join('\n\n');}
function saveResponse(p){
  const config=configuration(p);
  config.rules.validate(p);
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw Error('Please retry.');
  try{
    const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if(!id)throw Error('Run setup first.');
    const book=SpreadsheetApp.openById(id);
    let sheet=book.getSheetByName(config.name);
    if(!sheet)sheet=book.insertSheet(config.name);
    const actualHeader = ensureHeader(sheet,config.header);
    const serialized=canonical(p,config.rules);
    if(sheet.getLastRow()>1){
      const match=sheet.getRange(2,2,sheet.getLastRow()-1,1).createTextFinder(p.id).matchEntireCell(true).findNext();
      if(match){if(sheet.getRange(match.getRow(),actualHeader.indexOf('response_json')+1).getValue()!==serialized)throw Error('Response already saved with different answers.');return;}
    }
    
    // Map values to row based on actualHeader
    const rowObj = {};
    rowObj['received_at'] = new Date().toISOString();
    rowObj['response_id'] = p.id;
    rowObj['survey_version'] = p.version;
    rowObj['version_A'] = p.styleOrder[0];
    rowObj['version_B'] = p.styleOrder[1];
    rowObj['version_C'] = p.styleOrder[2];
    rowObj['product_order'] = p.productOrder.join(' → ');
    if(p.assignments) rowObj['product_assignments'] = JSON.stringify(p.assignments);
    
    if(config.rules===SurveyRulesV3 || p.version === 'ux-illustrations-2026-09-v3.1'){
      for(const k of config.fields){
        if (p.answers && p.answers[k] !== undefined) {
          rowObj[k] = cell(p.answers[k]);
        }
        if(config.rules.detailQuestions.includes(k)){
          const d=p.details?.[k];
          let detailStr='';
          if(d&&(d.selected.length||d.custom)){
            const reasons=d.selected.map(v=>config.rules.detailLabels[v]).join('; ');
            detailStr=(reasons?'Reasons: '+reasons:'')+(reasons&&d.custom?'\nAdditional: ':(d.custom?'Additional: ':''))+(d.custom||'');
          }
          rowObj[k+'_details'] = cell(detailStr);
        }
      }
      rowObj['response_json'] = serialized;
      rowObj['artwork_revision'] = p.artworkRevision||'';
    }else{
      for(const k of Object.keys(config.rules.fields)) {
        if (p.answers && p.answers[k] !== undefined) rowObj[k] = cell(p.answers[k]);
      }
      rowObj['response_json'] = serialized;
    }
    
    const row = actualHeader.map(h => rowObj[h] !== undefined ? rowObj[h] : '');
    sheet.appendRow(row);SpreadsheetApp.flush();
  }finally{lock.releaseLock();}
}
function doPost(e){
  const input=e&&e.parameter||{};
  const nonce=typeof input.nonce==='string'&&/^[0-9a-f-]{36}$/i.test(input.nonce)?input.nonce:'';
  let id='',ok=false,err='';
  try{
    if(!SURVEY_ORIGINS.includes(input.origin)||!nonce)throw Error('Invalid origin.');
    if(typeof input.payload!=='string'||input.payload.length>32000)throw Error('Invalid response size.');
    const p=JSON.parse(input.payload);id=typeof p.id==='string'?p.id:'';
    saveResponse(p);ok=true;
  }catch(error){err=error&&error.message||String(error);}
  const message=JSON.stringify({type:'ux-survey-saved',nonce,id,ok,error:err}).replace(/</g,'\\u003c');
  const target=JSON.stringify(SURVEY_ORIGINS.includes(input.origin)?input.origin:SURVEY_ORIGINS[0]).replace(/</g,'\\u003c');
  // Apps Script nests HTML in a sandbox iframe. Send to the host page with an exact target origin.
  const html='<!doctype html><html><body><p>'+ (ok?'Feedback saved.':('Feedback could not be saved.' + (err ? ' ' + err : '') + ' Please return to the survey and retry.')) +'</p><script>const m='+message+';const o='+target+';for(const w of [window.parent,window.parent.parent,window.top]){try{w.postMessage(m,o);}catch(e){}}</script></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doGet(){return HtmlService.createHtmlOutput('Illustration survey collector v3-details. Supports v2 and v3 with optional question details. Open the survey link to participate.');}

