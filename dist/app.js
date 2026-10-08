const R=window.SurveyRules;
const $=selector=>document.querySelector(selector);
const styleNames={with_plinth:'3D with plinth',without_plinth:'3D without plinth',flat_2d:'2D'};
const productNames={home:'Home Loan',personal:'Personal Loan'};
const assets={home:{with_plinth:'home-loan.png',without_plinth:'home-loan-no-plinth-study-transparent-r7.png',flat_2d:'home-loan-2d.webp'},personal:{with_plinth:'personal-loan-original.png',without_plinth:'personal-loan-no-plinth-draft-transparent-r7.png',flat_2d:'personal-loan-2d.webp'}};
const labels={no_preference:'No preference',none:'None of these',depends:'Depends on the product'};
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
const storageKey=R.version;
let state={version:R.version,id:crypto.randomUUID(),styleOrder:R.shuffle(R.styles,random),productOrder:R.shuffle(R.products,random),answers:{improvements:''},step:0,submitted:false};
try{
 const saved=JSON.parse(sessionStorage.getItem(storageKey));
 if(saved&&(saved.pendingResponse||saved.submitted)&&saved.version===R.version&&R.permutation(saved.styleOrder,R.styles)&&R.permutation(saved.productOrder,R.products)&&Number.isInteger(saved.step)&&saved.step>=0&&saved.step<=2&&saved.answers&&Object.entries(saved.answers).every(([k,v])=>R.validAnswer(k,v))&&typeof saved.id==='string')state=saved;
}catch{}
let busy=false,commentOpen=false;
const endpoint=window.SURVEY_CONFIG?.endpoint||'';
const connected=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint);
function persist(){try{sessionStorage.setItem(storageKey,JSON.stringify(state));}catch{}}
function currentField(){return state.step<2?state.productOrder[state.step]+'_preference':'overall';}
function versionLetter(style){return 'ABC'[state.styleOrder.indexOf(style)];}
function image(product,style){return `<img src="assets/${assets[product][style]}" alt="${productNames[product]}, ${styleNames[style]}" width="128" height="128">`;}
function artworkChoices(){
 const overall=state.step===2;
 const product=state.productOrder[state.step];
 return `<div class="art-options ${overall?'overall-options':''}" role="group" aria-label="Illustration choices">${state.styleOrder.map(style=>`<button type="button" class="art-option" data-choice="${style}" aria-pressed="${state.answers[currentField()]===style}" aria-label="${overall?'Choose '+styleNames[style]:'Choose version '+versionLetter(style)}" ${state.pendingResponse?'disabled':''}>${overall?`<span class="art-pair">${state.productOrder.map(p=>image(p,style)).join('')}</span>`:image(product,style)}<span class="option-label">${overall?styleNames[style]:versionLetter(style)}</span></button>`).join('')}</div>`;
}
function otherChoices(){return `<div class="other-options" role="group" aria-label="Other choices">${[...(state.step===2?['depends']:[]),'no_preference','none'].map(value=>`<button type="button" class="other-option" data-choice="${value}" aria-pressed="${state.answers[currentField()]===value}" ${state.pendingResponse?'disabled':''}>${labels[value]}</button>`).join('')}</div>`;}
function showError(message){$('#form-error').textContent=message;$('#form-error').hidden=false;}
function render(focus=false){
 $('#form-error').hidden=true;
 if(state.submitted){
  $('#survey').innerHTML='<section class="success"><h1 tabindex="-1">Thank you.</h1><p>Your feedback is saved. You can close this page.</p></section>';
  $('.progress').hidden=true;$('#step-label').hidden=true;
  if(focus)$('h1').focus();return;
 }
 const final=state.step===2;
 const title=final?'Which style would you use overall?':`Which ${productNames[state.productOrder[state.step]]} illustration works best?`;
 $('#screen').innerHTML=`<h1 tabindex="-1">${title}</h1><p class="instruction">${final?'Think about both products.':'Choose an option, then tap Next.'}</p>${artworkChoices()}${otherChoices()}${final?`<details class="comment" ${commentOpen||state.answers.improvements?'open':''}><summary>Add a comment <span>(optional)</span></summary><label for="improvements">What would you keep or change?</label><textarea id="improvements" name="improvements" maxlength="1500" rows="2" ${state.pendingResponse?'disabled':''}>${escape(state.answers.improvements)}</textarea></details>`:''}`;
 $('#step-label').textContent=`${state.step+1} / 3`;
 $('#progress-fill').style.width=(state.step+1)/3*100+'%';
 $('#back').hidden=state.step===0;$('#back').disabled=!!state.pendingResponse;
 $('#next').hidden=false;$('#next').disabled=!R.validAnswer(currentField(),state.answers[currentField()])||(final&&!connected);
 $('#next').textContent=final?(state.pendingResponse?'Try sending again':'Send feedback'):'Next';
 $('.comment')?.addEventListener('toggle',event=>{commentOpen=event.target.open;});
 if(focus){$('#screen h1').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
function selectChoice(value){
 if(busy||state.pendingResponse||!R.validAnswer(currentField(),value))return;
 if([...document.querySelectorAll('.art-options img')].some(img=>!img.complete||!img.naturalWidth)){showError('The illustrations are still loading. Please try again in a moment.');return;}
 state.answers[currentField()]=value;
 $('#form-error').hidden=true;
 document.querySelectorAll('[data-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.choice===value)));
 $('#next').disabled=state.step===2&&!connected;persist();
}
$('#survey').addEventListener('click',event=>{
 const button=event.target.closest('[data-choice]');if(button)selectChoice(button.dataset.choice);
});
$('#survey').addEventListener('input',event=>{
 if(event.target.name==='improvements'&&!state.pendingResponse){state.answers.improvements=event.target.value;persist();}
});
$('#back').addEventListener('click',()=>{if(busy||state.pendingResponse||state.step===0)return;state.step--;persist();render(true);});
function payload(){return R.validate({version:R.version,id:state.id,styleOrder:state.styleOrder,productOrder:state.productOrder,answers:state.answers});}
$('#survey').addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;
 if(state.step<2){
  if(state.pendingResponse||!R.validAnswer(currentField(),state.answers[currentField()]))return;
  state.step++;persist();render(true);return;
 }
 if(!connected)return;
 let data;try{data=state.pendingResponse||payload();state.pendingResponse=data;persist();}catch{showError('Please choose an option for each question.');return;}
 busy=true;$('#next').disabled=true;$('#back').disabled=true;$('#next').textContent='Sending…';$('#form-error').hidden=true;
 document.querySelectorAll('[data-choice],textarea').forEach(control=>{control.disabled=true;});
 try{await sendResponse(data);state.submitted=true;state.answers={};delete state.pendingResponse;persist();render(true);}
 catch{showError('Could not confirm your response. Your answers are kept here. Please retry; it won’t send a duplicate.');$('#next').disabled=false;$('#next').textContent='Try sending again';}
 finally{busy=false;}
});
function sendResponse(data){return new Promise((resolve,reject)=>{
 const nonce=crypto.randomUUID();const iframe=document.createElement('iframe');iframe.name='survey-submit-'+nonce;iframe.hidden=true;iframe.title='Save survey response';
 const form=document.createElement('form');form.method='POST';form.action=endpoint;form.target=iframe.name;form.hidden=true;
 for(const [key,value] of Object.entries({payload:JSON.stringify(data),nonce,origin:location.origin})){const input=document.createElement('input');input.name=key;input.value=value;form.append(input);}
 const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',receive);form.remove();iframe.remove();};
 const receive=event=>{let host;try{host=new URL(event.origin).hostname;}catch{return;}const trusted=event.origin.startsWith('https://')&&(host==='script.google.com'||host==='script.googleusercontent.com'||host.endsWith('-script.googleusercontent.com'));const m=event.data;
  if(!trusted||!m||m.type!=='ux-survey-saved'||m.nonce!==nonce||m.id!==data.id)return;
  cleanup();m.ok===true?resolve():reject(Error('Save rejected.'));
 };
 const timer=setTimeout(()=>{cleanup();reject(Error('Confirmation timed out.'));},45000);
 window.addEventListener('message',receive);document.body.append(iframe,form);form.submit();
});}
render();
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'read_illustration_survey_draft',title:'Read survey draft',description:'Read this participant’s survey step and draft answers. Does not submit.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){if(input&&(Array.isArray(input)||typeof input!=='object'||Object.keys(input).length))throw Error('No inputs expected.');return {step:state.step+1,submitted:state.submitted,versions:state.styleOrder.map(s=>({label:versionLetter(s),style:styleNames[s]})),answers:{...state.answers}};}})).catch(()=>{});}catch{}}
