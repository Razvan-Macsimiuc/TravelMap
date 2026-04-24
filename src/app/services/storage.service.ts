import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Country } from '../models/country.model';
import { BIRTHPLACE_STORAGE_KEY } from '../models/birthplace.model';

const STORAGE_KEYS = {
  COUNTRIES: 'travelmap_countries',
} as const;

/**
 * Centralized storage service using Capacitor Preferences.
 * Works on both web (localStorage fallback) and native platforms.
 */
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // ============================================
  // Countries Storage
  // ============================================

  /**
   * Save all countries to storage.
   * @param countries - Array of Country objects to save
   */
  async saveCountries(countries: Country[]): Promise<void> {
    try {
      const serialized = JSON.stringify(countries);
      await Preferences.set({
        key: STORAGE_KEYS.COUNTRIES,
        value: serialized,
      });
    } catch (error) {
      console.error('[StorageService] Error saving countries:', error);
      throw error;
    }
  }

  /**
   * Load all countries from storage.
   * @returns Array of Country objects, or empty array if none found
   */
  async loadCountries(): Promise<Country[]> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.COUNTRIES });

      if (!value) {
        return [];
      }

      const parsed: Country[] = JSON.parse(value);

      // Validate and ensure proper structure, preserving all optional fields
      const countries = parsed.map((country) => ({
        ...country,
        code: country.code || '',
        name: country.name || '',
        visited: Boolean(country.visited),
        photoIds: Array.isArray(country.photoIds) ? country.photoIds : [],
      }));

      return countries;
    } catch (error) {
      console.error('[StorageService] Error loading countries:', error);
      return [];
    }
  }

  // ============================================
  // Generic Storage Methods
  // ============================================

  /**
   * Set a value in storage with a custom key.
   * @param key - Storage key
   * @param value - Value to store (will be JSON serialized)
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await Preferences.set({ key, value: serialized });
    } catch (error) {
      console.error(`[StorageService] Error setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a value from storage by key.
   * @param key - Storage key
   * @returns Parsed value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const { value } = await Preferences.get({ key });
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[StorageService] Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a value from storage by key.
   * @param key - Storage key to remove
   */
  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`[StorageService] Error removing ${key}:`, error);
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Clear all stored data.
   * Useful for debugging or reset functionality.
   */
  async clearAll(): Promise<void> {
    try {
      await Preferences.remove({ key: STORAGE_KEYS.COUNTRIES });
      await Preferences.remove({ key: 'travelmap_photos' });
      await Preferences.remove({ key: 'bucket_list_items' });
      await Preferences.remove({ key: BIRTHPLACE_STORAGE_KEY });
      
      // Also clear IndexedDB on web
      try {
        const request = indexedDB.deleteDatabase('HopaHopaDB');
        request.onsuccess = () => { /* IndexedDB cleared */ };
      } catch {
        // Ignore if IndexedDB not available
      }
      
    } catch (error) {
      console.error('[StorageService] Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Check if storage has been initialized with data.
   */
  async hasData(): Promise<boolean> {
    try {
      const { value: countries } = await Preferences.get({
        key: STORAGE_KEYS.COUNTRIES,
      });
      return countries !== null && countries !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Get raw value by key (for debugging).
   */
  async getRaw(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  }

  /**
   * Migrate data from localStorage to Capacitor Preferences.
   * Call this once during app initialization to migrate old data.
   */
  async migrateFromLocalStorage(): Promise<void> {
    try {
      // Check if migration is needed
      const hasCapacitorData = await this.hasData();
      if (hasCapacitorData) {
        return;
      }

      // Check for old localStorage keys
      const oldVisitedKey = 'travelmap_visited_countries';
      const oldCountriesKey = 'travelmap_countries';

      const oldVisited = localStorage.getItem(oldVisitedKey);
      const oldCountries = localStorage.getItem(oldCountriesKey);

      if (!oldVisited && !oldCountries) {
        return;
      }

      // Parse old data
      let visitedCodes: string[] = [];
      let additionalCountries: Country[] = [];

      if (oldVisited) {
        try {
          visitedCodes = JSON.parse(oldVisited);
        } catch {
          // Ignore malformed data
        }
      }

      if (oldCountries) {
        try {
          additionalCountries = JSON.parse(oldCountries);
        } catch {
          // Ignore malformed data
        }
      }

      // Store migration data in a temporary format for CountryService to pick up
      await Preferences.set({
        key: 'travelmap_migration_visited',
        value: JSON.stringify(visitedCodes),
      });

      await Preferences.set({
        key: 'travelmap_migration_additional',
        value: JSON.stringify(additionalCountries),
      });

    } catch (error) {
      console.error('[StorageService] Migration error:', error);
    }
  }

  /**
   * Get migration data (visited codes) if available.
   */
  async getMigrationVisitedCodes(): Promise<string[]> {
    try {
      const { value } = await Preferences.get({ key: 'travelmap_migration_visited' });
      if (value) {
        return JSON.parse(value);
      }
    } catch {
      // Ignore
    }
    return [];
  }

  /**
   * Get migration data (additional countries) if available.
   */
  async getMigrationAdditionalCountries(): Promise<Country[]> {
    try {
      const { value } = await Preferences.get({ key: 'travelmap_migration_additional' });
      if (value) {
        return JSON.parse(value);
      }
    } catch {
      // Ignore
    }
    return [];
  }

  /**
   * Clear migration data after successful migration.
   */
  async clearMigrationData(): Promise<void> {
    try {
      await Preferences.remove({ key: 'travelmap_migration_visited' });
      await Preferences.remove({ key: 'travelmap_migration_additional' });

      // Also remove old localStorage keys
      localStorage.removeItem('travelmap_visited_countries');
      localStorage.removeItem('travelmap_countries');

    } catch (error) {
      console.error('[StorageService] Error clearing migration data:', error);
    }
  }
}

