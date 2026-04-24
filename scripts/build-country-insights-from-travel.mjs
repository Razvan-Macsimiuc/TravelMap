/**
 * Converts `src/assets/travel.json` (array of { code, name, mustKnow, mustDo, myths, adventureHighlights })
 * into `src/assets/data/country-insights.json` keyed by ISO alpha-2 for `CountryInsightsLoaderService`.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const travelPath = path.join(root, 'src/assets/travel.json');
const outPath = path.join(root, 'src/assets/data/country-insights.json');

const raw = fs.readFileSync(travelPath, 'utf8');
const travel = JSON.parse(raw);
if (!Array.isArray(travel)) {
  throw new Error('travel.json must be a JSON array');
}

function joinBullets(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  return arr.map((s) => `• ${String(s).trim()}`).join('\n');
}

const out = {};
for (const entry of travel) {
  if (!entry || typeof entry.code !== 'string') continue;
  const code = entry.code.trim().toUpperCase();
  if (!code) continue;
  out[code] = {
    atAGlance: joinBullets(entry.mustKnow),
    whyVisit: joinBullets(entry.mustDo),
    tasteAndTraditions: joinBullets(entry.myths),
    planSmart: joinBullets(entry.adventureHighlights),
    wikipediaAttribution: false,
  };
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out), 'utf8');
console.log('Wrote', outPath, '—', Object.keys(out).length, 'countries');
