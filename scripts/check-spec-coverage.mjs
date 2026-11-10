#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SPECS = path.join(ROOT, "specs");
const reservedFolders = new Set(["_foundation", "_templates"]);

function walkMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "_templates" ? [] : walkMarkdown(fullPath);
    }
    return entry.name.endsWith(".md") ? [fullPath] : [];
  });
}

function inventoryIds(filePath, prefix, digits) {
  const pattern = new RegExp(`^\\|\\s*(${prefix}-[A-Z0-9]+-\\d{${digits}})\\s*\\|`);
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .flatMap((line) => {
      const match = line.match(pattern);
      return match ? [match[1]] : [];
    });
}

function idsInSpecs(files, prefix, digits) {
  const pattern = new RegExp(`\\b${prefix}-[A-Z0-9]+-\\d{${digits}}\\b`, "g");
  const found = new Set();
  for (const file of files) {
    for (const match of fs.readFileSync(file, "utf8").matchAll(pattern)) {
      found.add(match[0]);
    }
  }
  return found;
}

function printMissing(label, ids) {
  if (ids.length === 0) return;
  console.error(`${label} missing (${ids.length}): ${ids.join(", ")}`);
}

const featureInventory = path.join(ROOT, "docs/design-context/01-feature-inventory.md");
const screenInventory = path.join(ROOT, "docs/design-context/02-screen-inventory.md");
const featureIds = [...new Set(inventoryIds(featureInventory, "F", 3))].sort();
const screenIds = [...new Set(inventoryIds(screenInventory, "S", 2))].sort();
const markdownFiles = walkMarkdown(SPECS);
const featureCoverage = idsInSpecs(markdownFiles, "F", 3);
const screenCoverage = idsInSpecs(markdownFiles, "S", 2);
const missingFeatures = featureIds.filter((id) => !featureCoverage.has(id));
const missingScreens = screenIds.filter((id) => !screenCoverage.has(id));

const moduleFolders = fs
  .readdirSync(SPECS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !reservedFolders.has(entry.name));
const incompleteModules = [];
for (const module of moduleFolders) {
  for (const side of ["be", "fe"]) {
    const folder = path.join(SPECS, module.name, side);
    const hasMarkdown = fs.existsSync(folder) &&
      fs.readdirSync(folder, { withFileTypes: true }).some((entry) =>
        entry.isFile() && entry.name.endsWith(".md")
      );
    if (!hasMarkdown) incompleteModules.push(`${module.name}/${side}`);
  }
}

const oversizedSpecs = markdownFiles
  .filter((file) => file.startsWith(`${SPECS}${path.sep}`))
  .filter((file) => {
    const relative = path.relative(SPECS, file).split(path.sep);
    if (reservedFolders.has(relative[0])) return false;
    return fs.readFileSync(file, "utf8").split(/\r?\n/).length > 400;
  })
  .map((file) => path.relative(ROOT, file).split(path.sep).join("/"));

console.log(`Features covered: ${featureIds.length - missingFeatures.length}/${featureIds.length}`);
console.log(`Screens covered: ${screenIds.length - missingScreens.length}/${screenIds.length}`);
console.log(`Module BE/FE specs complete: ${moduleFolders.length * 2 - incompleteModules.length}/${moduleFolders.length * 2}`);
console.log(`Module specs over 400 lines: ${oversizedSpecs.length}`);

printMissing("Feature IDs", missingFeatures);
printMissing("Screen IDs", missingScreens);
if (incompleteModules.length) console.error(`Missing module specs: ${incompleteModules.join(", ")}`);
if (oversizedSpecs.length) console.error(`Oversized module specs: ${oversizedSpecs.join(", ")}`);

if (missingFeatures.length || missingScreens.length || incompleteModules.length || oversizedSpecs.length) {
  process.exitCode = 1;
}
