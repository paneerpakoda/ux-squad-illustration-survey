'use strict';
function detectClientOS() {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Macintosh|Windows|Linux/.test(ua)) return 'desktop';
  return 'other';
}

const $=selector=>document.querySelector(selector);
const R=window.SurveyRulesV3;
const random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
const storageKey=R.version;
const artworkRevision='sw-reasons-2026-09-24';
let state={version:R.version,id:crypto.randomUUID(),styleOrder:R.shuffle(R.styles,random),productOrder:R.shuffle(R.products,random),assignments:Object.fromEntries(R.products.map(id=>[id,R.shuffle(R.styles,random)])),artworkRevision,details:{},answers:{age_bracket:'',relationship:'',client_os:'',home_reason:'',two_wheeler_reason:'',reason:'',changes:''},step:0};
try{const saved=JSON.parse(sessionStorage.getItem(storageKey));if(saved?.version===R.version){if(saved.pendingResponse){R.validate(saved.pendingResponse);state={...saved.pendingResponse,pendingResponse:saved.pendingResponse,step:12};}else if(saved.submitted===true)state.submitted=true;}}catch{}
if (!state.answers.client_os) state.answers.client_os = detectClientOS();
const styles=state.styleOrder;
const names={with_plinth:'3D with plinth',without_plinth:'3D without plinth',flat_2d:'Existing 2D'};
const products=state.productOrder.map(id=>window.PRODUCTS.find(p=>p.id===id));
const steps=[{kind:'intro'}].concat(products.map(product=>({kind:'preference',product})).concat(products.filter(p=>['home','two_wheeler'].includes(p.id)).map(product=>({kind:'clarity',product})),[{kind:'screen'},{kind:'cc_icons'},{kind:'consistency'},{kind:'recommendation'}]));
const answers=state.answers,comments=answers;
if(state.pendingResponse)state.step=steps.length-1;
let step=state.step,busy=false;
const endpoint=window.SURVEY_CONFIG?.endpoint||'';
const connected=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint);
function persist(){try{sessionStorage.setItem(storageKey,JSON.stringify({...state,step}));}catch{}}
function showError(message){$('#form-error').textContent=message;$('#form-error').hidden=false;}
function updateNextBtns(d,t){['#next','#next-top'].forEach(s=>{const el=$(s);if(el){if(d!==undefined)el.disabled=d;if(t!==undefined)el.textContent=t;}});}
const screenObserver=new ResizeObserver(entries=>entries.forEach(({target,contentRect})=>{target.firstElementChild.style.transform=`scale(${contentRect.width/360})`;}));
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=()=>steps[step].kind==='intro'?'intro':steps[step].product?steps[step].product.id+'_'+steps[step].kind:steps[step].kind;
function artwork(product,style){return product.images[style]?`<img src="${product.images[style]}" alt="${escape(product.name)}, ${names[style]}" width="208" height="208">`:'<span class="missing-art"><span>Artwork pending</span><small>Matching no-plinth version needed</small></span>';}
function artChoices(q){
 const family=!q.product;
 return `<div class="art-options ${family?'family-options':q.kind==='clarity'?'context-options':''}" role="group" aria-label="Illustration choices">${(q.product?state.assignments[q.product.id]:styles).map((style,i)=>{
  const available=family?products.every(p=>p.images[style]):!!q.product.images[style];
  const content=family?`<span class="family-grid">${products.map(p=>`<span class="family-item">${artwork(p,style)}<small>${p.name}</small></span>`).join('')}</span>`:q.kind==='clarity'?`<span class="context-tile">${artwork(q.product,style)}</span>`:artwork(q.product,style);
  return `<button type="button" class="art-option" data-choice="${style}" aria-pressed="${answers[key()]===style}" aria-label="Choose ${family?names[style]:'version '+'ABC'[i]}" ${available?'':'disabled'}>${content}<span class="option-label">${family?names[style]:'ABC'[i]}</span></button>`;
 }).join('')}</div>`;
}
function ccIconChoices() {
 const v = answers[key()];
 return `<div class="art-options cc-options" role="group" aria-label="Credit Card Icon Choices">
  <button type="button" class="art-option" data-choice="3d_icons" aria-pressed="${v==='3d_icons'}">
   <span class="option-label" style="font-size:15px;font-weight:700">New 3D Icons</span>
   <div class="cc-screen-container">
    <img src="assets/cc-3d-landing.png" alt="New 3D landing page screen">
   </div>
   <div class="cc-icons-showcase">
    <div class="cc-icon-card"><img src="assets/cc-3d-lounge.png" class="cc-icon-img" alt="Lounge"><span class="cc-icon-label">Lounge</span></div>
    <div class="cc-icon-card"><img src="assets/cc-3d-movie.png" class="cc-icon-img" alt="Movies"><span class="cc-icon-label">Movies</span></div>
    <div class="cc-icon-card"><img src="assets/cc-3d-rewards.png" class="cc-icon-img" alt="Rewards"><span class="cc-icon-label">Rewards</span></div>
    <div class="cc-icon-card"><img src="assets/cc-3d-tickets.png" class="cc-icon-img" alt="Perks"><span class="cc-icon-label">Perks</span></div>
   </div>
  </button>
  <button type="button" class="art-option" data-choice="2d_icons" aria-pressed="${v==='2d_icons'}">
   <span class="option-label" style="font-size:15px;font-weight:700">Existing 2D Icons</span>
   <div class="cc-screen-container">
    <img src="assets/cc-2d-landing.png" alt="Existing 2D landing page screen">
   </div>
      <div class="cc-icons-showcase">
    <div class="cc-icon-card"><img src="assets/cc-2d-lounge.png" class="cc-icon-img" alt="Lounge"><span class="cc-icon-label">Lounge</span></div>
    <div class="cc-icon-card"><img src="assets/cc-2d-movie.png" class="cc-icon-img" alt="Movies"><span class="cc-icon-label">Movies</span></div>
    <div class="cc-icon-card"><img src="assets/cc-2d-rewards.png" class="cc-icon-img" alt="Rewards"><span class="cc-icon-label">Rewards</span></div>
    <div class="cc-icon-card"><img src="assets/cc-2d-tickets.png" class="cc-icon-img" alt="Perks"><span class="cc-icon-label">Perks</span></div>
   </div>
  </button>
 </div>`;
}
function options(q){
 const choices=q.kind==='clarity'?[['equal','Equally clear'],['none','None are clear']]:q.kind==='consistency'?[['equal','Equally consistent'],['none','None are consistent']]:q.kind==='cc_icons'?[['no_preference','No preference']]:[...(q.kind==='recommendation'?[['depends','Depends on the product']]:[]),['no_preference','No preference'],['none','None of these']];
 return `<div class="other-options" role="group" aria-label="Other choices">${choices.map(([v,label])=>`<button type="button" class="other-option" data-choice="${v}" aria-pressed="${answers[key()]===v}">${label}</button>`).join('')}</div>`;
}
function questionDetails(){
 const k=key(),d=state.details?.[k]||{selected:[],custom:''};
 return `<details class="comment question-details" ${d.selected.length||d.custom||answers[k]?'open':''}><summary>Add details <span>(optional)</span></summary><fieldset class="reason-options"><legend>What influenced your choice?</legend><p class="reason-help">Select all that apply, or write your own details.</p>${R.detailOptions[k].map(id=>`<label class="reason-option"><input type="checkbox" data-reason="${id}" ${d.selected.includes(id)?'checked':''}><span>${R.detailLabels[id]}</span></label>`).join('')}</fieldset><div class="comment-field"><label for="custom-detail">Anything else you’d like to add? <span>(optional)</span></label><textarea id="custom-detail" data-custom-detail maxlength="1000" rows="3" placeholder="Tell us what influenced your choice…">${escape(d.custom)}</textarea><p class="reason-help">Up to 1,000 characters.</p></div></details>`;
}
function render(focus=false){
 $('#form-error').hidden=true;if(state.submitted){showSuccess();return;}
 const q=steps[step];const final=step===steps.length-1;
 const title=q.kind==='intro'?'Help shape our illustration direction':q.kind==='preference'?`Which illustration would you choose for ${q.product.name}?`:q.kind==='clarity'?'At this size, which illustration is easiest to make out?':q.kind==='screen'?'Which illustrations work best on this screen?':q.kind==='cc_icons'?'Credit card landing pages':q.kind==='consistency'?'Which set feels most consistent?':'Which direction would you recommend for Offers?';
 const instruction=q.kind==='intro'?'':q.kind==='preference'?'Think about its use on the Offers page. Choose an option, then tap Next.':q.kind==='clarity'?`${q.product.name} · Compare the three illustrations at the same size.`:q.kind==='screen'?'Compare the product illustrations in the Offers screen. Choose a screen, then tap Next.':q.kind==='cc_icons'?'Compare the new flatter 3D icons to the existing 2D line-art icons.':q.kind==='consistency'?'Consider how the illustrations work together across all six products.':'Consider all six products. It’s okay to prefer different styles for different products.';
 const type=q.kind==='intro'?'UX Squad Design Study':q.kind==='preference'?'Product preference':q.kind==='clarity'?'Clarity at a smaller size':q.kind==='screen'?'In the Offers screen':q.kind==='cc_icons'?'Iconography style':q.kind==='consistency'?'Across the family':'Your recommendation';
 const note=q.kind==='clarity'?'Shown in a 64 px slot, matching the product cards in the supplied screen.':'';
 const comment=q.kind==='intro'?'':questionDetails();
 const nextTop=document.createElement('button');nextTop.id='next-top';nextTop.type='submit';nextTop.className='send';
 
  const introContent=`<div class="trust-badge">
      <span class="trust-icon">🔒</span>
      <span>100% Anonymous · No personal data · ⏱ ~3 mins</span>
    </div>
    <div class="survey-intro-card">
    <div class="intro-card-header">
      <strong>Why we’re doing this</strong>
    </div>
    <p class="intro-card-desc">We are evaluating three visual directions for product illustrations and landing page iconography:</p>
    <ul class="intro-card-list">
      <li><strong>3D with plinth</strong> vs <strong>3D without plinth</strong> vs <strong>Existing 2D</strong></li>
      <li>Visual clarity and recognition across 6 key banking products</li>
      <li>Real screen context on the Offers page &amp; new Credit Card icons</li>
    </ul>
    <p class="intro-card-footer">Your input will help the UX Squad finalize the art direction for upcoming releases.</p>
  </div>
  <div class="demographics-form">
    <fieldset class="pill-selector-group">
      <legend>Your age group</legend>
      <div class="pill-options">
        <button type="button" class="pill-btn" data-field="age_bracket" data-val="under_25" aria-pressed="${answers.age_bracket==='under_25'}">&lt; 25</button>
        <button type="button" class="pill-btn" data-field="age_bracket" data-val="25_34" aria-pressed="${answers.age_bracket==='25_34'}">25–34</button>
        <button type="button" class="pill-btn" data-field="age_bracket" data-val="35_49" aria-pressed="${answers.age_bracket==='35_49'}">35–49</button>
        <button type="button" class="pill-btn" data-field="age_bracket" data-val="50_plus" aria-pressed="${answers.age_bracket==='50_plus'}">50+</button>
      </div>
    </fieldset>
    <fieldset class="pill-selector-group">
      <legend>Your relationship</legend>
      <div class="pill-options">
        <button type="button" class="pill-btn" data-field="relationship" data-val="icici_bank_customer" aria-pressed="${answers.relationship==='icici_bank_customer'}">ICICI Bank Customer</button>
        <button type="button" class="pill-btn" data-field="relationship" data-val="bank_team" aria-pressed="${answers.relationship==='bank_team'}">Bank Team</button>
        <button type="button" class="pill-btn" data-field="relationship" data-val="agency_team" aria-pressed="${answers.relationship==='agency_team'}">Agency Team</button>
        <button type="button" class="pill-btn" data-field="relationship" data-val="other_bank" aria-pressed="${answers.relationship==='other_bank'}">Other Bank User</button>
      </div>
    </fieldset>
  </div>`;

 $('#screen').innerHTML=`<p class="question-kind">${type}</p><div class="question-heading"><h1 tabindex="-1">${title}</h1></div>${instruction?`<p class="instruction">${instruction}</p>`:''}${note&&q.kind==='screen'?`<p class="preview-caveat">${note}</p>`:''}${q.kind==='intro'?introContent:(q.kind==='screen'?screenChoices():q.kind==='cc_icons'?ccIconChoices():artChoices(q))+options(q)}${note&&q.kind!=='screen'?`<p class="preview-caveat">${note}</p>`:''}${comment}`;
 document.querySelector('.question-heading').append(nextTop);
 document.querySelector('main').classList.toggle('screen-comparison',q.kind==='screen');
 screenObserver.disconnect();document.querySelectorAll('.screen-viewport').forEach(el=>screenObserver.observe(el));
 $('#step-label').textContent=`${step+1} / ${steps.length}`;
 $('#progress-fill').style.width=`${(step+1)/steps.length*100}%`;
 $('#back').hidden=step===0;
 const introValid = R.validAnswer('age_bracket', answers.age_bracket) && R.validAnswer('relationship', answers.relationship);
  const isValid = q.kind==='intro' ? introValid : R.validAnswer(key(),answers[key()]);
  updateNextBtns(!isValid||(final&&!connected),final?(state.pendingResponse?'Try sending again':'Send feedback'):(step===0?'Start survey →':'Next →'));
 $('#back').disabled=!!state.pendingResponse;
 if(state.pendingResponse)document.querySelectorAll('[data-choice],textarea,input').forEach(el=>el.disabled=true);
 if(focus){$('#screen h1').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
$('#survey').addEventListener('click',event=>{
 const button=event.target.closest('[data-choice], .pill-btn');if(!button)return;
  if (button.matches('.pill-btn') && !busy && !state.pendingResponse) {
    answers[button.dataset.field] = button.dataset.val;
    const group = button.closest('.pill-options');
    group.querySelectorAll('.pill-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.val === answers[button.dataset.field])));
    const introValid = R.validAnswer('age_bracket', answers.age_bracket) && R.validAnswer('relationship', answers.relationship);
    updateNextBtns(!introValid);
    $('#form-error').hidden=true;
    persist();
    return;
  }
  if(!button.dataset.choice||button.disabled||busy||state.pendingResponse||!R.validAnswer(key(),button.dataset.choice))return;

 if([...document.querySelectorAll('.art-options img')].some(img=>!img.complete||!img.naturalWidth)){showError('The illustrations are still loading. Please try again in a moment.');return;}
 answers[key()]=button.dataset.choice;
 document.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.choice===answers[key()])));
 const details=$('.question-details');
 if(details){
  details.open=true;
  details.scrollIntoView({behavior:'smooth',block:'center'});
 }
 updateNextBtns(step===steps.length-1&&!connected);$('#form-error').hidden=true;persist();
 if(!$('#next').disabled){
  const nextBtn=window.innerWidth<=600?$('#next-top'):$('#next');
  nextBtn.focus({preventScroll:true});
  nextBtn.style.outline='3px solid #4276bd';nextBtn.style.outlineOffset='4px';
  setTimeout(()=>{
   nextBtn.style.outline='';nextBtn.style.outlineOffset='';
   if(document.activeElement===nextBtn)nextBtn.blur();
  },1000);
 }
});
$('#survey').addEventListener('input',event=>{
 if(busy||state.pendingResponse)return;
 const el=event.target;
 if(el.matches('[data-reason], [data-custom-detail]')){
  state.details??={};const d=state.details[key()]??={selected:[],custom:''};
  if(el.matches('[data-reason]'))d.selected=Array.from(document.querySelectorAll('[data-reason]:checked'),c=>c.dataset.reason);
  else d.custom=el.value;
  persist();return;
 }
 if(['TEXTAREA','INPUT'].includes(event.target.tagName)&&!busy&&!state.pendingResponse&&Object.prototype.hasOwnProperty.call(R.fields,event.target.name)){comments[event.target.name]=event.target.value;updateNextBtns(!R.validAnswer(key(),answers[key()])||(step===steps.length-1&&!connected));persist();}});
