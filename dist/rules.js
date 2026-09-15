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
