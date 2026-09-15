const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function page(){
 const nodes=new Map();const drafts=new Map();let images=[{complete:true,naturalWidth:512}];
 function node(selector){if(!nodes.has(selector))nodes.set(selector,{hidden:false,disabled:false,innerHTML:'',style:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},focus(){},setAttribute(){}});return nodes.get(selector);}
 const ctx=vm.createContext({URL,crypto:require('node:crypto').webcrypto,console,document:{querySelector:node,querySelectorAll:selector=>selector.includes(' img')?images:[]},sessionStorage:{getItem:key=>drafts.get(key)||null,setItem:(key,value)=>drafts.set(key,value)},setTimeout,clearTimeout});
 ctx.window=ctx;ctx.scrollTo=()=>{};ctx.SURVEY_CONFIG={endpoint:'https://script.google.com/macros/s/test/exec'};
 vm.runInContext(fs.readFileSync(path.join(root,'dist/rules.js'),'utf8'),ctx);
 vm.runInContext(fs.readFileSync(path.join(root,'dist/app.js'),'utf8'),ctx);
 return {ctx,node,state:()=>JSON.parse(vm.runInContext('JSON.stringify(state)',ctx)),setImages:value=>{images=value;}};
}
test('one tap answers the first product and moves straight to the second',()=>{const p=page();const first=p.state().productOrder[0];p.ctx.selectChoice('with_plinth');assert.equal(p.state().step,1);assert.equal(p.state().answers[first+'_preference'],'with_plinth');});
test('third choice selects a recommendation without submitting it',()=>{const p=page();p.ctx.selectChoice('none');p.ctx.selectChoice('no_preference');p.ctx.selectChoice('depends');assert.equal(p.state().step,2);assert.equal(p.state().submitted,false);assert.equal(p.state().answers.overall,'depends');assert.equal(p.node('#next').hidden,false);assert.equal(p.node('#next').disabled,false);});
test('Back keeps earlier choices and supports changing them',()=>{const p=page();p.ctx.selectChoice('flat_2d');const key=p.state().productOrder[0]+'_preference';p.node('#back').listeners.click();assert.equal(p.state().step,0);assert.equal(p.state().answers[key],'flat_2d');p.ctx.selectChoice('without_plinth');assert.equal(p.state().answers[key],'without_plinth');assert.equal(p.state().step,1);});
test('missing artwork prevents recording a blind vote',()=>{const p=page();p.setImages([{complete:true,naturalWidth:0}]);p.ctx.selectChoice('flat_2d');assert.equal(p.state().step,0);assert.equal(p.node('#form-error').hidden,false);});
test('an optional comment is included unchanged in the final response',()=>{const p=page();p.ctx.selectChoice('flat_2d');p.ctx.selectChoice('none');p.ctx.selectChoice('no_preference');p.node('#survey').listeners.input({target:{name:'improvements',value:'Please reduce the background detail.'}});assert.equal(p.ctx.payload().answers.improvements,'Please reduce the background detail.');});
test('an unconfirmed submission locks choices and Back for a safe retry',()=>{const p=page();p.ctx.selectChoice('flat_2d');p.ctx.selectChoice('none');p.ctx.selectChoice('depends');vm.runInContext('state.pendingResponse=payload()',p.ctx);p.ctx.selectChoice('with_plinth');p.node('#back').listeners.click();assert.equal(p.state().step,2);assert.equal(p.state().answers.overall,'depends');});
