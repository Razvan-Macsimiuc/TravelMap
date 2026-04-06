/**
 * Builds per-country travel sections:
 * - atAGlance: trimmed English Wikipedia lead (CC BY-SA 4.0)
 * - whyVisit, tasteAndTraditions, planSmart: curated tourist-oriented lines by region
 *
 * Run: node scripts/generate-country-insights.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const WIKI_TITLE_BY_CODE = {
  FM: 'Federated States of Micronesia',
  KP: 'North Korea',
  KR: 'South Korea',
  CG: 'Republic of the Congo',
  CD: 'Democratic Republic of the Congo',
  CI: "Côte d'Ivoire",
  GB: 'United Kingdom',
  US: 'United States',
  MM: 'Myanmar',
  CZ: 'Czech Republic',
  MK: 'North Macedonia',
  PS: 'State of Palestine',
  TW: 'Taiwan',
  VA: 'Vatican City',
  GE: 'Georgia (country)',
};

/** Pull CONTINENT_MAP from repo so pools stay aligned with the app */
function loadContinentMap() {
  const text = fs.readFileSync(path.join(root, 'src/app/services/achievement.service.ts'), 'utf8');
  const start = text.indexOf('export const CONTINENT_MAP');
  if (start < 0) throw new Error('CONTINENT_MAP not found');
  const end = text.indexOf('\n};', start);
  const block = text.slice(start, end + 3);
  const map = {};
  const re = /([A-Z]{2}):\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    map[m[1]] = m[2];
  }
  return map;
}

