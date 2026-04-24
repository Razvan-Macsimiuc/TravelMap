import { Injectable } from '@angular/core';

/**
 * Kicks off low-priority downloads and dynamic imports while the user is on
 * splash or welcome so the map and tabs feel instant afterward.
 *
 * Caching behavior (Capacitor WebView ≈ Chrome):
 * - **Lazy JS chunks**: `import()` parses/compiles once; the module cache keeps them in memory for the session.
 * - **`fetch()`** of same-origin assets: the HTTP cache (on-disk in the WebView profile) stores responses according to
 *   cache headers; repeat visits reuse them without hitting the network when possible.
 * - **Bundled `assets/`** in the native app: files already ship inside the IPA/APK; the WebView still benefits from
 *   prefetch by warming the **HTTP/disk cache** and avoiding a cold read right when the map opens.
 */
@Injectable({ providedIn: 'root' })
export class AssetPrefetchService {
  private started = false;

  /**
   * Schedule prefetch once. Safe to call from both `SplashPage` and `WelcomePage`.
   * Uses `requestIdleCallback` when available so onboarding animations stay smooth.
   */
  warmupHeavyMapResources(): void {
    if (this.started) return;
    this.started = true;

    const run = (): void => {
      void import('../map/map.page').catch(() => {});
      void import('mapbox-gl').catch(() => {});
      void fetch('assets/countries.geojson').catch(() => {});
      void import('../stats/stats.page').catch(() => {});
      void import('../settings/settings.page').catch(() => {});
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => run(), { timeout: 4000 });
    } else {
      setTimeout(run, 300);
    }
  }
}
