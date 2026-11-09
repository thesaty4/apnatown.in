#!/usr/bin/env node
/**
 * Validates the AI development lifecycle setup for ApnaTown.in.
 *
 * Checks:
 *  (a) every instruction/agent/skill/prompt file with front matter parses
 *  (b) every skill's `name` equals its folder name
 *  (c) copilot-instructions.md and every *.instructions.md stay under the
 *      4,000 character budget
 *  (d) every file path referenced via a markdown link or an obvious
 *      file-path code span resolves to a real file
 *  (e) markdown links (internal, non-anchor) resolve
 *
 * No external dependencies — plain Node.js (fs, path).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const errors = [];
const warnings = [];

function walk(dir, exts) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full, exts));
    } else if (!exts || exts.some((e) => entry.name.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

/** Minimal front-matter parser: scalar strings, quoted strings, and
 * bracketed lists ([a, b, c]). Good enough for this repo's needs. */
function parseFrontMatter(content, filePath) {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
    return null;
  }
  const end = content.indexOf("\n---", 4);
  if (end === -1) {
    errors.push(`${rel(filePath)}: front matter opened with '---' but never closed`);
    return null;
  }
  const raw = content.slice(content.indexOf("\n") + 1, end);
  const data = {};
  let currentKey = null;
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const match = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!match) {
      if (currentKey && /^\s*-\s+/.test(line)) {
        // simple YAML list item under a key
        const item = line.replace(/^\s*-\s+/, "").trim();
        if (!Array.isArray(data[currentKey])) data[currentKey] = [];
        data[currentKey].push(stripQuotes(item));
        continue;
      }
      errors.push(`${rel(filePath)}: could not parse front matter line: ${JSON.stringify(line)}`);
      continue;
    }
    const [, key, valueRaw] = match;
    currentKey = key;
    let value = valueRaw.trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((v) => stripQuotes(v.trim()))
        .filter(Boolean);
    } else {
      value = stripQuotes(value);
    }
    data[key] = value;
  }
  return data;
}

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// --- (a) + (b) front matter parsing and skill-name-matches-folder ---

const instructionFiles = walk(path.join(ROOT, ".github/instructions"), [".instructions.md"]);
const agentFiles = walk(path.join(ROOT, ".github/agents"), [".agent.md"]);
const skillFiles = walk(path.join(ROOT, ".github/skills")).filter((f) => f.endsWith("SKILL.md"));
const promptFiles = walk(path.join(ROOT, ".github/prompts"), [".prompt.md"]);

for (const file of instructionFiles) {
  const content = fs.readFileSync(file, "utf8");
  const fm = parseFrontMatter(content, file);
  if (!fm) {
    errors.push(`${rel(file)}: missing or unparsable front matter`);
    continue;
  }
  if (!fm.applyTo) {
    errors.push(`${rel(file)}: front matter missing required 'applyTo'`);
  }
}

for (const file of agentFiles) {
  const content = fs.readFileSync(file, "utf8");
  const fm = parseFrontMatter(content, file);
  if (!fm) {
    errors.push(`${rel(file)}: missing or unparsable front matter`);
    continue;
  }
  for (const key of ["name", "description", "tools"]) {
    if (!fm[key]) errors.push(`${rel(file)}: front matter missing required '${key}'`);
  }
}

for (const file of skillFiles) {
  const content = fs.readFileSync(file, "utf8");
  const fm = parseFrontMatter(content, file);
  if (!fm) {
    errors.push(`${rel(file)}: missing or unparsable front matter`);
    continue;
  }
  if (!fm.name) {
    errors.push(`${rel(file)}: front matter missing required 'name'`);
  } else {
    const folderName = path.basename(path.dirname(file));
    if (fm.name !== folderName) {
      errors.push(
        `${rel(file)}: skill name '${fm.name}' does not match its folder name '${folderName}'`
      );
    }
  }
  if (!fm.description) {
    errors.push(`${rel(file)}: front matter missing required 'description'`);
  }
}

