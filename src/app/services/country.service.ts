import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Country } from '../models/country.model';
import { StorageService } from './storage.service';

// Base countries - will be expanded dynamically when user clicks on new countries
const INITIAL_COUNTRIES: Country[] = [
  // Europe
  { code: 'GB', name: 'United Kingdom', visited: false, photoIds: [] },
  { code: 'FR', name: 'France', visited: false, photoIds: [] },
  { code: 'DE', name: 'Germany', visited: false, photoIds: [] },
  { code: 'IT', name: 'Italy', visited: false, photoIds: [] },
  { code: 'ES', name: 'Spain', visited: false, photoIds: [] },
  { code: 'PT', name: 'Portugal', visited: false, photoIds: [] },
  { code: 'NL', name: 'Netherlands', visited: false, photoIds: [] },
  { code: 'BE', name: 'Belgium', visited: false, photoIds: [] },
  { code: 'CH', name: 'Switzerland', visited: false, photoIds: [] },
  { code: 'AT', name: 'Austria', visited: false, photoIds: [] },
  { code: 'PL', name: 'Poland', visited: false, photoIds: [] },
  { code: 'CZ', name: 'Czech Republic', visited: false, photoIds: [] },
  { code: 'SE', name: 'Sweden', visited: false, photoIds: [] },
  { code: 'NO', name: 'Norway', visited: false, photoIds: [] },
  { code: 'DK', name: 'Denmark', visited: false, photoIds: [] },
  { code: 'FI', name: 'Finland', visited: false, photoIds: [] },
  { code: 'IE', name: 'Ireland', visited: false, photoIds: [] },
  { code: 'GR', name: 'Greece', visited: false, photoIds: [] },
  { code: 'RO', name: 'Romania', visited: false, photoIds: [] },
  { code: 'HU', name: 'Hungary', visited: false, photoIds: [] },
  { code: 'BG', name: 'Bulgaria', visited: false, photoIds: [] },
  { code: 'HR', name: 'Croatia', visited: false, photoIds: [] },
  { code: 'RS', name: 'Serbia', visited: false, photoIds: [] },
  { code: 'SK', name: 'Slovakia', visited: false, photoIds: [] },
  { code: 'SI', name: 'Slovenia', visited: false, photoIds: [] },
  { code: 'BA', name: 'Bosnia and Herzegovina', visited: false, photoIds: [] },
  { code: 'ME', name: 'Montenegro', visited: false, photoIds: [] },
  { code: 'MK', name: 'North Macedonia', visited: false, photoIds: [] },
  { code: 'AL', name: 'Albania', visited: false, photoIds: [] },
  { code: 'LT', name: 'Lithuania', visited: false, photoIds: [] },
  { code: 'LV', name: 'Latvia', visited: false, photoIds: [] },
  { code: 'EE', name: 'Estonia', visited: false, photoIds: [] },
  { code: 'UA', name: 'Ukraine', visited: false, photoIds: [] },
  { code: 'BY', name: 'Belarus', visited: false, photoIds: [] },
  { code: 'MD', name: 'Moldova', visited: false, photoIds: [] },
  { code: 'IS', name: 'Iceland', visited: false, photoIds: [] },
  { code: 'LU', name: 'Luxembourg', visited: false, photoIds: [] },
  { code: 'MT', name: 'Malta', visited: false, photoIds: [] },
  { code: 'CY', name: 'Cyprus', visited: false, photoIds: [] },

  // North America
  { code: 'US', name: 'United States', visited: false, photoIds: [] },
  { code: 'CA', name: 'Canada', visited: false, photoIds: [] },
  { code: 'MX', name: 'Mexico', visited: false, photoIds: [] },
  { code: 'GT', name: 'Guatemala', visited: false, photoIds: [] },
  { code: 'CU', name: 'Cuba', visited: false, photoIds: [] },
  { code: 'DO', name: 'Dominican Republic', visited: false, photoIds: [] },
  { code: 'HT', name: 'Haiti', visited: false, photoIds: [] },
  { code: 'JM', name: 'Jamaica', visited: false, photoIds: [] },
  { code: 'PA', name: 'Panama', visited: false, photoIds: [] },
  { code: 'CR', name: 'Costa Rica', visited: false, photoIds: [] },

  // South America
  { code: 'BR', name: 'Brazil', visited: false, photoIds: [] },
  { code: 'AR', name: 'Argentina', visited: false, photoIds: [] },
  { code: 'CO', name: 'Colombia', visited: false, photoIds: [] },
  { code: 'CL', name: 'Chile', visited: false, photoIds: [] },
  { code: 'PE', name: 'Peru', visited: false, photoIds: [] },
  { code: 'VE', name: 'Venezuela', visited: false, photoIds: [] },
  { code: 'EC', name: 'Ecuador', visited: false, photoIds: [] },
  { code: 'BO', name: 'Bolivia', visited: false, photoIds: [] },
  { code: 'PY', name: 'Paraguay', visited: false, photoIds: [] },
  { code: 'UY', name: 'Uruguay', visited: false, photoIds: [] },

  // Asia
  { code: 'CN', name: 'China', visited: false, photoIds: [] },
  { code: 'JP', name: 'Japan', visited: false, photoIds: [] },
  { code: 'KR', name: 'South Korea', visited: false, photoIds: [] },
  { code: 'KP', name: 'North Korea', visited: false, photoIds: [] },
  { code: 'IN', name: 'India', visited: false, photoIds: [] },
  { code: 'TH', name: 'Thailand', visited: false, photoIds: [] },
  { code: 'VN', name: 'Vietnam', visited: false, photoIds: [] },
  { code: 'ID', name: 'Indonesia', visited: false, photoIds: [] },
  { code: 'MY', name: 'Malaysia', visited: false, photoIds: [] },
  { code: 'SG', name: 'Singapore', visited: false, photoIds: [] },
  { code: 'PH', name: 'Philippines', visited: false, photoIds: [] },
  { code: 'AE', name: 'United Arab Emirates', visited: false, photoIds: [] },
  { code: 'TR', name: 'Turkey', visited: false, photoIds: [] },
  { code: 'IL', name: 'Israel', visited: false, photoIds: [] },
  { code: 'SA', name: 'Saudi Arabia', visited: false, photoIds: [] },
  { code: 'IR', name: 'Iran', visited: false, photoIds: [] },
  { code: 'IQ', name: 'Iraq', visited: false, photoIds: [] },
  { code: 'PK', name: 'Pakistan', visited: false, photoIds: [] },
  { code: 'BD', name: 'Bangladesh', visited: false, photoIds: [] },
  { code: 'MM', name: 'Myanmar', visited: false, photoIds: [] },
  { code: 'KH', name: 'Cambodia', visited: false, photoIds: [] },
  { code: 'LA', name: 'Laos', visited: false, photoIds: [] },
  { code: 'NP', name: 'Nepal', visited: false, photoIds: [] },
  { code: 'LK', name: 'Sri Lanka', visited: false, photoIds: [] },
  { code: 'KZ', name: 'Kazakhstan', visited: false, photoIds: [] },
  { code: 'UZ', name: 'Uzbekistan', visited: false, photoIds: [] },
  { code: 'TM', name: 'Turkmenistan', visited: false, photoIds: [] },
  { code: 'AF', name: 'Afghanistan', visited: false, photoIds: [] },
  { code: 'AZ', name: 'Azerbaijan', visited: false, photoIds: [] },
  { code: 'GE', name: 'Georgia', visited: false, photoIds: [] },
  { code: 'AM', name: 'Armenia', visited: false, photoIds: [] },
  { code: 'JO', name: 'Jordan', visited: false, photoIds: [] },
  { code: 'LB', name: 'Lebanon', visited: false, photoIds: [] },
  { code: 'SY', name: 'Syria', visited: false, photoIds: [] },
  { code: 'KW', name: 'Kuwait', visited: false, photoIds: [] },
  { code: 'QA', name: 'Qatar', visited: false, photoIds: [] },
  { code: 'BH', name: 'Bahrain', visited: false, photoIds: [] },
  { code: 'OM', name: 'Oman', visited: false, photoIds: [] },
  { code: 'YE', name: 'Yemen', visited: false, photoIds: [] },
  { code: 'MN', name: 'Mongolia', visited: false, photoIds: [] },
  { code: 'TW', name: 'Taiwan', visited: false, photoIds: [] },

  // Africa
  { code: 'ZA', name: 'South Africa', visited: false, photoIds: [] },
  { code: 'EG', name: 'Egypt', visited: false, photoIds: [] },
  { code: 'MA', name: 'Morocco', visited: false, photoIds: [] },
  { code: 'KE', name: 'Kenya', visited: false, photoIds: [] },
  { code: 'NG', name: 'Nigeria', visited: false, photoIds: [] },
  { code: 'DZ', name: 'Algeria', visited: false, photoIds: [] },
  { code: 'TN', name: 'Tunisia', visited: false, photoIds: [] },
  { code: 'LY', name: 'Libya', visited: false, photoIds: [] },
  { code: 'ET', name: 'Ethiopia', visited: false, photoIds: [] },
  { code: 'TZ', name: 'Tanzania', visited: false, photoIds: [] },
  { code: 'UG', name: 'Uganda', visited: false, photoIds: [] },
  { code: 'GH', name: 'Ghana', visited: false, photoIds: [] },
  { code: 'CI', name: 'Ivory Coast', visited: false, photoIds: [] },
  { code: 'SN', name: 'Senegal', visited: false, photoIds: [] },
  { code: 'CM', name: 'Cameroon', visited: false, photoIds: [] },
  { code: 'ZW', name: 'Zimbabwe', visited: false, photoIds: [] },
  { code: 'AO', name: 'Angola', visited: false, photoIds: [] },
  { code: 'MZ', name: 'Mozambique', visited: false, photoIds: [] },
  { code: 'MG', name: 'Madagascar', visited: false, photoIds: [] },
  { code: 'SD', name: 'Sudan', visited: false, photoIds: [] },
  {
    code: 'CD',
    name: 'Democratic Republic of the Congo',
    visited: false,
    photoIds: [],
  },
  { code: 'CG', name: 'Republic of the Congo', visited: false, photoIds: [] },
  { code: 'ML', name: 'Mali', visited: false, photoIds: [] },
  { code: 'NE', name: 'Niger', visited: false, photoIds: [] },
  { code: 'TD', name: 'Chad', visited: false, photoIds: [] },
  { code: 'MR', name: 'Mauritania', visited: false, photoIds: [] },
  { code: 'NA', name: 'Namibia', visited: false, photoIds: [] },
  { code: 'BW', name: 'Botswana', visited: false, photoIds: [] },
  { code: 'ZM', name: 'Zambia', visited: false, photoIds: [] },
  { code: 'RW', name: 'Rwanda', visited: false, photoIds: [] },

  // Oceania
  { code: 'AU', name: 'Australia', visited: false, photoIds: [] },
  { code: 'NZ', name: 'New Zealand', visited: false, photoIds: [] },
  { code: 'PG', name: 'Papua New Guinea', visited: false, photoIds: [] },
  { code: 'FJ', name: 'Fiji', visited: false, photoIds: [] },

  // Russia & CIS
  { code: 'RU', name: 'Russia', visited: false, photoIds: [] },
];

