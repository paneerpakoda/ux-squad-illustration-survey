const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function transport(){
 const elements=[];let listener;let timeout;
 const ctx=vm.createContext({URL,Promise,Error,Object,JSON,crypto:{randomUUID:()=> 'test-nonce'},location:{origin:'https://example.github.io'},endpoint:'https://script.google.com/macros/s/test/exec',document:{createElement(tag){const node={tag,children:[],append(child){this.children.push(child);},remove(){this.removed=true;},submit(){this.sent=true;}};elements.push(node);return node;},body:{append(){}}},window:{addEventListener(type,fn){listener=fn;},removeEventListener(){listener=null;}},setTimeout(fn){timeout=fn;return 1;},clearTimeout(){}});
 const source=fs.readFileSync(path.join(__dirname,'../dist/app-v3.js'),'utf8');
 const start=source.indexOf('function sendResponse(');
 vm.runInContext(source.slice(start,source.indexOf('\nrender();',start)),ctx);
 return {send:()=>ctx.sendResponse({id:'response-id',answers:{overall:'none'}}),ack:(changes={},origin='https://abc-script.googleusercontent.com')=>listener?.({origin,data:{type:'ux-survey-saved',nonce:'test-nonce',id:'response-id',ok:true,...changes}}),expire:()=>timeout(),elements};
}
test('sending the form alone does not report success',async()=>{const t=transport();let done=false;const p=t.send().then(()=>{done=true;});await Promise.resolve();assert.equal(done,false);assert.equal(t.elements.find(e=>e.tag==='form').sent,true);t.ack();await p;assert.equal(done,true);});
test('wrong origin, nonce and response ID cannot confirm a save',async()=>{const t=transport();let done=false;const p=t.send().then(()=>{done=true;});t.ack({},'https://evil.example');t.ack({nonce:'wrong'});t.ack({id:'wrong'});await Promise.resolve();assert.equal(done,false);t.ack();await p;});
test('server failure rejects and removes submission elements',async()=>{const t=transport();const p=t.send();t.ack({ok:false});await assert.rejects(p);assert.equal(t.elements.filter(e=>['iframe','form'].includes(e.tag)).every(e=>e.removed),true);});
test('missing acknowledgment times out instead of reporting success',async()=>{const t=transport();const p=t.send();t.expire();await assert.rejects(p,/timed out/);});