function templateRegion(continent) {
  if (continent === 'namerica' || continent === 'samerica') return 'americas';
  return continent;
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function parseCountries() {
  const text = fs.readFileSync(path.join(root, 'src/app/data/countries.data.ts'), 'utf8');
  const byCode = new Map();
  const re = /\{\s*code:\s*'([A-Z]{2})'\s*,\s*name:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const code = m[1];
    const raw = m[2] ?? m[3];
    const name = raw.replace(/\\'/g, "'").replace(/\\"/g, '"');
    byCode.set(code, { code, name });
  }
  return [...byCode.values()];
}

function wikiPathTitle(title) {
  return encodeURIComponent(title.replace(/ /g, '_'));
}

const MAX_GLANCE = 300;

function atAGlanceFromExtract(extract) {
  const t = extract.replace(/\s+/g, ' ').trim();
  const sentences = t.split(/(?<=[.!?])\s+/).filter((p) => p.length > 0);
  if (sentences.length === 0) return t.slice(0, MAX_GLANCE);
  let out =
    sentences.length >= 2 && sentences[0].length < 120
      ? `${sentences[0]} ${sentences[1]}`
      : sentences[0];
  if (out.length > MAX_GLANCE) {
    out = out.slice(0, MAX_GLANCE);
    const cut = out.lastIndexOf(' ');
    if (cut > 140) out = out.slice(0, cut);
    out = out.trim() + '…';
  }
  return out.trim();
}

function pick(pool, code, salt) {
  const idx = hashCode(code + salt) % pool.length;
  return pool[idx];
}

function sub(name, s) {
  return s.replace(/\{name\}/g, name);
}

/** Curated lines aimed at visitors — not encyclopedic */
const WHY_VISIT = {
  africa: [
    'National parks and community conservancies are the headline—plan dawn drives and golden-hour walks.',
    'Coastal towns, spice islands, and Saharan gateways each feel like different trips in one journey.',
    'Live music in markets and village gatherings often beats anything ticketed—follow local event boards.',
    'Handicrafts, textiles, and metalwork reward slow browsing; haggle politely and carry small bills.',
    'River journeys and lake ferries add perspective you will not get from the highway.',
    'Photography rules vary near military sites and borders—ask before you raise your camera.',
    'Regional stews, grilled fish, and street snacks change dramatically every few borders—eat widely.',
    'Long-distance buses are an adventure—pack water, layers, and patience for checkpoints.',
  ],
  asia: [
    'Temples, mosques, and shrines reward off-peak visits—sunrise often means cooler light and thinner crowds.',
    'Night markets and hawker rows are half the fun—pick busy stalls and share small plates.',
    'Trains, ferries, and budget flights can save days; compare passes before you commit to buses only.',
    'Old quarters, bazaars, and riverside promenades are made for wandering without a tight itinerary.',
    'Island hops and highland treks need buffer days—weather and seas change fast.',
    'Learn “hello” and “thank you” in a local language—small phrases open warmer interactions.',
    'Spice levels and etiquette at the table vary—watch what hosts do and ask when unsure.',
    'City air quality swings by season; sensitive travelers should check forecasts and pack a mask.',
  ],
  europe: [
    'Medieval cores and riverside paths are best on foot—save one day for aimless wandering.',
    'Regional trains unlock wine villages, lakes, and castles without a car.',
    'Museum and cathedral tickets sell out—book flagship sights a week or more ahead in summer.',
    'Café culture is its own attraction: long lunches, people-watching, and slow evenings.',
    'Seasonal festivals fill squares—check city calendars before you lock dates.',
    'Markets sell picnic ingredients that beat hotel breakfasts on charm and price.',
    'Countryside inns and agriturismos pair hiking or cycling with home-style dinners.',
    'Layers beat a heavy coat—mountain mornings and seaside evenings can differ by 15°C.',
  ],
  americas: [
    'National parks and biosphere reserves are world-class—reserve entry slots where required.',
    'Music spills into streets—plan an evening for salsa, jazz, folk, or regional pop.',
    'Altitude and sun hit fast in the Andes—acclimatize before big hikes and hydrate constantly.',
    'Road trips reward detours: small towns, viewpoints, and roadside produce stands.',
    'Indigenous heritage sites may require guides or permits—research respectfully in advance.',
    'Coasts offer surf, whales, and diving; interiors offer canyons and cloud forests—mix both if you can.',
    'Border crossings vary in hassle—check visa rules even for short hops.',
    'Street food is a highlight—busy carts and markets usually signal safe, tasty picks.',
  ],
  oceania: [
    'Reefs and lagoons are fragile—choose reef-safe sunscreen and follow no-touch rules.',
    'Island schedules run on weather; pad connections and keep a flexible buffer day.',
    'Village visits and cultural shows shine when arranged through community operators.',
    'Hiking ridges and coastal tracks often need permits or local guides—worth it for safety and stories.',
    'Fresh seafood and tropical fruit are daily luxuries—seek local markets early.',
    'Stargazing away from town lights is unforgettable on clear nights.',
    'Domestic flights are common—watch baggage limits on small aircraft.',
    'Respect tapu or restricted areas—ask locals where not to wander.',
  ],
};

const TASTE_TRADITIONS = {
  africa: [
    'Markets are social hubs—sip tea, try grilled snacks, and chat with vendors.',
    'Drumming, dance, and storytelling still anchor many celebrations—ask when festivals run.',
    'Coffee ceremonies and spice routes left delicious traces—seek regional specialties by city.',
    'Dress modestly outside resorts; a scarf or light wrap goes a long way in villages.',
    'Weekends bring football energy—join a crowd at a small pitch or café TV.',
  ],
  asia: [
    'Tea culture runs deep—whether milky, spiced, or bitter, accept a cup when offered if you can.',
    'Street sweets and night-market skewers are a crash course in local flavor—share plates to taste more.',
    'Traditional crafts—textiles, lacquer, ceramics—make meaningful souvenirs when bought from makers.',
    'Shoes off indoors is common at temples and homes—wear socks you are happy to show.',
    'Public modesty norms differ by region—carry a light cover-up for religious sites.',
  ],
  europe: [
    'Every region claims the “real” version of its dish—try both the classic and the modern twist.',
    'Christmas markets, harvest weeks, and patron-saint days turn towns into open-air parties.',
    'Slow food and farm cooperatives reward travelers who leave the highway.',
    'Aperitivo and digestivo rituals vary—observe locals and order what they order.',
    'Small bakeries and cheese shops are daily institutions—build picnics from them.',
  ],
  americas: [
    'From barbecue to ceviche to tasting menus, food is identity—ask what is in season now.',
    'Indigenous and Afro-descendant influences show up in music, art, and fusion kitchens.',
    'Farmers markets reveal what chefs cook that week—go Saturday mornings if you can.',
    'Coffee, cacao, and cane spirits each have terroir—try a flight before you buy bottles.',
    'Festivals fuse religion, music, and street food—plan around one if dates align.',
  ],
  oceania: [
    'Kava, kava-style ceremonies, or island feasts may be offered—accept guidance on etiquette.',
    'Seafood is often caught the same day—ask for the local catch name, not the English default.',
    'Austronesian and Indigenous stories surface in dance and carving—seek cultural centers.',
    'Sunday pace is slower on many islands—embrace it and book little that day.',
    'Reef-to-table dining is common—pair with tropical fruit you have never tried before.',
  ],
};

const PLAN_SMART = {
  africa: [
    'Dry and wet seasons reshape wildlife viewing—ask guides which months match your goals.',
    'Cash still wins outside major cities; carry small denominations and hide a backup card.',
    'Domestic flights can be irregular—leave slack around connections.',
    'Travel insurance that covers medical evacuation is worth serious consideration.',
  ],
  asia: [
    'Shoulder seasons balance weather and crowds better than peak holiday windows.',
    'Download offline maps; rural signal is patchy even when cities feel futuristic.',
    'Carry stomach remedies and stay hydrated—street food is worth it, but pace yourself.',
    'Respect photography bans at airports and some infrastructure—when in doubt, ask.',
  ],
  europe: [
    'Sundays and public holidays can shutter whole neighborhoods—check openings.',
    'Pickpockets love crowded sights—use a crossbody bag and front pockets.',
    'Rail passes pay off on multi-city loops; point-to-point wins for short hops.',
    'Tap water is usually safe—carry a bottle and refill to save money and plastic.',
  ],
  americas: [
    'Domestic flights beat brutal overnight buses on long north–south hops.',
    'Altitude and vaccines: check requirements well before departure.',
    'Neighborhood safety shifts block by block—ask your host or desk for evening routes.',
    'Tip culture varies—have small US dollars or local coins ready.',
  ],
  oceania: [
    'Cyclone and monsoon windows matter—verify seasons for your exact archipelago.',
    'Reef cuts and sunburn happen fast—pack antiseptic and high-SPF, reef-safe protection.',
    'Inter-island boats may cancel in swell—always have a plan B night.',
    'Fresh water can be limited on small islands—short showers and refill respectfully.',
  ],
};

function buildTouristSections(code, name, continentRaw) {
  const region = templateRegion(continentRaw);
  const w = WHY_VISIT[region] ?? WHY_VISIT.asia;
  const t = TASTE_TRADITIONS[region] ?? TASTE_TRADITIONS.asia;
  const p = PLAN_SMART[region] ?? PLAN_SMART.asia;

  const a = sub(name, pick(w, code, 'w1'));
  const b = sub(name, pick(w, code, 'w2'));
  const whyVisit = a === b ? a : `${a} ${b}`;

  const c = sub(name, pick(t, code, 't1'));
  const d = sub(name, pick(t, code, 't2'));
  const taste = c === d ? c : `${c} ${d}`;

  const plan = sub(name, pick(p, code, 'p1'));

  return { whyVisit, tasteAndTraditions: taste, planSmart: plan };
}

async function fetchSummary(wikiTitle) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiPathTitle(wikiTitle)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'HopaHopaTravelMap/1.0 (country travel sections)' },
  });
  if (!res.ok) return { ok: false, status: res.status, extract: null };
  const data = await res.json();
  if (data.type === 'disambiguation' || !data.extract) return { ok: false, status: 'no-extract', extract: null };
  return { ok: true, extract: data.extract };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const CONTINENT_MAP = loadContinentMap();
  const countries = parseCountries();
  console.log(`Parsed ${countries.length} countries`);

  const results = {};
  const failures = [];

  for (let i = 0; i < countries.length; i++) {
    const { code, name } = countries[i];
    const wikiTitle = WIKI_TITLE_BY_CODE[code] ?? name;
    const continent = CONTINENT_MAP[code] ?? 'asia';
    process.stdout.write(`\r[${i + 1}/${countries.length}] ${code}`);

    const tourist = buildTouristSections(code, name, continent);

    const r = await fetchSummary(wikiTitle);
    await sleep(110);

    let atAGlance = '';
    if (r.ok && r.extract) {
      atAGlance = atAGlanceFromExtract(r.extract);
    } else {
      failures.push({ code, name, wikiTitle, reason: r.status ?? 'fail' });
      const r2 = wikiTitle !== name ? await fetchSummary(name) : { ok: false };
      await sleep(110);
      if (r2.ok && r2.extract) {
        atAGlance = atAGlanceFromExtract(r2.extract);
        failures.pop();
      } else {
        atAGlance = `${name} rewards curious travelers—dig into local guides and seasonal tips below.`;
      }
    }

    results[code] = {
      atAGlance,
      ...tourist,
    };
  }

  console.log('\n');

  const codes = Object.keys(results).sort();
  const jsonPath = path.join(root, 'src/assets/data/country-insights.json');
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(results) + '\n', 'utf8');
  console.log(`Wrote ${codes.length} entries to ${path.relative(root, jsonPath)}`);

  if (failures.length) {
    console.warn('Wikipedia fetch needed fallback glance text for:', failures.map((f) => f.code).join(', '));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
