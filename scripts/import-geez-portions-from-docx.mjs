/**
 * Merge Ge'ez text from Word (.docx) files into public/data/wudase-liturgy.json
 * under portions[Day].sections[0].verses[*].geez
 *
 * Usage:
 *   npm run import-wudase-geez
 *   npm run import-wudase-geez -- --dry-run
 *
 * Env (optional):
 *   WUDASE_DOCX_DIR       — folder to scan (default: %USERPROFILE%/Downloads)
 *   WUDASE_DOCX_MONDAY    — explicit path to Monday.docx (same for TUESDAY … SUNDAY)
 *
 * Saturday is skipped by default (fill manually). Override with --include-saturday
 * if you add WUDASE_DOCX_SATURDAY.
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import mammoth from "mammoth";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const JSON_PATH = path.join(REPO_ROOT, "public", "data", "wudase-liturgy.json");

/** @type {Record<string, { hints?: string[]; skip?: boolean }>} */
const DAY_CONFIG = {
  Monday: { hints: ["ሰኞ"] },
  Tuesday: { hints: ["ስሉስ"] },
  Wednesday: { hints: ["ረቡዕ"] },
  Thursday: { hints: ["ሐሙስ"] },
  Friday: { hints: ["ዓርብ"] },
  Saturday: { skip: true },
  Sunday: { hints: ["ሰንበተ", "ክርስቲያን"] },
};

function defaultDocxDir() {
  return process.env.WUDASE_DOCX_DIR?.trim() || path.join(os.homedir(), "Downloads");
}

function envPathForDay(day) {
  const key = `WUDASE_DOCX_${day.toUpperCase()}`;
  return process.env[key]?.trim();
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function paragraphsFromDocxText(text) {
  return text
    .replace(/\uFEFF/g, "")
    .split(/\r?\n[\s\u00A0]*\r?\n/g)
    .map((p) => p.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim())
    .filter(Boolean);
}

/**
 * @param {string} dir
 * @param {string[]} hints
 * @returns {Promise<string | null>}
 */
async function findDocxByHints(dir, hints) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (e) {
    console.error(`Cannot read directory: ${dir}\n`, e.message);
    return null;
  }
  const docx = entries
    .filter((e) => e.isFile() && /\.docx$/i.test(e.name))
    .map((e) => path.join(dir, e.name));
  const matches = docx.filter((p) => {
    const base = path.basename(p);
    return hints.every((h) => base.includes(h));
  });
  if (matches.length === 0) return null;
  if (matches.length > 1) {
    matches.sort();
    console.warn(`  Multiple matches (${matches.length}), using: ${matches[0]}`);
  }
  return matches[0];
}

/**
 * @param {string} day
 * @returns {Promise<string | null>}
 */
async function resolveDocxPath(day) {
  const explicit = envPathForDay(day);
  if (explicit) {
    try {
      await fs.access(explicit);
      return explicit;
    } catch {
      console.error(`  WUDASE_DOCX_${day.toUpperCase()} not found: ${explicit}`);
      return null;
    }
  }
  const cfg = DAY_CONFIG[day];
  if (!cfg?.hints?.length) return null;
  return findDocxByHints(defaultDocxDir(), cfg.hints);
}

/**
 * @param {string} filePath
 * @returns {Promise<string[]>}
 */
async function extractParagraphs(filePath) {
  const buf = await fs.readFile(filePath);
  const { value, messages } = await mammoth.extractRawText({ buffer: buf });
  if (messages?.length) {
    for (const m of messages) console.warn(`  mammoth: ${m.message}`);
  }
  return paragraphsFromDocxText(value || "");
}

function getPortionVerses(data, day) {
  const portion = data.portions?.[day];
  const verses = portion?.sections?.[0]?.verses;
  if (!Array.isArray(verses)) {
    throw new Error(`Invalid structure: portions.${day}.sections[0].verses`);
  }
  return verses;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const includeSaturday = process.argv.includes("--include-saturday");
  if (includeSaturday) {
    DAY_CONFIG.Saturday = { hints: ["ቀዳም", "ሰንበት"] };
  }

  const raw = await fs.readFile(JSON_PATH, "utf8");
  const data = JSON.parse(raw);

  console.log(`JSON: ${JSON_PATH}`);
  console.log(`Docx folder: ${defaultDocxDir()}\n`);

  let changed = false;
  const errors = [];

  for (const day of Object.keys(DAY_CONFIG)) {
    const cfg = DAY_CONFIG[day];
    if (cfg.skip) {
      console.log(`[${day}] skipped (set WUDASE_DOCX_${day.toUpperCase()} or use --include-saturday)`);
      continue;
    }

    const docxPath = await resolveDocxPath(day);
    if (!docxPath) {
      errors.push(`${day}: no .docx found (hints: ${cfg.hints?.join(", ")})`);
      console.error(`[${day}] ERROR — no matching .docx`);
      continue;
    }

    let paras;
    try {
      paras = await extractParagraphs(docxPath);
    } catch (e) {
      errors.push(`${day}: ${e.message}`);
      console.error(`[${day}] ERROR reading ${docxPath}:`, e.message);
      continue;
    }

    const verses = getPortionVerses(data, day);
    const n = verses.length;
    console.log(`[${day}] ${path.basename(docxPath)} → ${paras.length} paragraph(s), JSON expects ${n} verse(s)`);

    if (paras.length !== n) {
      const msg = `${day}: paragraph count ${paras.length} ≠ verse count ${n} — fix docx breaks or adjust JSON`;
      errors.push(msg);
      console.error(`  ERROR: ${msg}`);
      continue;
    }

    for (let i = 0; i < n; i++) {
      verses[i].geez = paras[i];
    }
    changed = true;
  }

  if (errors.length) {
    console.error("\n--- Fix these before relying on the import ---");
    for (const e of errors) console.error(" •", e);
  }

  if (!changed) {
    console.log("\nNo updates written.");
    process.exit(errors.length ? 1 : 0);
  }

  if (dryRun) {
    console.log("\n--dry-run: not writing JSON.");
    process.exit(errors.length ? 1 : 0);
  }

  await fs.writeFile(JSON_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("\nWrote", JSON_PATH);
  process.exit(errors.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
