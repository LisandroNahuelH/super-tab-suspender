import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const HTML_TARGETS = ["popup.html", "suspended.html"];
const TS_TARGETS = [
  "src/popup.ts",
  "src/suspended.ts",
  "src/background.ts",
  "src/content.ts"
];

const ALLOWED_TS_PATTERNS = [
  /^console\.(warn|error|log|info)\(/,
  /^throw new Error\(/,
  /^new Error\(/,
  /^`Missing element:/,
  /^"Missing element:/,
  /^`https:\/\//,
  /^"https:\/\//,
  /^"http:\/\//,
  /^'http:\/\//,
  /^"suspend-/,
  /^'suspend-/,
  /^"autoSuspend/,
  /^'autoSuspend/,
  /^"page-/,
  /^'page-/,
  /^"get-/,
  /^'get-/,
  /^"[a-z]+-[a-z-]+"/,
  /^'[a-z]+-[a-z-]+'/
];

const issues = [];

function auditHtml(relativePath) {
  const source = readFileSync(resolve(repoRoot, relativePath), "utf8");
  const titleMatch = source.match(/<title>([\s\S]*?)<\/title>/i);

  if (titleMatch?.[1]?.trim()) {
    issues.push(`${relativePath} contains a hardcoded <title>.`);
  }

  if (/\slang="/.test(source)) {
    issues.push(`${relativePath} contains a hardcoded html lang attribute.`);
  }

  const textPattern = />\s*([^<\s][^<]*[A-Za-zÀ-ÿ][^<]*)\s*</g;
  for (const match of source.matchAll(textPattern)) {
    const text = match[1].trim();
    if (text.length > 0) {
      issues.push(`${relativePath} contains hardcoded HTML text: "${text}".`);
    }
  }

  const attributePattern =
    /\s(?:aria-label|title|placeholder|alt)="([^"]*[A-Za-zÀ-ÿ][^"]*)"/g;
  for (const match of source.matchAll(attributePattern)) {
    const value = match[1].trim();
    if (value.length > 0) {
      issues.push(`${relativePath} contains hardcoded HTML attribute: "${value}".`);
    }
  }
}

function auditTypeScript(relativePath) {
  const source = readFileSync(resolve(repoRoot, relativePath), "utf8");
  const assignmentPattern =
    /\.(?:textContent|innerText|title)\s*=\s*("([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`)/g;

  for (const match of source.matchAll(assignmentPattern)) {
    const literal = match[1];
    const value = literal.slice(1, -1);

    if (value.length === 0) {
      continue;
    }

    if (literal.includes("getMessage(") || value.includes("${")) {
      continue;
    }

    if (ALLOWED_TS_PATTERNS.some((pattern) => pattern.test(literal) || pattern.test(value))) {
      continue;
    }

    if (/^[A-Za-z0-9_./:?#&=%+\-]+$/.test(value) && !/[A-Za-z]{3,}/.test(value)) {
      continue;
    }

    if (!/[A-Za-zÀ-ÿ]/.test(value)) {
      continue;
    }

    issues.push(`${relativePath} assigns visible text without getMessage(): ${literal}`);
  }
}

for (const target of HTML_TARGETS) {
  auditHtml(target);
}

for (const target of TS_TARGETS) {
  auditTypeScript(target);
}

if (issues.length > 0) {
  console.error("i18n literal audit failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(
  `i18n literal audit passed for ${HTML_TARGETS.length + TS_TARGETS.length} file(s).`
);