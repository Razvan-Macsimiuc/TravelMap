import {
  Component,
  OnDestroy,
  AfterViewInit,
  inject,
  ElementRef,
  viewChild,
  NgZone,
  effect,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonSpinner,
  ToastController,
  ViewWillLeave,
} from '@ionic/angular/standalone';
import { AnimatedBackgroundComponent } from '../components/animated-background/animated-background.component';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  addCircleOutline,
  informationCircleOutline,
  closeCircleOutline,
  refreshOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { CountryService } from '../services/country.service';
import { ErrorService } from '../services/error.service';
import { AchievementService } from '../services/achievement.service';
import { PageTransitionService } from '../services/page-transition.service';
import { Country } from '../models/country.model';
import { environment } from '../../environments/environment';
import mapboxgl from 'mapbox-gl';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { ConfettiEffect } from '../utils/confetti';

// Natural Earth countries GeoJSON from public dataset
const COUNTRIES_GEOJSON_URL =
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

// Color constants - Dark Theme palette (matching app design)
const VISITED_COLOR = '#22d3ee'; // Cyan (matching primary)
const UNVISITED_COLOR = '#1e293b'; // Dark slate (matches card backgrounds)
const HOVER_VISITED_COLOR = '#38bdf8'; // Lighter cyan on hover
const HOVER_UNVISITED_COLOR = '#334155'; // Slightly lighter slate on hover
const BORDER_COLOR = 'rgba(255, 255, 255, 0.08)'; // Subtle white border

// Set Mapbox access token
mapboxgl.accessToken = environment.mapboxToken;

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss', '../styles/premium-header.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonSpinner,
    AnimatedBackgroundComponent,
  ],
  // Note: CountryPreviewCardComponent will be lazy-loaded when needed
})
export class MapPage implements AfterViewInit, OnDestroy, ViewWillLeave {
  private readonly countryService = inject(CountryService);
  private readonly errorService = inject(ErrorService);
  private readonly achievementService = inject(AchievementService);
  private readonly pageTransitionService = inject(PageTransitionService);
  private readonly ngZone = inject(NgZone);
  private readonly toastController = inject(ToastController);
  private readonly router = inject(Router);

  private readonly mapContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  readonly countries = this.countryService.countries;
  readonly visitedCountries = this.countryService.visitedCountries;
  readonly visitedCount = this.countryService.visitedCount;
  readonly totalCount = this.countryService.totalCount;

  private map: mapboxgl.Map | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private hoveredFeatureId: number | string | null = null;
  private mapLoaded = false;
  private confetti: ConfettiEffect | null = null;

  // Loading and error states
  readonly isMapLoading = signal(true);
  readonly isCountriesLoading = signal(true);
  readonly mapLoadError = signal<string | null>(null);

  // Dock state signals
  readonly showDock = signal(false);
  readonly dockAnimating = signal(false);
  readonly dockPosition = signal({ x: 0, y: 0 });

  // Selected country signals
  private readonly selectedCountryCode = signal<string>('');
  readonly selectedCountryName = signal<string>('');

  readonly selectedCountryFlag = computed(() =>
    this.countryCodeToFlag(this.selectedCountryCode())
  );

  readonly selectedCountryVisited = computed(() => {
    const code = this.selectedCountryCode();
    if (!code) return false;
    return this.countryService.getCountryByCode(code)?.visited ?? false;
  });

  // Hover preview card state
  readonly showPreviewCard = signal(false);
  readonly hoveredCountry = signal<Country | null>(null);

  // Long-press menu state
  readonly showCircularMenu = signal(false);
  readonly circularMenuPosition = signal({ x: 0, y: 0 });
  private longPressTimer: number | null = null;
  private readonly LONG_PRESS_DURATION = 500; // ms

  // Zoom level for adaptive details
  readonly currentZoom = signal(2);

