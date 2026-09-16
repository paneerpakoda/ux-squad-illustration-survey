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