@Injectable({
  providedIn: 'root',
})
export class CountryService {
  private readonly storageService = inject(StorageService);
  private readonly countriesSignal = signal<Country[]>([...INITIAL_COUNTRIES]);
  private isInitialized = false;
  private saveInProgress = false;

  readonly countries = this.countriesSignal.asReadonly();

  readonly visitedCountries = computed(() =>
    this.countriesSignal().filter((country) => country.visited)
  );

  readonly visitedCount = computed(() => this.visitedCountries().length);

  readonly totalCount = computed(() => this.countriesSignal().length);

  constructor() {
    // Initialize by loading from storage
    this.initialize();

    // Auto-save to storage when countries change (after initialization)
    effect(() => {
      const countries = this.countriesSignal();
      if (this.isInitialized && !this.saveInProgress) {
        this.saveToStorage(countries);
      }
    });
  }

  /**
   * Initialize the service by loading data from storage.
   */
  private async initialize(): Promise<void> {
    try {
      // First, try to migrate any old localStorage data
      await this.storageService.migrateFromLocalStorage();

      // Load countries from Capacitor Preferences
      const storedCountries = await this.storageService.loadCountries();

      if (storedCountries.length > 0) {
        // Merge stored countries with initial countries
        const merged = this.mergeCountries(INITIAL_COUNTRIES, storedCountries);
        this.countriesSignal.set(merged);
        console.log(
          '[CountryService] Loaded countries from storage:',
          merged.length
        );
      } else {
        // Check for migration data
        const visitedCodes =
          await this.storageService.getMigrationVisitedCodes();
        const additionalCountries =
          await this.storageService.getMigrationAdditionalCountries();

        if (visitedCodes.length > 0 || additionalCountries.length > 0) {
          // Apply migration data
          let countries = [...INITIAL_COUNTRIES];

          // Add additional countries
          additionalCountries.forEach((ac) => {
            if (!countries.find((c) => c.code === ac.code)) {
              countries.push({ ...ac, visited: false });
            }
          });

          // Apply visited status
          countries = countries.map((country) => ({
            ...country,
            visited: visitedCodes.includes(country.code),
          }));

          this.countriesSignal.set(countries);

          // Clear migration data
          await this.storageService.clearMigrationData();
          console.log('[CountryService] Migrated data from localStorage');
        } else {
          console.log(
            '[CountryService] Using initial countries (no stored data)'
          );
        }
      }

      this.isInitialized = true;

      // Save initial state
      await this.saveToStorage(this.countriesSignal());
    } catch (error) {
      console.error('[CountryService] Initialization error:', error);
      this.isInitialized = true;
    }
  }

