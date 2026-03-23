/**
 * One-off: fill geez from docx-dump.txt (mammoth extract of reader strings).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DUMP = path.join(ROOT, "docx-dump.txt");
const WUDASE = path.join(ROOT, "public", "data", "wudase-liturgy.json");
const YEWE = path.join(ROOT, "public", "data", "yewedesewamelaket.json");
const ANDROID_WUDASE = path.join(
  ROOT,
  "android",
  "app",
  "src",
  "main",
  "assets",
  "public",
  "data",
  "wudase-liturgy.json"
);
const ANDROID_YEWE = path.join(
  ROOT,
  "android",
  "app",
  "src",
  "main",
  "assets",
  "public",
  "data",
  "yewedesewamelaket.json"
);

const NUM =
  "፩|፪|፫|፬|፭|፮|፯|፰|፱|፲|፲፩|፲፪|፲፫|፲፬|፲፭|፲፮|፲፯|፲፰";

function extractStringBlock(dump, name) {
  const needle = `<string name="${name}">`;
  const i = dump.indexOf(needle);
  if (i < 0) throw new Error(`Missing ${name}`);
  const j = dump.indexOf("</string>", i);
  if (j < 0) throw new Error(`Unclosed ${name}`);
  return dump.slice(i + needle.length, j);
}

/** docx-dump stores Android string escapes literally (\\n \\t) */
function decodeAndroidStringEscapes(s) {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"');
}

function parseNumberedParagraphs(inner) {
  const decoded = decodeAndroidStringEscapes(inner);
  const re = new RegExp(
    `\t(${NUM})\.\t([\\s\\S]*?)(?=\n\n\\s*\t(?:${NUM})\.|$)`,
    "g"
  );
  const out = [];
  let m;
  while ((m = re.exec(decoded)) !== null) {
    let body = m[2].replace(/\r/g, "").trim();
    body = body.replace(/\n\n+\s*$/g, "").trim();
    out.push(body);
  }
  return out;
}

function tidyMelaketGeez(s) {
  if (!s) return "";
  return s
    .replace(/፡n/g, "።")
    .replace(/\t+/g, " ")
    .replace(/[ \u00a0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function main() {
  const dump = fs.readFileSync(DUMP, "utf8");

  const anInner = extractStringBlock(dump, "reader_prayer_anqetse_birhan_label");
  const anq = parseNumberedParagraphs(anInner);
  if (anq.length !== 18) {
    console.warn("Expected 18 አንቀጸ ብርሃን paragraphs, got", anq.length);
  }

  const [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18] =
    anq;

  const join2 = (x, y) => [x, y].filter(Boolean).join("\n\n");

  /** App verse order vs doc (፩…፲፰): see replace-anqase-berhan.mjs */
  const anqaseGeez = [
    "", // v1 Amh intro — no matching Geʿez in this dump
    a1,
    a2,
    a3,
    join2(a4, a5),
    a6,
    a7,
    join2(a8, a9),
    a10,
    a11,
    a12,
    a13,
    a14,
    a15,
    join2(a16, a17),
    "", // v16 Amh (Ephrem/Yared) — not in reader string; a18 is duplicate closing, omitted
  ];

  if (anqaseGeez.length !== 16) throw new Error("anqase mapping length");

  const wudase = JSON.parse(fs.readFileSync(WUDASE, "utf8"));
  const verses = wudase.anqaseBerhan.sections[0].verses;
  if (verses.length !== 16) throw new Error("Expected 16 anqase verses");
  for (let i = 0; i < 16; i++) {
    verses[i].geez = anqaseGeez[i];
  }
  fs.writeFileSync(WUDASE, JSON.stringify(wudase, null, 2) + "\n", "utf8");
  console.log("Wrote", WUDASE);

  const yInner = extractStringBlock(dump, "reader_prayer_yiwedswea_melaekt_label");
  const yw = parseNumberedParagraphs(yInner);
  if (yw.length < 4) {
    console.warn("Expected at least 4 የወደሰው paragraphs, got", yw.length);
  }

  const [y1, y2, y3, y4] = yw;
  const melaketGeez = [
    tidyMelaketGeez(join2(y1, y2)),
    tidyMelaketGeez(y3),
    tidyMelaketGeez(y4),
  ];

  const yewe = JSON.parse(fs.readFileSync(YEWE, "utf8"));
  const yv = yewe.sections[0].verses;
  if (yv.length !== 3) throw new Error("Expected 3 melaket verses");
  for (let i = 0; i < 3; i++) {
    yv[i].geez = melaketGeez[i];
  }
  fs.writeFileSync(YEWE, JSON.stringify(yewe, null, 2) + "\n", "utf8");
  console.log("Wrote", YEWE);

  for (const [src, dest] of [
    [WUDASE, ANDROID_WUDASE],
    [YEWE, ANDROID_YEWE],
  ]) {
    if (fs.existsSync(path.dirname(dest))) {
      fs.copyFileSync(src, dest);
      console.log("Copied ->", dest);
    }
  }
}

main();
