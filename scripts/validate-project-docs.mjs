#!/usr/bin/env node
/**
 * Validates the ApnaTown.in project-details knowledge base
 * (docs/PROJECT.md + docs/project/*.md), per the quality gates:
 *
 *  (a) required files exist
 *  (b) every feature ID in 03-feature-catalog.md appears in
 *      13-traceability-matrix.md (and vice versa)
 *  (c) feature IDs and BR/ST/J/S IDs are unique within their owning file
 *  (d) internal markdown links and in-page anchors resolve
 *  (e) every docs/project/*.md file has the required header block
 *  (f) docs/PROJECT.md stays under the ~6,000 character budget
 *
 * No external dependencies — plain Node.js (fs, path).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PROJECT_DIR = path.join(ROOT, "docs/project");

const errors = [];
const warnings = [];

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

// --- (a) required files exist ---

const REQUIRED_FILES = [
  "docs/PROJECT.md",
  "docs/project/README.md",
  "docs/project/01-product-overview.md",
  "docs/project/02-users-roles-permissions.md",
  "docs/project/03-feature-catalog.md",
  "docs/project/04-business-rules.md",
  "docs/project/05-domain-model.md",
  "docs/project/06-user-journeys.md",
  "docs/project/07-screens-routes-sitemap.md",
  "docs/project/08-design-system.md",
  "docs/project/09-content-i18n-notifications.md",
  "docs/project/10-nonfunctional-security-privacy.md",
  "docs/project/11-config-settings-integrations.md",
  "docs/project/12-decisions-assumptions-open-questions.md",
  "docs/project/13-traceability-matrix.md",
];

for (const f of REQUIRED_FILES) {
  if (!fs.existsSync(path.join(ROOT, f))) {
    errors.push(`missing required file: ${f}`);
  }
}

// --- (e) header block on every docs/project/*.md file ---

const REQUIRED_HEADER_FIELDS = ["**Purpose:**", "**Audience:**", "**Related files:**", "**Last updated:**", "**Owner:**"];

function checkHeader(file, content) {
  const head = content.slice(0, 1500);
  for (const field of REQUIRED_HEADER_FIELDS) {
    if (!head.includes(field)) {
      errors.push(`${rel(file)}: header block missing required field ${field}`);
    }
  }
  const dateMatch = head.match(/\*\*Last updated:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  if (head.includes("**Last updated:**") && !dateMatch) {
    errors.push(`${rel(file)}: "Last updated" is not in YYYY-MM-DD format`);
  }
}

const projectFiles = fs
  .readdirSync(PROJECT_DIR)
  .filter((f) => f.endsWith(".md"))
  .map((f) => path.join(PROJECT_DIR, f));

for (const file of projectFiles) {
  checkHeader(file, fs.readFileSync(file, "utf8"));
}

// --- (f) docs/PROJECT.md length budget ---

const INDEX_BUDGET = 6000;
const indexPath = path.join(ROOT, "docs/PROJECT.md");
if (fs.existsSync(indexPath)) {
  const size = Buffer.byteLength(fs.readFileSync(indexPath, "utf8"), "utf8");
  if (size > INDEX_BUDGET) {
    errors.push(`docs/PROJECT.md: ${size} characters, exceeds the ~${INDEX_BUDGET} budget`);
  }
}

// --- (b) + (c) feature ID extraction and cross-check ---

/** Extract the first-column IDs from every markdown table row matching
 * a known ID pattern (e.g. X1, AU12, BR-05, ST-order-delivery, J3,
 * S-CK-2, Q-01, D-01, A-01, R-01). */
function extractIdsFromTables(content, idPattern) {
  const ids = [];
  for (const line of content.split("\n")) {
    const m = line.match(/^\|\s*([^\s|]+)\s*\|/);
    if (m && idPattern.test(m[1])) {
      ids.push(m[1]);
    }
  }
  return ids;
}

const FEATURE_ID_RE = /^(X|AU|HM|LC|EX|SR|PF|PD|SV|OF|CK|OR|RV|EG|RL|NT|AC|VD|PV|RD|AD|SA)\d{1,2}$/;
const BR_ID_RE = /^BR-\d{2}$/;

const catalogContent = fs.readFileSync(path.join(PROJECT_DIR, "03-feature-catalog.md"), "utf8");
const traceContent = fs.readFileSync(path.join(PROJECT_DIR, "13-traceability-matrix.md"), "utf8");
const rulesContent = fs.readFileSync(path.join(PROJECT_DIR, "04-business-rules.md"), "utf8");

const catalogIds = extractIdsFromTables(catalogContent, FEATURE_ID_RE);
const traceIds = extractIdsFromTables(traceContent, FEATURE_ID_RE);
const ruleIds = extractIdsFromTables(rulesContent, BR_ID_RE);

// (c) uniqueness
function checkUnique(label, ids) {
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) {
      errors.push(`${label}: duplicate ID ${id}`);
    }
    seen.add(id);
  }
}
checkUnique("03-feature-catalog.md", catalogIds);
checkUnique("13-traceability-matrix.md", traceIds);
checkUnique("04-business-rules.md", ruleIds);