  constructor() {
    addIcons({
      checkmarkCircle,
      addCircleOutline,
      informationCircleOutline,
      closeCircleOutline,
      refreshOutline,
      alertCircleOutline,
    });

    // Effect to update map colors when visited countries change
    effect(() => {
      const visited = this.visitedCountries();
      if (this.mapLoaded && this.map) {
        this.updateCountryColors(visited.map((c) => c.code));
      }
    });
  }

  ngAfterViewInit(): void {
    this.initializeMap();

    // Initialize confetti effect
    const container = this.mapContainer().nativeElement;
    this.confetti = new ConfettiEffect(container);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.confetti?.destroy();
    this.map?.remove();
    this.map = null;
  }

  /**
   * Ionic lifecycle hook - called when navigating away from this page.
   * Closes any open dock/overlays.
   */
  ionViewWillLeave(): void {
    if (this.showDock()) {
      this.closeDock();
    }
  }

  // ============================================
  // Dock Public Methods (called from template)
  // ============================================

  closeDock(): void {
    this.dockAnimating.set(false);
    setTimeout(() => {
      this.showDock.set(false);
      this.selectedCountryCode.set('');
      this.selectedCountryName.set('');
    }, 250);
  }

  async onDockToggleVisited(): Promise<void> {
    const code = this.selectedCountryCode();
    const name = this.selectedCountryName();
    if (!code) return;

    // Get old status before toggling
    const wasVisited =
      this.countryService.getCountryByCode(code)?.visited ?? false;

    // Toggle visited status
    this.countryService.toggleVisited(code, name);
    const newStatus =
      this.countryService.getCountryByCode(code)?.visited ?? false;

    // Celebration effects when marking as visited
    if (!wasVisited && newStatus) {
      // Haptic feedback
      await this.triggerHapticFeedback();

      // Confetti burst at dock position (viewport coordinates)
      if (this.confetti) {
        const pos = this.dockPosition();
        console.log('[MapPage] Triggering confetti at viewport coords:', pos);
        this.confetti.burst(pos.x, pos.y, 30);
      }

      // Add ripple effect class to map
      this.addRippleEffect();

      // Check for milestone achievements
      const visitedCount = this.countryService.visitedCount();
      await this.achievementService.checkMilestone(visitedCount);
    }

    this.showCountryToast(name, newStatus);
  }

