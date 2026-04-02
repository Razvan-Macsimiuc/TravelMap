import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Country } from '../models/country.model';
import { StorageService } from './storage.service';
import { ALL_COUNTRIES } from '../data/countries.data';

const INITIAL_COUNTRIES: Country[] = ALL_COUNTRIES;


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
   * Ensure a country exists in the list, adding it if not already present.
   * Used for territories and non-UN countries found in the GeoJSON.
   */
  ensureCountry(code: string, name: string): void {
    const upper = code.toUpperCase();
    if (this.getCountryByCode(upper)) return;
    this.countriesSignal.update((countries) => [
      ...countries,
      { code: upper, name, visited: false, photoIds: [] },
    ]);
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
  addCity(countryCode: string, cityName: string, coordinates?: [number, number]): void {
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
            const cityCoordinates = coordinates
              ? { ...(country.cityCoordinates ?? {}), [trimmedCity]: coordinates }
              : country.cityCoordinates;
            return { ...country, cities: [...currentCities, trimmedCity], cityCoordinates };
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
      countries.map((country) => {
        if (country.code.toUpperCase() !== upperCode) return country;
        const cities = (country.cities ?? []).filter((c) => c !== cityName);
        const cityCoordinates = { ...(country.cityCoordinates ?? {}) };
        delete cityCoordinates[cityName];
        return { ...country, cities, cityCoordinates };
      })
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
