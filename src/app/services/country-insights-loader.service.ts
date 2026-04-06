import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { CountryInsightsBundle } from '../data/country-insights.types';
import { buildFallbackCountryInsights } from '../data/country-insights.data';

/**
 * Loads `assets/data/country-insights.json` once and serves per-country bundles.
 * Falls back to regional templates if JSON is missing or a code is absent.
 */
@Injectable({ providedIn: 'root' })
export class CountryInsightsLoaderService {
  private readonly http = inject(HttpClient);
  private loadPromise: Promise<void> | null = null;
  private readonly byCode = new Map<string, CountryInsightsBundle>();

  /** Loads the JSON bundle (no-op if already loaded). */
  ensureLoaded(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }
    this.loadPromise = firstValueFrom(
      this.http.get<Record<string, CountryInsightsBundle>>('assets/data/country-insights.json'),
    )
      .then((data) => {
        this.byCode.clear();
        for (const [k, v] of Object.entries(data)) {
          this.byCode.set(k.toUpperCase(), v);
        }
      })
      .catch(() => {
        // Offline or missing file: rely on fallbacks only
        this.byCode.clear();
      });
    return this.loadPromise;
  }

  /** Returns bundled copy for a country, or regional fallback. */
  getBundle(code: string, name: string): CountryInsightsBundle {
    const upper = code.toUpperCase();
    return this.byCode.get(upper) ?? buildFallbackCountryInsights(upper, name);
  }

  /** True when JSON contained an entry for this code (Wikipedia “at a glance” present). */
  hasBundledEntry(code: string): boolean {
    return this.byCode.has(code.toUpperCase());
  }
}