  /**
   * Trigger haptic feedback on supported devices.
   */
  private async triggerHapticFeedback(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Haptics not available on web, silently ignore
    }
  }

  /**
   * Add ripple effect animation to map.
   */
  private addRippleEffect(): void {
    const container = this.mapContainer().nativeElement;
    container.classList.add('celebrate-ripple');
    setTimeout(() => {
      container.classList.remove('celebrate-ripple');
    }, 600);
  }

  onDockViewDetails(): void {
    const code = this.selectedCountryCode();
    const name = this.selectedCountryName();
    if (!code) return;

    // Store transition state with dock position
    const position = this.dockPosition();
    this.pageTransitionService.startTransition(code, name, position);

    this.closeDock();
    // Small delay for dock close animation
    setTimeout(() => {
      this.navigateToCountryDetail(code);
    }, 150);
  }

  // ============================================
  // Private Methods
  // ============================================

  private initializeMap(): void {
    const container = this.mapContainer().nativeElement;

    try {
      this.isMapLoading.set(true);
      this.mapLoadError.set(null);

      this.map = new mapboxgl.Map({
        container,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [0, 20],
        zoom: 1.8,
        minZoom: 1,
        maxZoom: 8,
        attributionControl: true, // Required by Mapbox ToS
        projection: 'globe', // Use globe projection for 3D effect
      });

      this.map.on('load', () => {
        this.setupGlobeAtmosphere();
        this.loadCountriesLayer();
      });

      this.map.on('error', (e) => {
        this.ngZone.run(() => {
          this.handleMapError(e.error);
        });
      });

      // Track zoom level for adaptive details
      this.map.on('zoom', () => {
        if (this.map) {
          const zoom = this.map.getZoom();
          this.currentZoom.set(zoom);
        }
      });

      // Handle map resize when tab becomes visible
      this.setupResizeObserver(container);
    } catch (error) {
      this.handleMapError(error);
    }
  }

  /**
   * Setup globe atmosphere and fog for immersive space-like effect.
   */
  private setupGlobeAtmosphere(): void {
    if (!this.map) return;

    // Add atmosphere glow around the globe
    this.map.setFog({
      color: 'rgb(10, 15, 26)', // Dark background matching app theme
      'high-color': 'rgb(20, 30, 50)', // Slight blue tint at horizon
      'horizon-blend': 0.1,
      'space-color': 'rgb(5, 10, 20)', // Deep space color
      'star-intensity': 0.15, // Subtle stars in background
    });
  }

  /**
   * Handle map initialization or loading errors.
   */
  private handleMapError(error: unknown): void {
    this.isMapLoading.set(false);
    this.isCountriesLoading.set(false);

    const message = 'Failed to load the map. Please check your connection.';
    this.mapLoadError.set(message);
    this.errorService.logError('MapPage.handleMapError', error);
  }

  /**
   * Retry loading the map after an error.
   */
  retryMapLoad(): void {
    this.mapLoadError.set(null);
    this.map?.remove();
    this.map = null;
    this.mapLoaded = false;
    this.initializeMap();
  }

  private async loadCountriesLayer(): Promise<void> {
    if (!this.map) return;

    this.isCountriesLoading.set(true);

    try {
      // First try to load from local assets, fallback to CDN
      let geojsonData: GeoJSON.FeatureCollection;

      try {
        const localResponse = await fetch('assets/countries.geojson');
        if (!localResponse.ok) {
          throw new Error(`HTTP ${localResponse.status}`);
        }
        const localData = await localResponse.json();

        // Check if local file has actual features
        if (localData.features && localData.features.length > 0) {
          geojsonData = localData;
        } else {
          throw new Error('Local GeoJSON is empty');
        }
      } catch {
        // Fallback to CDN
        console.log('Loading countries data from CDN...');
        const response = await fetch(COUNTRIES_GEOJSON_URL);
        if (!response.ok) {
          throw new Error(`Failed to load countries: HTTP ${response.status}`);
        }
        geojsonData = await response.json();
      }

      this.addCountriesSource(geojsonData);
      this.addCountriesLayers();
      this.setupMapInteractions();
      this.mapLoaded = true;

      // Initial color update
      this.updateCountryColors(this.visitedCountries().map((c) => c.code));

      // Clear loading states
      this.ngZone.run(() => {
        this.isMapLoading.set(false);
        this.isCountriesLoading.set(false);
      });
    } catch (error) {
      this.errorService.logError('MapPage.loadCountriesLayer', error);

      this.ngZone.run(() => {
        this.isMapLoading.set(false);
        this.isCountriesLoading.set(false);
        this.mapLoadError.set(
          'Failed to load country data. Please check your connection and try again.'
        );
      });
    }
  }

  private addCountriesSource(geojsonData: GeoJSON.FeatureCollection): void {
    if (!this.map) return;

    this.map.addSource('countries', {
      type: 'geojson',
      data: geojsonData,
      generateId: true,
    });
  }

  private addCountriesLayers(): void {
    if (!this.map) return;

    // Find the first symbol layer to insert below labels
    const layers = this.map.getStyle().layers;
    let firstSymbolId: string | undefined;
    for (const layer of layers) {
      if (layer.type === 'symbol') {
        firstSymbolId = layer.id;
        break;
      }
    }

    // Country fill layer with dynamic coloring
    this.map.addLayer(
      {
        id: 'countries-fill',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': UNVISITED_COLOR,
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.95,
            0.85,
          ],
        },
      },
      firstSymbolId
    );

    // Country borders - subtle for dark theme
    this.map.addLayer(
      {
        id: 'countries-border',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color': BORDER_COLOR,
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1.5,
            0.5,
          ],
        },
      },
      firstSymbolId
    );

    // Visited country glow effect (subtle outer glow)
    this.map.addLayer(
      {
        id: 'countries-glow',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color': VISITED_COLOR,
          'line-width': 3,
          'line-blur': 4,
          'line-opacity': 0,
        },
      },
      'countries-fill'
    );
  }

  private setupMapInteractions(): void {
    if (!this.map) return;

    // Click handler for country selection
    this.map.on('click', 'countries-fill', (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const properties = feature.properties;

      // Get ISO code and country name using helper methods
      const isoCode = this.extractIsoCode(properties);
      const countryName = this.extractCountryName(properties);

      // Get the center of the clicked country
      const countryCenter = this.getFeatureCenter(feature);

      if (
        isoCode &&
        isoCode !== '-99' &&
        isoCode !== '-1' &&
        isoCode.length === 2
      ) {
        this.ngZone.run(() => {
          this.openDockWithCenter(isoCode, countryName, countryCenter);
        });
      } else {
        // Country not in our tracked list, just show name
        console.debug(
          '[MapPage] Country without valid ISO:',
          countryName,
          properties
        );
        this.ngZone.run(() => {
          this.showCountryToast(countryName, false, true);
        });
      }
    });

    // Hover effect - mouseenter
    this.map.on('mouseenter', 'countries-fill', (e) => {
      if (!this.map) return;
      this.map.getCanvas().style.cursor = 'pointer';

      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const properties = feature.properties as Record<string, unknown>;

        // Remove previous hover state
        if (this.hoveredFeatureId !== null) {
          this.map.setFeatureState(
            { source: 'countries', id: this.hoveredFeatureId },
            { hover: false }
          );
        }

        this.hoveredFeatureId = feature.id ?? null;

        if (this.hoveredFeatureId !== null) {
          this.map.setFeatureState(
            { source: 'countries', id: this.hoveredFeatureId },
            { hover: true }
          );
        }

        // Show preview card for visited countries
        const isoCode = this.extractIsoCode(properties);
        if (isoCode) {
          const country = this.countryService.getCountryByCode(isoCode);
          if (country?.visited) {
            this.ngZone.run(() => {
              this.hoveredCountry.set(country);
            });
          }
        }
      }
    });

    // Hover effect - mousemove (for smoother transitions between countries)
    this.map.on('mousemove', 'countries-fill', (e) => {
      if (!this.map || !e.features || e.features.length === 0) return;

      const newFeatureId = e.features[0].id ?? null;

      if (newFeatureId !== this.hoveredFeatureId) {
        // Remove previous hover state
        if (this.hoveredFeatureId !== null) {
          this.map.setFeatureState(
            { source: 'countries', id: this.hoveredFeatureId },
            { hover: false }
          );
        }

        this.hoveredFeatureId = newFeatureId;

        if (this.hoveredFeatureId !== null) {
          this.map.setFeatureState(
            { source: 'countries', id: this.hoveredFeatureId },
            { hover: true }
          );
        }
      }
    });

    // Hover effect - mouseleave
    this.map.on('mouseleave', 'countries-fill', () => {
      if (!this.map) return;
      this.map.getCanvas().style.cursor = '';

      if (this.hoveredFeatureId !== null) {
        this.map.setFeatureState(
          { source: 'countries', id: this.hoveredFeatureId },
          { hover: false }
        );
        this.hoveredFeatureId = null;
      }

      // Hide hover preview card
      this.ngZone.run(() => {
        this.hoveredCountry.set(null);
      });
    });
  }

  /**
   * Calculate the center point of a GeoJSON feature.
   * Uses label point if available, otherwise finds the largest polygon's center.
   */
  private getFeatureCenter(
    feature: mapboxgl.MapboxGeoJSONFeature
  ): [number, number] {
    const properties = feature.properties;
    const geometry = feature.geometry;

    // Try to use label coordinates from properties if available
    if (properties?.['LABEL_X'] && properties?.['LABEL_Y']) {
      return [properties['LABEL_X'] as number, properties['LABEL_Y'] as number];
    }

    // Try centroid properties
    if (properties?.['centroid']) {
      const centroid = properties['centroid'];
      if (Array.isArray(centroid) && centroid.length === 2) {
        return centroid as [number, number];
      }
    }

    if (geometry.type === 'Point') {
      return geometry.coordinates as [number, number];
    }

    // For MultiPolygon, find the largest polygon and use its center
    // This avoids overseas territories pulling the center off the mainland
    if (geometry.type === 'MultiPolygon') {
      let largestPolygon: number[][][] | null = null;
      let largestArea = 0;

      (geometry.coordinates as number[][][][]).forEach((polygon) => {
        const area = this.approximatePolygonArea(polygon[0]); // Use outer ring
        if (area > largestArea) {
          largestArea = area;
          largestPolygon = polygon;
        }
      });

      if (largestPolygon) {
        return this.getPolygonCenter(largestPolygon[0]);
      }
    }

    // For single Polygon, use its center
    if (geometry.type === 'Polygon') {
      return this.getPolygonCenter((geometry.coordinates as number[][][])[0]);
    }

    // Fallback: bounding box center of all coordinates
    let minLng = Infinity,
      maxLng = -Infinity;
    let minLat = Infinity,
      maxLat = -Infinity;

    const processCoords = (coords: number[]) => {
      const lng = coords[0];
      const lat = coords[1];
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    };

    const traverseCoords = (arr: unknown[]): void => {
      if (typeof arr[0] === 'number') {
        processCoords(arr as number[]);
      } else {
        (arr as unknown[][]).forEach((item) => traverseCoords(item));
      }
    };

    if ('coordinates' in geometry) {
      traverseCoords(geometry.coordinates as unknown[]);
    }

    return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
  }

  /**
   * Calculate approximate area of a polygon (for finding largest polygon).
   * Uses shoelace formula - result is in arbitrary units, just for comparison.
   */
  private approximatePolygonArea(ring: number[][]): number {
    let area = 0;
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += ring[i][0] * ring[j][1];
      area -= ring[j][0] * ring[i][1];
    }
    return Math.abs(area / 2);
  }

  /**
   * Get the center of a polygon ring (bounding box center).
   */
  private getPolygonCenter(ring: number[][]): [number, number] {
    let minLng = Infinity,
      maxLng = -Infinity;
    let minLat = Infinity,
      maxLat = -Infinity;

    ring.forEach((coord) => {
      minLng = Math.min(minLng, coord[0]);
      maxLng = Math.max(maxLng, coord[0]);
      minLat = Math.min(minLat, coord[1]);
      maxLat = Math.max(maxLat, coord[1]);
    });

    return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
  }

  /**
   * Open the country dock and center the map on the country.
   */
  private openDockWithCenter(
    isoCode: string,
    countryName: string,
    center: [number, number]
  ): void {
    // Close existing dock if open
    if (this.showDock()) {
      this.closeDock();
      return;
    }

    // Set selected country
    this.selectedCountryCode.set(isoCode);
    this.selectedCountryName.set(countryName);

    // Pan the map to center on the country with smooth animation
    if (this.map) {
      this.map.flyTo({
        center: center,
        duration: 500,
        essential: true,
      });
    }

    // Calculate dock position at center of viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const headerOffset = 56;
    const tabBarHeight = 96;

    // Position dock at center, slightly above middle to account for pointer
    const x = viewportWidth / 2;
    const y = (viewportHeight - headerOffset - tabBarHeight) / 2 + headerOffset;

    this.dockPosition.set({ x, y });

    // Show dock after a small delay for the map animation to start
    setTimeout(() => {
      this.showDock.set(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.dockAnimating.set(true);
        });
      });
    }, 200);
  }

  /**
   * Navigate to the country detail page.
   */
  private navigateToCountryDetail(countryCode: string): void {
    this.router.navigate(['/country', countryCode.toUpperCase()]);
  }

  /**
   * Convert ISO 3166-1 alpha-2 country code to flag emoji.
   */
  private countryCodeToFlag(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '🏳️';
    const code = countryCode.toUpperCase();
    const codePoints = [...code].map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  private updateCountryColors(visitedIsoCodes: string[]): void {
    if (!this.map || !this.mapLoaded) return;

    const fillColorExpression: mapboxgl.Expression = this.buildColorExpression(
      visitedIsoCodes,
      VISITED_COLOR,
      UNVISITED_COLOR,
      HOVER_VISITED_COLOR,
      HOVER_UNVISITED_COLOR
    );

    this.map.setPaintProperty(
      'countries-fill',
      'fill-color',
      fillColorExpression
    );

    // Update glow effect for visited countries
    if (this.map.getLayer('countries-glow')) {
      const glowOpacityExpression: mapboxgl.Expression =
        this.buildGlowOpacityExpression(visitedIsoCodes);
      this.map.setPaintProperty(
        'countries-glow',
        'line-opacity',
        glowOpacityExpression
      );
    }
  }

  /**
   * Build expression for glow opacity (only visible on visited countries)
   */
  private buildGlowOpacityExpression(
    visitedIsoCodes: string[]
  ): mapboxgl.Expression {
    if (visitedIsoCodes.length === 0) {
      return ['literal', 0] as mapboxgl.Expression;
    }

    // Build match expression for visited country glow
    const matchExpression: unknown[] = ['match'];
    matchExpression.push([
      'coalesce',
      ['get', 'ISO_A2'],
      ['get', 'iso_a2'],
      '',
    ]);

    visitedIsoCodes.forEach((code) => {
      matchExpression.push(code.toUpperCase());
      matchExpression.push(0.5); // Glow opacity for visited
    });

    matchExpression.push(0); // Default: no glow for unvisited

    return matchExpression as mapboxgl.Expression;
  }

  private buildColorExpression(
    visitedIsoCodes: string[],
    visitedColor: string,
    unvisitedColor: string,
    hoverVisitedColor: string,
    hoverUnvisitedColor: string
  ): mapboxgl.Expression {
    if (visitedIsoCodes.length === 0) {
      return [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        hoverUnvisitedColor,
        unvisitedColor,
      ];
    }

    // Get country names for visited countries (for fallback matching)
    const visitedCountryNames = visitedIsoCodes
      .map((code) => this.countryService.getCountryByCode(code)?.name)
      .filter((name): name is string => !!name);

    // Build a case expression that checks both ISO codes AND country names
    const caseExpression: unknown[] = ['case'];

    // First, add conditions for ISO code matches
    visitedIsoCodes.forEach((code) => {
      caseExpression.push([
        'any',
        ['==', ['coalesce', ['get', 'ISO_A2'], ''], code.toUpperCase()],
        ['==', ['coalesce', ['get', 'iso_a2'], ''], code.toUpperCase()],
        [
          '==',
          ['coalesce', ['get', 'ISO3166-1-Alpha-2'], ''],
          code.toUpperCase(),
        ],
      ]);
      caseExpression.push([
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        hoverVisitedColor,
        visitedColor,
      ]);
    });

    // Add conditions for country name matches (fallback for -99 ISO codes)
    visitedCountryNames.forEach((name) => {
      caseExpression.push([
        'any',
        [
          '==',
          ['downcase', ['coalesce', ['get', 'ADMIN'], '']],
          name.toLowerCase(),
        ],
        [
          '==',
          ['downcase', ['coalesce', ['get', 'name'], '']],
          name.toLowerCase(),
        ],
        [
          '==',
          ['downcase', ['coalesce', ['get', 'NAME'], '']],
          name.toLowerCase(),
        ],
      ]);
      caseExpression.push([
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        hoverVisitedColor,
        visitedColor,
      ]);
    });

    // Default case (unvisited)
    caseExpression.push([
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      hoverUnvisitedColor,
      unvisitedColor,
    ]);

    return caseExpression as mapboxgl.Expression;
  }

  private async showCountryToast(
    countryName: string,
    isVisited: boolean,
    notTracked = false
  ): Promise<void> {
    let message: string;
    let color: string;

    if (notTracked) {
      message = `${countryName}`;
      color = 'medium';
    } else if (isVisited) {
      message = `✅ ${countryName} marked as visited!`;
      color = 'success';
    } else {
      message = `${countryName} removed from visited`;
      color = 'medium';
    }

    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'top',
      color,
      cssClass: 'country-toast',
    });

    await toast.present();
  }

  private setupResizeObserver(container: HTMLElement): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          this.map?.resize();
        }, 100);
      });
    });

    this.resizeObserver.observe(container);

    const ionContent = container.closest('ion-content');
    if (ionContent) {
      this.resizeObserver.observe(ionContent);
    }
  }

  /**
   * Extract ISO 2-letter code from GeoJSON feature properties.
   * Handles various GeoJSON formats and falls back to name-based lookup.
   */
  private extractIsoCode(properties: Record<string, unknown> | null): string {
    if (!properties) return '';

    // Try direct ISO code properties first
    const directCodes = [
      properties['ISO3166-1-Alpha-2'],
      properties['ISO_A2'],
      properties['iso_a2'],
      properties['ISO'],
      properties['iso'],
    ];

    for (const code of directCodes) {
      if (
        typeof code === 'string' &&
        code.length === 2 &&
        code !== '-99' &&
        code !== '-1'
      ) {
        return code.toUpperCase();
      }
    }

    // Try to derive from 3-letter code
    const iso3Codes = [
      properties['ISO3166-1-Alpha-3'],
      properties['ISO_A3'],
      properties['iso_a3'],
    ];

    for (const code of iso3Codes) {
      if (typeof code === 'string' && code.length === 3 && code !== '-99') {
        const iso2 = this.iso3ToIso2(code);
        if (iso2) return iso2;
      }
    }

    // Fallback: lookup by country name
    const countryName = this.extractCountryName(properties);
    if (countryName) {
      const iso2 = this.nameToIso2(countryName);
      if (iso2) return iso2;
    }

    return '';
  }

  /**
   * Extract country name from GeoJSON feature properties.
   */
  private extractCountryName(
    properties: Record<string, unknown> | null
  ): string {
    if (!properties) return 'Unknown Country';

    const nameFields = [
      properties['name'],
      properties['NAME'],
      properties['ADMIN'],
      properties['admin'],
      properties['NAME_LONG'],
      properties['name_long'],
      properties['COUNTRY'],
      properties['country'],
    ];

    for (const name of nameFields) {
      if (typeof name === 'string' && name.length > 0) {
        return name;
      }
    }

    return 'Unknown Country';
  }

  /**
   * Convert ISO 3-letter code to ISO 2-letter code.
   */
  private iso3ToIso2(iso3: string): string | null {
    const iso3Map: Record<string, string> = {
      FRA: 'FR',
      DEU: 'DE',
      GBR: 'GB',
      USA: 'US',
      ESP: 'ES',
      ITA: 'IT',
      PRT: 'PT',
      NLD: 'NL',
      BEL: 'BE',
      CHE: 'CH',
      AUT: 'AT',
      POL: 'PL',
      CZE: 'CZ',
      GRC: 'GR',
      TUR: 'TR',
      RUS: 'RU',
      UKR: 'UA',
      NOR: 'NO',
      SWE: 'SE',
      FIN: 'FI',
      DNK: 'DK',
      IRL: 'IE',
      HUN: 'HU',
      ROU: 'RO',
      BGR: 'BG',
      HRV: 'HR',
      SVK: 'SK',
      SVN: 'SI',
      SRB: 'RS',
      ALB: 'AL',
      MKD: 'MK',
      MNE: 'ME',
      BIH: 'BA',
      LTU: 'LT',
      LVA: 'LV',
      EST: 'EE',
      BLR: 'BY',
      MDA: 'MD',
      ISL: 'IS',
      LUX: 'LU',
      MLT: 'MT',
      CYP: 'CY',
      CHN: 'CN',
      JPN: 'JP',
      KOR: 'KR',
      PRK: 'KP',
      IND: 'IN',
      PAK: 'PK',
      BGD: 'BD',
      THA: 'TH',
      VNM: 'VN',
      MYS: 'MY',
      IDN: 'ID',
      PHL: 'PH',
      AUS: 'AU',
      NZL: 'NZ',
      CAN: 'CA',
      MEX: 'MX',
      BRA: 'BR',
      ARG: 'AR',
      CHL: 'CL',
      COL: 'CO',
      PER: 'PE',
      VEN: 'VE',
      ECU: 'EC',
      BOL: 'BO',
      PRY: 'PY',
      URY: 'UY',
      EGY: 'EG',
      ZAF: 'ZA',
      MAR: 'MA',
      DZA: 'DZ',
      TUN: 'TN',
      LBY: 'LY',
      NGA: 'NG',
      KEN: 'KE',
      ETH: 'ET',
      TZA: 'TZ',
      SAU: 'SA',
      ARE: 'AE',
      ISR: 'IL',
      IRN: 'IR',
      IRQ: 'IQ',
      JOR: 'JO',
      LBN: 'LB',
      SYR: 'SY',
      KAZ: 'KZ',
      UZB: 'UZ',
      AFG: 'AF',
    };
    return iso3Map[iso3.toUpperCase()] || null;
  }

  /**
   * Lookup ISO 2-letter code by country name.
   */
  private nameToIso2(name: string): string | null {
    const nameMap: Record<string, string> = {
      france: 'FR',
      germany: 'DE',
      'united kingdom': 'GB',
      'united states': 'US',
      'united states of america': 'US',
      spain: 'ES',
      italy: 'IT',
      portugal: 'PT',
      netherlands: 'NL',
      belgium: 'BE',
      switzerland: 'CH',
      austria: 'AT',
      poland: 'PL',
      'czech republic': 'CZ',
      czechia: 'CZ',
      greece: 'GR',
      turkey: 'TR',
      russia: 'RU',
      'russian federation': 'RU',
      ukraine: 'UA',
      norway: 'NO',
      sweden: 'SE',
      finland: 'FI',
      denmark: 'DK',
      ireland: 'IE',
      hungary: 'HU',
      romania: 'RO',
      bulgaria: 'BG',
      croatia: 'HR',
      slovakia: 'SK',
      slovenia: 'SI',
      serbia: 'RS',
      albania: 'AL',
      'north macedonia': 'MK',
      montenegro: 'ME',
      'bosnia and herzegovina': 'BA',
      lithuania: 'LT',
      latvia: 'LV',
      estonia: 'EE',
      belarus: 'BY',
      moldova: 'MD',
      iceland: 'IS',
      luxembourg: 'LU',
      malta: 'MT',
      cyprus: 'CY',
      china: 'CN',
      japan: 'JP',
      'south korea': 'KR',
      'north korea': 'KP',
      india: 'IN',
      pakistan: 'PK',
      bangladesh: 'BD',
      thailand: 'TH',
      vietnam: 'VN',
      malaysia: 'MY',
      indonesia: 'ID',
      philippines: 'PH',
      australia: 'AU',
      'new zealand': 'NZ',
      canada: 'CA',
      mexico: 'MX',
      brazil: 'BR',
      argentina: 'AR',
      chile: 'CL',
      colombia: 'CO',
      peru: 'PE',
      venezuela: 'VE',
      ecuador: 'EC',
      bolivia: 'BO',
      paraguay: 'PY',
      uruguay: 'UY',
      egypt: 'EG',
      'south africa': 'ZA',
      morocco: 'MA',
      algeria: 'DZ',
      tunisia: 'TN',
      libya: 'LY',
      nigeria: 'NG',
      kenya: 'KE',
      ethiopia: 'ET',
      tanzania: 'TZ',
      'saudi arabia': 'SA',
      'united arab emirates': 'AE',
      israel: 'IL',
      iran: 'IR',
      iraq: 'IQ',
      jordan: 'JO',
      lebanon: 'LB',
      syria: 'SY',
      kazakhstan: 'KZ',
      uzbekistan: 'UZ',
      afghanistan: 'AF',
    };
    return nameMap[name.toLowerCase()] || null;
  }
}
