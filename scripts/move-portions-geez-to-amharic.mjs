/**
 * In wudase-liturgy.json, `portions` daily text was stored under `geez` but is Amharic.
 * Move geez → amharic and clear geez for all verses under portions only.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '..', 'public', 'data', 'wudase-liturgy.json');

const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

if (!data.portions || typeof data.portions !== 'object') {
  console.error('No portions object found');
  process.exit(1);
}

let count = 0;
for (const day of Object.values(data.portions)) {
  if (!day?.sections) continue;
  for (const section of day.sections) {
    if (!section?.verses) continue;
    for (const v of section.verses) {
      const gz = typeof v.geez === 'string' ? v.geez.trim() : '';
      if (gz) {
        v.amharic = gz;
        v.geez = '';
        count++;
      }
    }
  }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`Updated ${count} verses in portions (geez → amharic).`);
