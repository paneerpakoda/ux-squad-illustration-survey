const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'dist/rules.js'),'utf8'),context);
const rules=context.SurveyRules;
function response(){
 const answers={home_preference:'with_plinth',personal_preference:'none',overall:'depends',improvements:''};
 return {version:rules.version,id:'01234567-89ab-4cde-8fab-0123456789ab',styleOrder:['flat_2d','without_plinth','with_plinth'],productOrder:['personal','home'],answers};
}
test('complete response retains real style identifiers independent of A/B/C order',()=>{assert.equal(rules.validate(response()).answers.home_preference,'with_plinth')});
test('incomplete response is rejected instead of recording default votes',()=>{const p=response();delete p.answers.home_preference;assert.throws(()=>rules.validate(p))});
test('no preference, none and depends remain distinct',()=>{const p=response();p.answers.home_preference='no_preference';assert.equal(rules.validate(p).answers.home_preference,'no_preference');assert.equal(rules.validate(p).answers.overall,'depends')});
test('unknown style is rejected',()=>{const p=response();p.answers.home_preference='unknown_style';assert.throws(()=>rules.validate(p))});
test('duplicate style order is rejected',()=>{const p=response();p.styleOrder=['flat_2d','flat_2d','with_plinth'];assert.throws(()=>rules.validate(p))});
test('long and unexpected fields are rejected',()=>{const p=response();p.answers.improvements='x'.repeat(1501);assert.throws(()=>rules.validate(p));p.answers.improvements='';p.answers.email='private@example.com';assert.throws(()=>rules.validate(p))});
test('unknown survey versions are rejected',()=>{const p=response();p.version='wrong';assert.throws(()=>rules.validate(p))});
test('shuffle returns each entry once and does not alter the input',()=>{const values=['a','b','c'];assert.equal(new Set(rules.shuffle(values,()=>.5)).size,3);assert.deepEqual(values,['a','b','c'])});
module.exports={response,rules,root};