for (const file of promptFiles) {
  const content = fs.readFileSync(file, "utf8");
  const fm = parseFrontMatter(content, file);
  if (!fm) {
    errors.push(`${rel(file)}: missing or unparsable front matter`);
    continue;
  }
  if (!fm.description) {
    errors.push(`${rel(file)}: front matter missing required 'description'`);
  }
}

// --- (c) 4,000-character budget ---

const budgetFiles = [
  path.join(ROOT, ".github/copilot-instructions.md"),
  ...instructionFiles,
];
const CHAR_BUDGET = 4000;
for (const file of budgetFiles) {
  if (!fs.existsSync(file)) {
    errors.push(`${rel(file)}: expected file does not exist`);
    continue;
  }
  const size = Buffer.byteLength(fs.readFileSync(file, "utf8"), "utf8");
  if (size >= CHAR_BUDGET) {
    errors.push(`${rel(file)}: ${size} characters, exceeds the ${CHAR_BUDGET} budget`);
  }
}

// --- (d) + (e) referenced file paths and markdown links resolve ---

const allMarkdown = [
  ...walk(path.join(ROOT, "docs")),
  ...walk(path.join(ROOT, ".github")),
  ...walk(path.join(ROOT, "specs")),
  path.join(ROOT, "AGENTS.md"),
  path.join(ROOT, "README.md"),
  path.join(ROOT, "SECURITY.md"),
].filter((f) => f.endsWith(".md") || f.endsWith(".yml"));

const MD_LINK_RE = /\[[^\]]*\]\(([^)\s]+)\)/g;
// Inline code spans that look like a repo-relative file path (not a glob,
// not a placeholder like <module>, not a template path under _templates
// that intentionally uses <angle-bracket> placeholders).
const CODE_PATH_RE = /`([a-zA-Z0-9._/-]+\.(?:md|mjs|yml|yaml|json))`/g;

function isSkippable(p) {
  return (
    p.startsWith("http://") ||
    p.startsWith("https://") ||
    p.startsWith("mailto:") ||
    p.startsWith("#") ||
    p.includes("<") ||
    p.includes("*") ||
    p.includes(":param") ||
    p.includes(":slug") ||
    p.includes(":id")
  );
}

for (const file of allMarkdown) {
  const content = fs.readFileSync(file, "utf8");
  const dir = path.dirname(file);

  for (const match of content.matchAll(MD_LINK_RE)) {
    const target = match[1].split("#")[0];
    if (!target || isSkippable(target)) continue;
    const resolved = target.startsWith("/") ? path.join(ROOT, target) : path.join(dir, target);
    if (!fs.existsSync(resolved)) {
      errors.push(`${rel(file)}: broken markdown link -> ${target}`);
    }
  }

  for (const match of content.matchAll(CODE_PATH_RE)) {
    const target = match[1];
    if (isSkippable(target)) continue;
    // Only check paths that look like they start from the repo root
    // (contain at least one "/" and a known top-level folder) to avoid
    // false positives on prose that happens to look path-like.
    const topLevel = target.split("/")[0];
    const knownRoots = ["docs", "specs", ".github", "scripts", "apps", "packages"];
    if (!knownRoots.includes(topLevel)) continue;
    const resolved = path.join(ROOT, target);
    if (!fs.existsSync(resolved)) {
      warnings.push(`${rel(file)}: referenced path not found -> ${target}`);
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
  `\nValidation PASSED: ${instructionFiles.length} instruction file(s), ` +
    `${agentFiles.length} agent file(s), ${skillFiles.length} skill file(s), ` +
    `${promptFiles.length} prompt file(s), ${budgetFiles.length} file(s) checked ` +
    `against the ${CHAR_BUDGET}-character budget, ${allMarkdown.length} markdown/yaml ` +
    `file(s) scanned for broken links.${warnings.length ? ` (${warnings.length} warning(s))` : ""}`
);
