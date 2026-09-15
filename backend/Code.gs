// Paste this entire file into Apps Script. Generated from dist/rules.js + backend/server.js.
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

/* Edit this origin before running setup(). Do not add a path or trailing slash. */
const SURVEY_ORIGIN = 'https://YOUR-USERNAME.github.io';
const SHEET_NAME = 'Responses';
const HEADER = ['received_at','response_id','survey_version','version_A','version_B','version_C','product_order',...Object.keys(SurveyRules.fields),'response_json'];

/** Run once from the Apps Script editor attached to your Google Sheet. */
function setup() {
  if(!/^https:\/\/[^/]+$/.test(SURVEY_ORIGIN)||SURVEY_ORIGIN.includes('YOUR-USERNAME'))throw Error('Set SURVEY_ORIGIN to your GitHub Pages origin first.');
  const book=SpreadsheetApp.getActiveSpreadsheet();
  if(!book)throw Error('Open this script using Extensions → Apps Script from your Google Sheet.');
  PropertiesService.getScriptProperties().setProperty('SHEET_ID',book.getId());
  let sheet=book.getSheetByName(SHEET_NAME);
  if(!sheet)sheet=book.insertSheet(SHEET_NAME);
  ensureHeader(sheet);
}
function ensureHeader(sheet){
  if(sheet.getLastRow()===0){sheet.appendRow(HEADER);sheet.setFrozenRows(1);return;}
  if(JSON.stringify(sheet.getRange(1,1,1,HEADER.length).getValues()[0])!==JSON.stringify(HEADER))throw Error('Unexpected response sheet columns.');
}
function cell(value){const text=String(value);return /^[\s]*[=+\-@]/.test(text)?"'"+text:text;}
function canonical(p){return JSON.stringify({version:p.version,id:p.id,styleOrder:p.styleOrder,productOrder:p.productOrder,answers:Object.fromEntries(Object.keys(SurveyRules.fields).map(k=>[k,p.answers[k]]))});}
function saveResponse(p){
  SurveyRules.validate(p);
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw Error('Please retry.');
  try{
    const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if(!id)throw Error('Run setup first.');
    const sheet=SpreadsheetApp.openById(id).getSheetByName(SHEET_NAME);
    if(!sheet)throw Error('Missing response sheet.');
    ensureHeader(sheet);
    const serialized=canonical(p);
    if(sheet.getLastRow()>1){
      const match=sheet.getRange(2,2,sheet.getLastRow()-1,1).createTextFinder(p.id).matchEntireCell(true).findNext();
      if(match){if(sheet.getRange(match.getRow(),HEADER.length).getValue()!==serialized)throw Error('Response already saved with different answers.');return;}
    }
    const row=[new Date().toISOString(),p.id,p.version,...p.styleOrder,p.productOrder.join(' → '),...Object.keys(SurveyRules.fields).map(k=>cell(p.answers[k])),serialized];
    sheet.appendRow(row);
    SpreadsheetApp.flush();
  }finally{lock.releaseLock();}
}
function doPost(e){
  const input=e&&e.parameter||{};
  const nonce=typeof input.nonce==='string'&&/^[0-9a-f-]{36}$/i.test(input.nonce)?input.nonce:'';
  let id='',ok=false;
  try{
    if(input.origin!==SURVEY_ORIGIN||!nonce)throw Error('Invalid origin.');
    if(typeof input.payload!=='string'||input.payload.length>16000)throw Error('Invalid response size.');
    const p=JSON.parse(input.payload);id=typeof p.id==='string'?p.id:'';
    saveResponse(p);ok=true;
  }catch(error){/* No response contents or personal comments in logs. */}
  const message=JSON.stringify({type:'ux-survey-saved',nonce,id,ok}).replace(/</g,'\\u003c');
  const target=JSON.stringify(SURVEY_ORIGIN).replace(/</g,'\\u003c');
  // Apps Script nests HTML in a sandbox iframe. Send to the host page with an exact target origin.
  const html='<!doctype html><html><body><p>'+ (ok?'Feedback saved.':'Feedback could not be saved. Please return to the survey and retry.') +'</p><script>const m='+message+';const o='+target+';for(const w of [window.parent,window.parent.parent,window.top]){try{w.postMessage(m,o);}catch(e){}}</script></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doGet(){return HtmlService.createHtmlOutput('Illustration survey response endpoint. Open the survey link to participate.');}