$('#back').addEventListener('click',()=>{if(step>0&&!busy&&!state.pendingResponse){step--;persist();render(true);}});

function payload(){return R.validate({version:state.version,id:state.id,styleOrder:styles,productOrder:state.productOrder,assignments:state.assignments,answers,...(state.details?{details:state.details}:{}),...(state.artworkRevision?{artworkRevision:state.artworkRevision}:{})});}
function showSuccess(){
 screenObserver.disconnect();document.querySelector('main').classList.remove('screen-comparison');
 $('#survey').innerHTML='<section class="success"><h1 tabindex="-1">Thank you.</h1><p>Your feedback is saved.</p><button id="next-person" type="button" class="send">Start for next person</button></section>';
 $('#next-person').addEventListener('click',()=>{
  try{sessionStorage.removeItem(storageKey);}catch{}
  location.reload();
 });
 $('.progress').hidden=true;$('#step-label').hidden=true;$('#survey h1').focus();window.scrollTo({top:0,behavior:'instant'});
}
$('#survey').addEventListener('submit',async event=>{
 event.preventDefault();const introValid = R.validAnswer('age_bracket', answers.age_bracket) && R.validAnswer('relationship', answers.relationship);
  const isValid = steps[step].kind==='intro' ? introValid : R.validAnswer(key(),answers[key()]);
  if(busy||!isValid)return;
 if(step<steps.length-1){if(state.pendingResponse)return;step++;persist();render(true);return;}
 if(!connected){showError('The response connection is unavailable. Please try again later.');return;}
 let data;try{data=state.pendingResponse||payload();state.pendingResponse=data;persist();}catch{showError('Please choose an option for each question.');return;}
 busy=true;updateNextBtns(true,'Sending…');$('#back').disabled=true;$('#form-error').hidden=true;
 document.querySelectorAll('[data-choice],textarea,input').forEach(el=>el.disabled=true);
 try{await sendResponse(data);state.submitted=true;state.answers={};state.details={};delete state.pendingResponse;persist();showSuccess();}
 catch(error){showError((error&&error.message?error.message+' ':'')+'Could not confirm your response. Your answers are kept here. Please retry; it won’t send a duplicate.');updateNextBtns(false,'Try sending again');}
 finally{busy=false;}
});
function sendResponse(data){return new Promise((resolve,reject)=>{
 const nonce=crypto.randomUUID();const iframe=document.createElement('iframe');iframe.name='survey-submit-'+nonce;iframe.hidden=true;iframe.title='Save survey response';
 const form=document.createElement('form');form.method='POST';form.action=endpoint;form.target=iframe.name;form.hidden=true;
 for(const [key,value] of Object.entries({payload:JSON.stringify(data),nonce,origin:location.origin})){const input=document.createElement('input');input.name=key;input.value=value;form.append(input);}
 const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',receive);form.remove();iframe.remove();};
 const receive=event=>{let host;try{host=new URL(event.origin).hostname;}catch{return;}const trusted=event.origin.startsWith('https://')&&(host==='script.google.com'||host==='script.googleusercontent.com'||host.endsWith('-script.googleusercontent.com'));const m=event.data;
  if(!trusted||!m||m.type!=='ux-survey-saved'||m.nonce!==nonce||m.id!==data.id)return;
  cleanup();m.ok===true?resolve():reject(Error(m.error||'Save rejected.'));
 };
 const timer=setTimeout(()=>{cleanup();reject(Error('Confirmation timed out.'));},45000);
 window.addEventListener('message',receive);document.body.append(iframe,form);form.submit();
});}
render();
