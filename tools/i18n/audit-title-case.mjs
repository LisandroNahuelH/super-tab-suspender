import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveExtensionName } from "./manifest-store-copy.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const localesRoot = join(repoRoot, "public", "_locales");

const locales = readdirSync(localesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
  .map((entry) => entry.name)
  .sort();

const issues = [];

for (const locale of locales) {
  const messagesPath = join(localesRoot, locale, "messages.json");
  const catalog = JSON.parse(readFileSync(messagesPath, "utf8"));
  const actual = catalog.extensionName?.message;
  const expected = resolveExtensionName(locale);

  if (typeof actual !== "string") {
    issues.push(`[${locale}] missing extensionName.message`);
    continue;
  }

  if (actual !== expected) {
    issues.push(`[${locale}] extensionName title-case mismatch\n  actual:   ${actual}\n  expected: ${expected}`);
  }
}

if (issues.length > 0) {
  console.error("Title-case audit failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Title-case audit passed for ${locales.length} locale(s).`);
