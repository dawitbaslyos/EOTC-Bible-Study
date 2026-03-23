/**
 * Extract Ge'ez daily Wudase from public/data/source-wudase-0.docx
 * (copy of "የሳምንቱ ውዳሴ ማርያም እና መልክአ መልክ.docx") and fill
 * portions.*.sections[0].verses[].geez in public/data/wudase-liturgy.json
 *
 * Run: npm run import-wudase-geez
 *
 * Alignment: this edition has 13 Ge'ez stanzas for Tuesday vs 15 Amharic slots;
 * Thursday 7 vs 8; Friday 6 vs 7. Unmatched slots stay "". Fix manually or adjust
 * JSON verse counts to match the source.
 */
import mammoth from "mammoth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DOCX = path.join(root, "public", "data", "source-wudase-0.docx");
const JSON_PATH = path.join(root, "public", "data", "wudase-liturgy.json");

/** Day headers in document order → JSON portions key */
const DAY_HEADERS = [
  { marker: "ዉዳሴ ማርያም ዘሰኑይ", key: "Monday" },
  { marker: "ዉዳሴ ማርያም ዘሠሉስ", key: "Tuesday" },
  { marker: "ዉዳሴ ማርያም ዘረቡዕ", key: "Wednesday" },
  { marker: "ዉዳሴ ማርያም ዘኃሙስ", key: "Thursday" },
  { marker: "ዉዳሴ ማርያም ዘዓርብ", key: "Friday" },
  { marker: "ዉዳሴ ማርያም ዘቀዳሚት", key: "Saturday" },
  { marker: "ዉዳሴ ማርያም ዘሰንበት", key: "Sunday" },
];

/** Match stanza endings: ሰኣሊ ለነ ቅድስት። (with common OCR/spacing variants) */
const VERSE_END =
  /(ሰ[አኣ]?(?:ሊ|ለ|ሥ)|ስአሊ|ሰእለ|ሰአሊለነ|ሰኣለ)\s*ለ(?:ን|ነ)\s*(?:ቅድስት|ስት)(?:።|::|\.|$)/gum;

/** Docx sometimes omits space after ፡ before ሰአሊ (e.g. ፡ሰአሊ) */
function normalizePrayerBoundaries(t) {
  return t.replace(
    /፡(?=ሰ[አኣ]?(?:ሊ|ለ|ሥ)|ስአሊ|ሰእለ|ሰአሊለነ|ሰኣለ)/gu,
    "፡ "
  );
}

function extractDayBodies(fullText) {
  const bodies = {};
  for (let i = 0; i < DAY_HEADERS.length; i++) {
    const { marker, key } = DAY_HEADERS[i];
    const start = fullText.indexOf(marker);
    if (start === -1) {
      console.warn("Missing marker:", marker);
      bodies[key] = "";
      continue;
    }
    const afterStart = start + marker.length;
    let end = fullText.length;
    for (let j = i + 1; j < DAY_HEADERS.length; j++) {
      const next = fullText.indexOf(DAY_HEADERS[j].marker, afterStart);
      if (next !== -1) {
        end = next;
        break;
      }
    }
    bodies[key] = fullText.slice(afterStart, end);
  }
  return bodies;
}

function stripSubtitle(body) {
  let t = body.trim();
  // Remove first line like "ዉዳሴሃ ለእግዝእትነ ... በዕለተ ..."
  const lines = t.split(/\r?\n/);
  if (
    lines.length &&
    (lines[0].includes("ዉዳሴሃ") ||
      lines[0].includes("ውዳሴሃ") ||
      lines[0].includes("ዉድሴሃ"))
  ) {
    lines.shift();
    t = lines.join("\n").trim();
  }
  return t;
}

function splitVerses(body) {
  const text = normalizePrayerBoundaries(stripSubtitle(body));
  const verses = [];
  let lastIndex = 0;
  let m;
  const re = new RegExp(VERSE_END.source, VERSE_END.flags);
  while ((m = re.exec(text)) !== null) {
    let chunk = text.slice(lastIndex, m.index + m[0].length).trim();
    if (chunk) {
      if (!/[።:]$/.test(chunk)) chunk += "።";
      verses.push(chunk);
    }
    lastIndex = m.index + m[0].length;
  }
  return verses;
}

async function main() {
  const { value: raw } = await mammoth.extractRawText({ path: DOCX });
  const bodies = extractDayBodies(raw);

  const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  const expected = {};

  for (const { key } of DAY_HEADERS) {
    const section = data.portions[key]?.sections?.[0];
    if (!section?.verses) {
      console.warn("No section for", key);
      continue;
    }
    const n = section.verses.length;
    expected[key] = n;
    let verses = splitVerses(bodies[key] || "");

    // Sunday section in doc includes extra stanzas after the praise; keep first N only.
    if (verses.length > n && key === "Sunday") {
      verses = verses.slice(0, n);
    }

    // Fix Sunday last verse OCR typo: ስት። → ቅድስት።
    if (verses.length && key === "Sunday") {
      verses = verses.map((v, i) =>
        i === verses.length - 1 ? v.replace(/ለነ ስት።\s*$/, "ለነ ቅድስት።") : v
      );
    }

    if (verses.length !== n) {
      console.warn(
        `${key}: expected ${n} verses, got ${verses.length} (will trim or pad with "")`
      );
    }

    for (let i = 0; i < n; i++) {
      section.verses[i].geez = verses[i] ?? "";
    }
  }

  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("Updated", JSON_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