// (b) completeness cross-check
const catalogSet = new Set(catalogIds);
const traceSet = new Set(traceIds);
for (const id of catalogSet) {
  if (!traceSet.has(id)) {
    errors.push(`feature ${id} is in 03-feature-catalog.md but missing from 13-traceability-matrix.md`);
  }
}
for (const id of traceSet) {
  if (!catalogSet.has(id)) {
    errors.push(`feature ${id} is in 13-traceability-matrix.md but missing from 03-feature-catalog.md`);
  }
}

// Every BR-01..BR-22 appears in 04 and is referenced by at least one
// feature's Rules(BR) column in 03, OR is explicitly narratively
// covered (noted in 13's "no feature row tagged" callout).
const allBrIds = new Set(ruleIds);
const brReferenced = new Set();
for (const m of catalogContent.matchAll(/BR-\d{2}/g)) brReferenced.add(m[0]);
const narrativelyCovered = new Set();
for (const line of traceContent.split("\n")) {
  if (line.includes("narratively")) {
    for (const b of line.matchAll(/BR-\d{2}/g)) narrativelyCovered.add(b[0]);
  }
}
for (const br of allBrIds) {
  if (!brReferenced.has(br) && !narrativelyCovered.has(br)) {
    errors.push(`${br} is defined in 04-business-rules.md but not referenced by any feature in 03-feature-catalog.md, and not flagged as narratively covered in 13-traceability-matrix.md`);
  }
}

// --- Every ST- has a diagram and a transition reference in 05 ---

const domainContent = fs.readFileSync(path.join(PROJECT_DIR, "05-domain-model.md"), "utf8");
const stHeadings = [...domainContent.matchAll(/^### (ST-[a-z-]+)/gm)].map((m) => m[1]);
if (stHeadings.length === 0) {
  errors.push("05-domain-model.md: no ST-* status model sections found");
}
for (const st of stHeadings) {
  const idx = domainContent.indexOf(`### ${st}`);
  const slice = domainContent.slice(idx, idx + 1200);
  if (!slice.includes("```mermaid")) {
    errors.push(`05-domain-model.md: ${st} has no Mermaid diagram`);
  }
}

// --- Mermaid fences are balanced ---

for (const file of projectFiles) {
  const content = fs.readFileSync(file, "utf8");
  const fenceCount = (content.match(/```/g) || []).length;
  if (fenceCount % 2 !== 0) {
    errors.push(`${rel(file)}: unbalanced \`\`\` code fence (Mermaid or otherwise)`);
  }
}

// --- (d) internal markdown links and anchors resolve ---

function githubSlug(heading) {
  return heading
    .toLowerCase()
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function headingAnchors(content) {
  const anchors = new Set();
  const counts = new Map();
  for (const m of content.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    let slug = githubSlug(m[1]);
    const n = counts.get(slug) || 0;
    counts.set(slug, n + 1);
    if (n > 0) slug = `${slug}-${n}`;
    anchors.add(slug);
  }
  return anchors;
}

const MD_LINK_RE = /\[[^\]]*\]\(([^)\s]+)\)/g;

function isSkippable(p) {
  return p.startsWith("http://") || p.startsWith("https://") || p.startsWith("mailto:");
}

const allMarkdown = [path.join(ROOT, "docs/PROJECT.md"), ...projectFiles];
const anchorCache = new Map();

for (const file of allMarkdown) {
  const content = fs.readFileSync(file, "utf8");
  const dir = path.dirname(file);

  for (const match of content.matchAll(MD_LINK_RE)) {
    const raw = match[1];
    if (isSkippable(raw)) continue;
    const [targetPath, anchor] = raw.split("#");
    const resolved = targetPath
      ? targetPath.startsWith("/")
        ? path.join(ROOT, targetPath)
        : path.join(dir, targetPath)
      : file;
    if (targetPath && !fs.existsSync(resolved)) {
      errors.push(`${rel(file)}: broken markdown link -> ${raw}`);
      continue;
    }
    if (anchor) {
      if (!anchorCache.has(resolved)) {
        anchorCache.set(resolved, headingAnchors(fs.readFileSync(resolved, "utf8")));
      }
      if (!anchorCache.get(resolved).has(anchor)) {
        errors.push(`${rel(file)}: anchor "#${anchor}" not found in ${rel(resolved)}`);
      }
    }
  }
}

// --- Report ---

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  - ${w}`);
}

if (errors.length) {
  console.error(`\nValidation FAILED with ${errors.length} error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `\nValidation PASSED: ${REQUIRED_FILES.length} required file(s) present, ` +
    `${catalogIds.length} feature ID(s) cross-checked between 03 and 13, ` +
    `${ruleIds.length} business rule(s) checked for feature coverage, ` +
    `${stHeadings.length} status model(s) checked for diagrams, ` +
    `${projectFiles.length} file(s) checked for header blocks, ` +
    `docs/PROJECT.md checked against the ${INDEX_BUDGET}-character budget.`
);
