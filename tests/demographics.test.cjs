const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const rulesCode = fs.readFileSync(path.resolve(__dirname, '../dist/rules-v3.js'), 'utf8');
const appCode = fs.readFileSync(path.resolve(__dirname, '../dist/app-v3.js'), 'utf8');

// Load SurveyRulesV3 in sandbox context
const ctx = {};
vm.runInNewContext(rulesCode, ctx);
const SurveyRulesV3 = ctx.SurveyRulesV3;

test('Welcome screen has zero text input fields for name and includes trust badge', () => {
  // Ensure respondent_name text input has been completely removed from intro screen
  assert.equal(appCode.includes('id="respondent_name"'), false);
  assert.equal(appCode.includes('name="respondent_name"'), false);
  assert.equal(appCode.includes('class="name-field"'), false);
  
  // Verify trust badge exists
  assert.ok(appCode.includes('class="trust-badge"'));
  assert.ok(appCode.includes('100% Anonymous'));
  assert.ok(appCode.includes('No personal data'));
});

test('Demographic selectors are defined with exact expected options', () => {
  assert.deepEqual(Array.from(SurveyRulesV3.fields.age_bracket), ['under_25', '25_34', '35_49', '50_plus']);
  assert.deepEqual(Array.from(SurveyRulesV3.fields.relationship), ['icici_bank_customer', 'bank_team', 'agency_team', 'other_bank']);
  assert.deepEqual(Array.from(SurveyRulesV3.fields.client_os), ['ios', 'android', 'desktop', 'other']);
  assert.equal(SurveyRulesV3.fields.respondent_name, undefined);
});

test('Passive OS detection correctly identifies iOS, Android, and Desktop', () => {
  // Extract detectClientOS function from appCode
  const fnMatch = appCode.match(/function detectClientOS\(\)\s*\{[\s\S]*?\n\}/);
  assert.ok(fnMatch, 'detectClientOS function found');
  const detectClientOS = new Function('navigator', 'window', fnMatch[0] + '; return detectClientOS();');

  assert.equal(detectClientOS({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' }, {}), 'ios');
  assert.equal(detectClientOS({ userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S901B)' }, {}), 'android');
  assert.equal(detectClientOS({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }, {}), 'desktop');
  assert.equal(detectClientOS({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, {}), 'desktop');
  assert.equal(detectClientOS({ userAgent: 'CustomUnknownBrowser/1.0' }, {}), 'other');
});

test('Demographic validation passes valid selections and rejects invalid values', () => {
  assert.equal(SurveyRulesV3.validAnswer('age_bracket', 'under_25'), true);
  assert.equal(SurveyRulesV3.validAnswer('age_bracket', '25_34'), true);
  assert.equal(SurveyRulesV3.validAnswer('age_bracket', 'invalid_age'), false);

  assert.equal(SurveyRulesV3.validAnswer('relationship', 'icici_bank_customer'), true);
  assert.equal(SurveyRulesV3.validAnswer('relationship', 'bank_team'), true);
  assert.equal(SurveyRulesV3.validAnswer('relationship', 'agency_team'), true);
  assert.equal(SurveyRulesV3.validAnswer('relationship', 'other_bank'), true);
  assert.equal(SurveyRulesV3.validAnswer('relationship', 'random_person'), false);

  assert.equal(SurveyRulesV3.validAnswer('client_os', 'ios'), true);
  assert.equal(SurveyRulesV3.validAnswer('client_os', 'android'), true);
  assert.equal(SurveyRulesV3.validAnswer('client_os', 'blackberry'), false);
});

test('Full survey submission payload conforms to SurveyRulesV3.validate()', () => {
  const answers = Object.fromEntries(Object.entries(SurveyRulesV3.fields).map(([k, v]) => [k, typeof v === 'number' ? '' : v[0]]));
  answers.recommendation = 'depends';
  answers.age_bracket = '25_34';
  answers.relationship = 'icici_bank_customer';
  answers.client_os = 'desktop';

  const payload = {
    version: SurveyRulesV3.version,
    id: '01234567-89ab-4cde-8fab-0123456789ab',
    styleOrder: ['without_plinth', 'flat_2d', 'with_plinth'],
    productOrder: Array.from(SurveyRulesV3.products),
    assignments: Object.fromEntries(SurveyRulesV3.products.map(p => [p, Array.from(SurveyRulesV3.styles)])),
    answers
  };

  assert.doesNotThrow(() => SurveyRulesV3.validate(payload));

  // Reject if age_bracket or relationship missing
  const invalidPayload = JSON.parse(JSON.stringify(payload));
  invalidPayload.answers.age_bracket = 'invalid';
  assert.throws(() => SurveyRulesV3.validate(invalidPayload));
});
