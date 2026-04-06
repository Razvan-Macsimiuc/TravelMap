/**
 * Regional fallback copy when `assets/data/country-insights.json` is unavailable
 * or omits a code.
 */
import { CONTINENT_MAP } from '../services/achievement.service';
import type { CountryInsightsBundle } from './country-insights.types';

export type { CountryInsights, CountryInsightsBundle } from './country-insights.types';

function hashCode(code: string): number {
  let h = 0;
  for (let i = 0; i < code.length; i++) {
    h = (h << 5) - h + code.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function templateRegion(continent: string): string {
  if (continent === 'namerica' || continent === 'samerica') return 'americas';
  return continent;
}

const REGION_SUMMARIES: Record<string, string[]> = {
  africa: [
    '{name} layers wildlife, diverse languages, and landscapes from desert to rainforest.',
    'From Sahel rhythms to Indian Ocean shores, {name} rewards slow travel and local guides.',
    '{name} blends traditional kingdoms, bustling markets, and vast natural parks.',
  ],
  asia: [
    '{name} sits at a crossroads of trade routes, faiths, and some of the world’s oldest cities.',
    'Temples, spice markets, and dramatic terrain make {name} a continent in one country.',
    '{name} mixes ancient heritage with fast-changing megacities and regional cuisines.',
  ],
  europe: [
    '{name} folds castles, walkable old towns, and distinct regional identities into a small area.',
    'History, art, and public life intertwine—{name} is made for wandering on foot.',
    '{name} offers layered empires, alpine or coastal nature, and celebrated food traditions.',
  ],
  americas: [
    '{name} stretches across ecosystems—from high peaks to coast—with Indigenous and colonial layers.',
    'Music, festivals, and dramatic scenery define road-trip culture across {name}.',
    '{name} pairs biodiversity hotspots with vibrant cities and regional cooking.',
  ],
  oceania: [
    '{name} is reef, rainforest, and Pacific island culture with English ties.',
    'Remote atolls, marine life, and Indigenous navigation traditions shape life in {name}.',
    '{name} rewards divers, hikers, and anyone who loves ocean horizons.',
  ],
};

const REGION_DETAILS: Record<string, string[]> = {
  africa: [
    'Dry and wet seasons shift wildlife movements—ask locally when parks are at their best. Regional flights can be infrequent, so build buffer days.',
    'Community tourism and homestays are growing; book guides through reputable cooperatives.',
    'Road quality varies; 4×4 or organized transfers beat rushing on your own in remote areas.',
  ],
  asia: [
    'Peak seasons crowd temples and beaches; shoulder months balance weather and crowds.',
    'Domestic flights and high-speed rail can save days of overland travel—compare prices early.',
    'Monsoon windows differ coast to coast; pack a light shell and quick-dry layers.',
  ],
  europe: [
    'Many sights need timed tickets—book cathedrals and flagship museums a week or more ahead.',
    'City centers often restrict cars; plan parking or transit passes before arrival.',
    'Regional holidays move shop hours; verify national calendars.',
  ],
  americas: [
    'Distances are huge—domestic flights or overnight buses are normal between regions.',
    'National-park passes and reservations matter in peak season.',
    'Urban safety varies by neighborhood; use official taxis or rideshare at night.',
  ],
  oceania: [
    'Island hops depend on small planes and boats—weather can delay schedules, so pad your itinerary.',
    'Supplies cost more on remote atolls; bring essentials and medications.',
    'Limited infrastructure means slower Wi‑Fi and power; pack a power bank.',
  ],
};

const DEFAULT_CONTINENT = 'asia';

function rawContinent(code: string): string {
  return CONTINENT_MAP[code] ?? DEFAULT_CONTINENT;
}

function fallbackSummary(code: string, name: string): string {
  const region = templateRegion(rawContinent(code));
  const list = REGION_SUMMARIES[region] ?? REGION_SUMMARIES['asia'];
  const idx = hashCode(code) % list.length;
  return list[idx].replace(/\{name\}/g, name);
}

function fallbackDetail(code: string, name: string): string {
  const region = templateRegion(rawContinent(code));
  const list = REGION_DETAILS[region] ?? REGION_DETAILS['asia'];
  const idx = hashCode(code + 'detail') % list.length;
  return list[idx].replace(/\{name\}/g, name);
}

/** Offline / missing-JSON fallback (also used by `CountryInsightsLoaderService`). */
export function buildFallbackCountryInsights(code: string, name: string): CountryInsightsBundle {
  return {
    atAGlance: fallbackSummary(code, name),
    whyVisit: `Mix headline sights with slower days—${name} opens up when you leave room for detours and local recommendations.`,
    tasteAndTraditions:
      'Ask what is in season, share plates where it is customary, and let markets guide your snack stops.',
    planSmart: fallbackDetail(code, name),
  };
}