  /**
   * Merge stored countries with initial countries.
   * Stored data takes precedence for existing countries.
   */
  private mergeCountries(initial: Country[], stored: Country[]): Country[] {
    const storedMap = new Map(stored.map((c) => [c.code, c]));
    const result: Country[] = [];

    // First, add all initial countries with their stored state
    for (const country of initial) {
      const storedCountry = storedMap.get(country.code);
      if (storedCountry) {
        result.push(storedCountry);
        storedMap.delete(country.code);
      } else {
        result.push(country);
      }
    }

    // Add any additional countries that were dynamically added
    for (const country of storedMap.values()) {
      result.push(country);
    }

    return result;
  }

  getAllCountries(): Country[] {
    return this.countriesSignal();
  }

  getVisitedCountries(): Country[] {
    return this.visitedCountries();
  }

  getCountryByCode(code: string): Country | undefined {
    return this.countriesSignal().find(
      (country) => country.code.toUpperCase() === code.toUpperCase()
    );
  }

  /**
   * Toggle visited status for a country.
   * If the country doesn't exist in the list, it will be added.
   */
  toggleVisited(countryCode: string, countryName?: string): void {
    const upperCode = countryCode.toUpperCase();
    const existingCountry = this.getCountryByCode(upperCode);

    if (existingCountry) {
      // Country exists, toggle its visited status
      this.countriesSignal.update((countries) =>
        countries.map((country) =>
          country.code.toUpperCase() === upperCode
            ? { ...country, visited: !country.visited }
            : country
        )
      );
    } else {
      // Country doesn't exist, add it as visited
      const newCountry: Country = {
        code: upperCode,
        name: countryName || upperCode,
        visited: true,
        photoIds: [],
      };
      this.countriesSignal.update((countries) => [...countries, newCountry]);
    }
  }

