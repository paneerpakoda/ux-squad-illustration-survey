var SurveyRulesV3 = (function(){
 'use strict';
 const version='ux-illustrations-2026-09-v3';
 const styles=['with_plinth','without_plinth','flat_2d'];
 const products=['home','personal','car','education','rupay','two_wheeler'];
 const choices=[...styles,'no_preference','none'];
 const fields={respondent_name:100,...Object.fromEntries(products.map(p=>[p+'_preference',choices]))};
 Object.assign(fields,{home_clarity:[...styles,'equal','none'],two_wheeler_clarity:[...styles,'equal','none'],screen:choices,consistency:[...styles,'equal','none'],recommendation:[...choices,'depends'],home_reason:1500,two_wheeler_reason:1500,reason:1500,changes:1500});
 const detailQuestions=[...products.map(p=>p+'_preference'),'home_clarity','two_wheeler_clarity','screen','consistency','recommendation'];
 const detailLabels={recognition:'Product recognition',clarity:'Visual clarity',simplicity:'Simplicity / amount of detail',colour:'Colours and contrast',perspective:'Composition and viewing angle',brand:'Fit with the bank’s visual style',personal:'Personal preference',small_size:'Legibility at this size',silhouette:'Shape and silhouette',ui_fit:'Fit with the surrounding UI',prominence:'Visual prominence',consistency:'Consistency across products',flexibility:'Suitability across different products'};
 const detailOptions=Object.fromEntries(detailQuestions.map(k=>[k,k.endsWith('_clarity')?['small_size','silhouette','colour','simplicity','recognition']:k==='screen'?['ui_fit','prominence','recognition','consistency','colour','brand']:k==='consistency'?['consistency','perspective','colour','simplicity','brand']:k==='recommendation'?['recognition','clarity','brand','consistency','flexibility','personal']:['recognition','clarity','simplicity','colour','perspective','brand','personal']]));
 function validateDetails(details){
  if(!details||typeof details!=='object'||Array.isArray(details)||Object.keys(details).some(k=>!detailQuestions.includes(k)))throw Error('Invalid question details.');
  for(const [k,d] of Object.entries(details)){
   if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).some(k=>!['selected','custom'].includes(k))||!Array.isArray(d.selected)||new Set(d.selected).size!==d.selected.length||d.selected.some(v=>!detailOptions[k].includes(v))||typeof d.custom!=='string'||d.custom.length>1000)throw Error('Invalid question details.');
  }
  return details;
 }
 function validAnswer(k,v){const r=fields[k];if(k==='respondent_name')return typeof v==='string'&&v.trim().length>0&&v.length<=100;return Object.prototype.hasOwnProperty.call(fields,k)&&typeof v==='string'&&(typeof r==='number'?v.length<=r:r.includes(v));}
 function permutation(a,b){return Array.isArray(a)&&a.length===b.length&&new Set(a).size===b.length&&a.every(v=>b.includes(v));}
 function validate(p){
  if(!p||typeof p!=='object'||Array.isArray(p)||p.version!==version)throw Error('Unsupported survey version.');
  if(Object.keys(p).some(k=>!['version','id','styleOrder','productOrder','assignments','answers','details','artworkRevision'].includes(k)))throw Error('Unexpected response field.');
  if(typeof p.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.id))throw Error('Invalid response ID.');
  if(!permutation(p.productOrder,products)||!permutation(p.styleOrder,styles))throw Error('Invalid presentation order.');
  if(!p.assignments||!permutation(Object.keys(p.assignments),products)||products.some(id=>!permutation(p.assignments[id],styles)))throw Error('Invalid product assignments.');
  if(!p.answers||typeof p.answers!=='object'||Array.isArray(p.answers)||Object.keys(p.answers).some(k=>!Object.prototype.hasOwnProperty.call(fields,k)))throw Error('Unexpected answer field.');
  for(const k of Object.keys(fields))if(!validAnswer(k,p.answers[k]))throw Error('Missing or invalid answer: '+k);
  if(p.details!==undefined)validateDetails(p.details);
  if(p.artworkRevision!==undefined&&(typeof p.artworkRevision!=='string'||!/^[a-z0-9-]{1,64}$/.test(p.artworkRevision)))throw Error('Invalid artwork revision.');
  return p;
 }
 function shuffle(a,random){const r=a.slice();for(let i=r.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;}
 return {version,styles,products,choices,fields,detailQuestions,detailLabels,detailOptions,validateDetails,validAnswer,validate,permutation,shuffle};
})();
