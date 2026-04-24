/** Capacitor Preferences key; keep in sync with `StorageService.clearAll`. */
export const BIRTHPLACE_STORAGE_KEY = 'hopahopa_birthplace';

/** User birthplace (country + city with coordinates) for map pin and onboarding. */
export interface Birthplace {
  countryCode: string;
  countryName: string;
  cityName: string;
  lng: number;
  lat: number;
}

export function isValidBirthplace(v: unknown): v is Birthplace {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  const code = o['countryCode'];
  const name = o['countryName'];
  const city = o['cityName'];
  const lng = o['lng'];
  const lat = o['lat'];
  return (
    typeof code === 'string' &&
    code.length === 2 &&
    typeof name === 'string' &&
    typeof city === 'string' &&
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    Number.isFinite(lng) &&
    Number.isFinite(lat)
  );
}