  /**
   * Update visit statistics for a country.
   * @param countryCode - The country code
   * @param visitCount - Number of times visited
   * @param daysStayed - Total days stayed
   */
  updateVisitStats(
    countryCode: string,
    visitCount: number,
    daysStayed: number
  ): void {
    const upperCode = countryCode.toUpperCase();
    this.countriesSignal.update((countries) =>
      countries.map((country) =>
        country.code.toUpperCase() === upperCode
          ? { ...country, visitCount, daysStayed }
          : country
      )
    );
  }

  /**
   * Add a city to a country's visited cities list.
   * @param countryCode - The country code
   * @param cityName - The name of the city to add
   */
  addCity(countryCode: string, cityName: string): void {
    const upperCode = countryCode.toUpperCase();
    const trimmedCity = cityName.trim();
    if (!trimmedCity) return;

    this.countriesSignal.update((countries) =>
      countries.map((country) => {
        if (country.code.toUpperCase() === upperCode) {
          const currentCities = country.cities ?? [];
          // Avoid duplicates (case-insensitive)
          if (
            !currentCities.some(
              (c) => c.toLowerCase() === trimmedCity.toLowerCase()
            )
          ) {
            return { ...country, cities: [...currentCities, trimmedCity] };
          }
        }
        return country;
      })
    );
  }

