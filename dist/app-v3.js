'use strict';
const $=selector=>document.querySelector(selector);
const R=window.SurveyRulesV3;
const random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
const storageKey=R.version;
let state={version:R.version,id:crypto.randomUUID(),styleOrder:R.shuffle(R.styles,random),productOrder:R.shuffle(R.products,random),assignments:Object.fromEntries(R.products.map(id=>[id,R.shuffle(R.styles,random)])),answers:{respondent_name:'',home_reason:'',two_wheeler_reason:'',reason:'',changes:''},step:0};
try{const saved=JSON.parse(sessionStorage.getItem(storageKey));if(saved?.version===R.version){if(saved.pendingResponse){R.validate(saved.pendingResponse);state={...saved.pendingResponse,pendingResponse:saved.pendingResponse,step:11};}else if(saved.submitted===true)state.submitted=true;}}catch{}
const styles=state.styleOrder;
const names={with_plinth:'3D with plinth',without_plinth:'3D without plinth',flat_2d:'Existing 2D'};
const products=state.productOrder.map(id=>window.PRODUCTS.find(p=>p.id===id));
const steps=[{kind:'name'}].concat(products.map(product=>({kind:'preference',product})).concat(products.filter(p=>['home','two_wheeler'].includes(p.id)).map(product=>({kind:'clarity',product})),[{kind:'screen'},{kind:'consistency'},{kind:'recommendation'}]));
const answers=state.answers,comments=answers;
let step=state.step,busy=false;
const endpoint=window.SURVEY_CONFIG?.endpoint||'';
const connected=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint);
function persist(){try{sessionStorage.setItem(storageKey,JSON.stringify({...state,step}));}catch{}}
function showError(message){$('#form-error').textContent=message;$('#form-error').hidden=false;}
const screenObserver=new ResizeObserver(entries=>entries.forEach(({target,contentRect})=>{target.style.height=(contentRect.width/360*1126)+'px';target.firstElementChild.style.transform=`scale(${contentRect.width/360})`;}));
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=()=>steps[step].kind==='name'?'respondent_name':steps[step].product?steps[step].product.id+'_'+steps[step].kind:steps[step].kind;
function artwork(product,style){return product.images[style]?`<img src="${product.images[style]}" alt="${escape(product.name)}, ${names[style]}" width="208" height="208">`:'<span class="missing-art"><span>Artwork pending</span><small>Matching no-plinth version needed</small></span>';}
function artChoices(q){
 const family=!q.product;
 return `<div class="art-options ${family?'family-options':q.kind==='clarity'?'context-options':''}" role="group" aria-label="Illustration choices">${(q.product?state.assignments[q.product.id]:styles).map((style,i)=>{
  const available=family?products.every(p=>p.images[style]):!!q.product.images[style];
  const content=family?`<span class="family-grid">${products.map(p=>`<span class="family-item">${artwork(p,style)}<small>${p.name}</small></span>`).join('')}</span>`:q.kind==='clarity'?`<span class="context-tile">${artwork(q.product,style)}</span>`:artwork(q.product,style);
  return `<button type="button" class="art-option" data-choice="${style}" aria-pressed="${answers[key()]===style}" aria-label="Choose ${family?names[style]:'version '+'ABC'[i]}" ${available?'':'disabled'}>${content}<span class="option-label">${family?names[style]:'ABC'[i]}</span></button>`;
 }).join('')}</div>`;
}
function options(q){
 const choices=q.kind==='clarity'?[['equal','Equally clear'],['none','None are clear']]:q.kind==='consistency'?[['equal','Equally consistent'],['none','None are consistent']]:[...(q.kind==='recommendation'?[['depends','Depends on the product']]:[]),['no_preference','No preference'],['none','None of these']];
 return `<div class="other-options" role="group" aria-label="Other choices">${choices.map(([v,label])=>`<button type="button" class="other-option" data-choice="${v}" aria-pressed="${answers[key()]===v}">${label}</button>`).join('')}</div>`;
}
function field(name,label){return `<div class="comment-field"><label for="${name}">${label}</label><textarea id="${name}" name="${name}" maxlength="1500" rows="2">${escape(comments[name])}</textarea></div>`;}
function render(focus=false){
 $('#form-error').hidden=true;if(state.submitted){showSuccess();return;}
 const q=steps[step];const final=step===steps.length-1;
 const title=q.kind==='name'?'What’s your name?':q.kind==='preference'?`Which illustration would you choose for ${q.product.name}?`:q.kind==='clarity'?'At this size, which illustration is easiest to make out?':q.kind==='screen'?'Which illustrations work best on this screen?':q.kind==='consistency'?'Which set feels most consistent?':'Which direction would you recommend for Offers?';
 const instruction=q.kind==='name'?'Your name will be saved with your feedback for the UX Squad review.':q.kind==='preference'?'Think about its use on the Offers page. Choose an option, then tap Next.':q.kind==='clarity'?`${q.product.name} · Compare the three illustrations at the same size.`:q.kind==='screen'?'Compare the product illustrations in the Offers screen. Choose a screen, then tap Next.':q.kind==='consistency'?'Consider how the illustrations work together across all six products.':'Consider all six products. It’s okay to prefer different styles for different products.';
 const type=q.kind==='name'?'Before you begin':q.kind==='preference'?'Product preference':q.kind==='clarity'?'Clarity at a smaller size':q.kind==='screen'?'In the Offers screen':q.kind==='consistency'?'Across the family':'Your recommendation';
 const note=q.kind==='clarity'?'Shown in a 64 px slot, matching the product cards in the supplied screen.':q.kind==='screen'?'Five product illustrations vary. The banner, Insta Flexi-cash and all interface content stay the same. Screens are scaled to fit.':'';
 let comment='';
 if(q.kind==='clarity')comment=`<details class="comment" ${comments[q.product.id+'_reason']?'open':''}><summary>Add a reason <span>(optional)</span></summary>${field(q.product.id+'_reason','What influenced your choices for this product?')}</details>`;
 if(final)comment=`<details class="comment" ${comments.reason||comments.changes?'open':''}><summary>Add your reasoning <span>(optional)</span></summary>${field('reason','What is the main reason for your recommendation?')}${field('changes','What would need to change before you would use it?')}</details>`;
 $('#screen').innerHTML=`<p class="question-kind">${type}</p><h1 tabindex="-1">${title}</h1><p class="instruction">${instruction}</p>${q.kind==='name'?`<div class="name-field"><label for="respondent_name">Your name</label><input id="respondent_name" name="respondent_name" type="text" autocomplete="name" maxlength="100" required value="${escape(answers.respondent_name)}"></div>`:(q.kind==='screen'?screenChoices():artChoices(q))+options(q)}${note?`<p class="preview-caveat">${note}</p>`:''}${comment}`;
 document.querySelector('main').classList.toggle('screen-comparison',q.kind==='screen');
 screenObserver.disconnect();document.querySelectorAll('.screen-viewport').forEach(el=>screenObserver.observe(el));
 $('#step-label').textContent=`${step+1} / ${steps.length}`;
 $('#progress-fill').style.width=`${(step+1)/steps.length*100}%`;
 $('#back').hidden=step===0;
 $('#next').disabled=!R.validAnswer(key(),answers[key()])||(final&&!connected);$('#next').textContent=final?(state.pendingResponse?'Try sending again':'Send feedback'):'Next';
 $('#back').disabled=!!state.pendingResponse;
 if(state.pendingResponse)document.querySelectorAll('[data-choice],textarea,input').forEach(el=>el.disabled=true);
 if(focus){$('#screen h1').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
$('#survey').addEventListener('click',event=>{
 const button=event.target.closest('[data-choice]');if(!button||button.disabled||busy||state.pendingResponse||!R.validAnswer(key(),button.dataset.choice))return;
 if([...document.querySelectorAll('.art-options img')].some(img=>!img.complete||!img.naturalWidth)){showError('The illustrations are still loading. Please try again in a moment.');return;}
 answers[key()]=button.dataset.choice;
 document.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.choice===answers[key()])));
 $('#next').disabled=step===steps.length-1&&!connected;$('#form-error').hidden=true;persist();
});
$('#survey').addEventListener('input',event=>{if(['TEXTAREA','INPUT'].includes(event.target.tagName)&&!busy&&!state.pendingResponse&&Object.prototype.hasOwnProperty.call(R.fields,event.target.name)){comments[event.target.name]=event.target.value;$('#next').disabled=!R.validAnswer(key(),answers[key()])||(step===steps.length-1&&!connected);persist();}});
$('#back').addEventListener('click',()=>{if(step>0&&!busy&&!state.pendingResponse){step--;persist();render(true);}});

