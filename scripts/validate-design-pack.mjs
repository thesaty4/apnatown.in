// Validates the Design Context Pack and the Copilot prompts. Run: node scripts/validate-design-pack.mjs
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const dc = path.join(root, 'docs/design-context');
const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8');
let failures = 0;
const fail = (m) => { failures++; console.error('FAIL ' + m); };
const ok = (m) => console.log('ok   ' + m);

const required = ['00-product-summary.md','01-feature-inventory.md','02-screen-inventory.md','03-user-flows.md','04-design-tokens.json','05-design-system.md','06-component-catalogue.md','07-state-machines-and-business-rules.md','08-permissions-matrix.md','09-content-and-i18n.md','09a-i18n-en-hi.json','10-sample-data.json','11-open-issues-and-assumptions.md','README.md'];
for (const f of required) fs.existsSync(path.join(dc, f)) ? null : fail('missing pack file ' + f);
ok('pack files present: ' + required.length);

const feat = rd('docs/design-context/01-feature-inventory.md');
const fIds = [...feat.matchAll(/^\| (F-[A-Z]+-\d{3}) \|/gm)].map((m) => m[1]);
if (new Set(fIds).size !== fIds.length) fail('duplicate feature IDs');
ok('features: ' + fIds.length);
const scr = rd('docs/design-context/02-screen-inventory.md');
const sIds = [...scr.matchAll(/^\| (S-[A-Z]+-\d{2}) \|/gm)].map((m) => m[1]);
if (new Set(sIds).size !== sIds.length) fail('duplicate screen IDs');
ok('screens: ' + sIds.length);
for (const f of fIds) if (!new RegExp('^\\| ' + f + ' \\| S-', 'm').test(scr)) fail('feature without screen mapping: ' + f);
ok('every feature maps to at least one screen');
for (const row of scr.matchAll(/`([md]-[a-z]+-[^`]+\.jpg)`/g)) if (!fs.existsSync(path.join(dc, 'screenshots', row[1]))) fail('missing screenshot ' + row[1]);
ok('referenced screenshots exist');

const tok = JSON.parse(rd('docs/design-context/04-design-tokens.json'));
const css = rd('docs/design-context/reference/prototype-source/style.css');
const cssVars = new Set([...css.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]));
const tokenText = JSON.stringify(tok);
let missingTok = 0;
for (const v of cssVars) if (!tokenText.includes('"' + v + '"') && !['sat','sab','dim'].includes(v)) { missingTok++; console.error('  token missing: ' + v); }
if (missingTok) fail('tokens missing from JSON: ' + missingTok); else ok('all ' + cssVars.size + ' CSS variables present in tokens JSON');

const i18n = JSON.parse(rd('docs/design-context/09a-i18n-en-hi.json'));
if (!i18n.strings.length || i18n.strings.some((s) => !s.en || !s.hi)) fail('i18n file has empty strings'); else ok('i18n strings: ' + i18n.strings.length);

const prompts = fs.readdirSync(path.join(root, 'docs/prompts')).filter((f) => /^(P|C|0)/.test(f) && f.endsWith('.md'));
for (const f of prompts) {
  const t = rd('docs/prompts/' + f);
  for (const must of ['STANDING REQUIREMENTS', 'LONG OUTPUT RULE', 'DONE WHEN']) if (!t.includes(must)) fail(f + ' lacks ' + must);
  if (/Claude Design|design project/i.test(t)) fail(f + ' mentions the design tool');
}
ok('prompts checked: ' + prompts.length);

const ci = rd('.github/copilot-instructions.md');
for (let i = 1; i <= 9; i++) if (!new RegExp('^' + i + '\\. \\*\\*', 'm').test(ci)) fail('copilot-instructions missing item ' + i);
if (ci.length > 4000) fail('copilot-instructions longer than 4000 chars (' + ci.length + ')'); else ok('copilot-instructions length ' + ci.length);

console.log(failures ? `\n${failures} failure(s)` : '\nDesign pack validation PASSED');
process.exit(failures ? 1 : 0);