  /**
   * Remove a city from a country's visited cities list.
   * @param countryCode - The country code
   * @param cityName - The name of the city to remove
   */
  removeCity(countryCode: string, cityName: string): void {
    const upperCode = countryCode.toUpperCase();
    this.countriesSignal.update((countries) =>
      countries.map((country) =>
        country.code.toUpperCase() === upperCode
          ? {
              ...country,
              cities: (country.cities ?? []).filter((c) => c !== cityName),
            }
          : country
      )
    );
  }

  /**
   * Update a city name in a country's visited cities list.
   * @param countryCode - The country code
   * @param oldName - The old city name
   * @param newName - The new city name
   */
  updateCity(countryCode: string, oldName: string, newName: string): void {
    const upperCode = countryCode.toUpperCase();
    const trimmedNew = newName.trim();
    if (!trimmedNew) return;

    this.countriesSignal.update((countries) =>
      countries.map((country) => {
        if (country.code.toUpperCase() === upperCode) {
          const currentCities = country.cities ?? [];
          return {
            ...country,
            cities: currentCities.map((c) => (c === oldName ? trimmedNew : c)),
          };
        }
        return country;
      })
    );
  }

  /**
   * Update a country's personal note.
   * @param countryCode - The country code
   * @param note - The note text (max 120 characters)
   */
  updateNote(countryCode: string, note: string): void {
    const upperCode = countryCode.toUpperCase();
    const trimmedNote = note.trim().slice(0, 120);

    this.countriesSignal.update((countries) =>
      countries.map((country) =>
        country.code.toUpperCase() === upperCode
          ? { ...country, note: trimmedNote || undefined }
          : country
      )
    );
  }

  /**
   * Save countries to storage.
   */
  private async saveToStorage(countries: Country[]): Promise<void> {
    if (this.saveInProgress) return;

    this.saveInProgress = true;
    try {
      await this.storageService.saveCountries(countries);
    } catch (error) {
      console.error('[CountryService] Error saving to storage:', error);
    } finally {
      this.saveInProgress = false;
    }
  }

  /**
   * Force a save to storage (useful for debugging).
   */
  async forceSave(): Promise<void> {
    await this.saveToStorage(this.countriesSignal());
  }
}