function payload(){return R.validate({version:state.version,id:state.id,styleOrder:styles,productOrder:state.productOrder,assignments:state.assignments,answers});}
function showSuccess(){screenObserver.disconnect();document.querySelector('main').classList.remove('screen-comparison');$('#survey').innerHTML='<section class="success"><h1 tabindex="-1">Thank you.</h1><p>Your feedback is saved. You can close this page.</p></section>';$('.progress').hidden=true;$('#step-label').hidden=true;$('#survey h1').focus();window.scrollTo({top:0,behavior:'instant'});}
$('#survey').addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!R.validAnswer(key(),answers[key()]))return;
 if(step<steps.length-1){if(state.pendingResponse)return;step++;persist();render(true);return;}
 if(!connected){showError('The response connection is unavailable. Please try again later.');return;}
 let data;try{data=state.pendingResponse||payload();state.pendingResponse=data;persist();}catch{showError('Please choose an option for each question.');return;}
 busy=true;$('#next').disabled=true;$('#next').textContent='Sending…';$('#back').disabled=true;$('#form-error').hidden=true;
 document.querySelectorAll('[data-choice],textarea,input').forEach(el=>el.disabled=true);
 try{await sendResponse(data);state.submitted=true;state.answers={};delete state.pendingResponse;persist();showSuccess();}
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
