/**
 * One-time / maintenance: split legacy `wudaseAmlak` (አንቀጸ ብርሃን prose) into
 * `anqaseBerhan.sections` for the Wudase reading view (chapter 3).
 *
 * Usage: node scripts/emit-anqase-berhan.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const JSON_PATH = path.join(root, "public", "data", "wudase-liturgy.json");

const raw = fs.readFileSync(JSON_PATH, "utf8");
const data = JSON.parse(raw);

const amlak = data.wudaseAmlak;
if (!amlak || typeof amlak !== "string") {
  console.error("No wudaseAmlak string found.");
  process.exit(1);
}

const parts = amlak
  .trim()
  .split(/\n\n+/)
  .map((s) => s.trim())
  .filter(Boolean);

const TITLE = "አንቀጸ ብርሃን";
if (parts[0] && /^አንቀጸ ብርሃን\s*$/.test(parts[0].replace(/\s+/g, " ").trim())) {
  parts.shift();
}

const verses = parts.map((p, i) => ({
  verse: i + 1,
  text: p,
  geez: "",
  amharic: p,
  english: "",
}));

data.anqaseBerhan = {
  title: TITLE,
  sections: [
    {
      title: "",
      verses,
    },
  ],
};

// Legacy field no longer shown in summary; keep empty for compatibility
data.wudaseAmlak = "";

fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("Wrote anqaseBerhan with", verses.length, "verses; cleared wudaseAmlak.");
