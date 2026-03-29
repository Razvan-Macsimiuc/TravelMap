import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const SETTINGS_KEY = 'travelmap_settings';

export interface AppSettings {
  // Reserved for future settings
}

const DEFAULT_SETTINGS: AppSettings = {};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor() {
    // Always apply dark mode on startup
    this.applyDarkMode();
  }

  /**
   * Apply dark mode to the document (always dark).
   */
  private applyDarkMode(): void {
    document.documentElement.classList.add('ion-palette-dark');
    document.body.classList.add('ion-palette-dark');
    document.documentElement.style.colorScheme = 'dark';
    console.log('[SettingsService] Dark mode applied (always on)');
  }

  /**
   * Reset settings to defaults.
   */
  async resetSettings(): Promise<void> {
    await Preferences.remove({ key: SETTINGS_KEY });
    console.log('[SettingsService] Settings reset to defaults');
  }
}

