import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSearchbar,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  earthOutline,
  trophyOutline,
  statsChartOutline,
  chevronBackOutline,
} from 'ionicons/icons';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  finalize,
  of,
} from 'rxjs';
import { CountryService } from '../services/country.service';
import { CitySearchService, type CityResult } from '../services/city-search.service';
import { BirthplaceService } from '../services/birthplace.service';
import { AssetPrefetchService } from '../services/asset-prefetch.service';
import type { Country } from '../models/country.model';

interface OnboardingSlide {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSearchbar,
    IonSpinner,
  ],
  templateUrl: './welcome.page.html',
  styleUrls: ['welcome.page.scss'],
})
export class WelcomePage implements OnInit {
  private readonly router = inject(Router);
  private readonly countryService = inject(CountryService);
  private readonly citySearch = inject(CitySearchService);
  private readonly birthplaceService = inject(BirthplaceService);
  private readonly assetPrefetch = inject(AssetPrefetchService);

  readonly animateIn = signal(false);
  readonly showBrand = signal(false);
  readonly showActions = signal(false);
  readonly currentSlide = signal(0);
  readonly flowPhase = signal<'slides' | 'birthplace'>('slides');

  readonly countryFilter = signal('');
  readonly filteredCountries = computed(() => {
    const q = this.countryFilter().trim().toLowerCase();
    const list = this.countryService.countries();
    if (!q) return list.slice(0, 50);
    return list.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 50);
  });

  readonly selectedCountry = signal<{ code: string; name: string } | null>(null);
  readonly cityQueryText = signal('');
  readonly cityResults = signal<CityResult[]>([]);
  readonly citySearching = signal(false);
  readonly selectedCity = signal<CityResult | null>(null);

  readonly canSaveBirthplace = computed(
    () => !!this.selectedCountry() && !!this.selectedCity()
  );

  readonly slides: OnboardingSlide[] = [
    {
      icon: 'earth-outline',
      title: 'Track Your Travels',
      description:
        "Mark countries you've visited on an interactive world map and watch your travel footprint grow.",
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
    },
    {
      icon: 'trophy-outline',
      title: 'Earn Achievements',
      description:
        'Unlock milestones and special badges as you visit new countries and regions.',
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ff8a8a 100%)',
    },
    {
      icon: 'stats-chart-outline',
      title: 'See Your Progress',
      description:
        'Unlock achievements and track statistics as you explore more of the world.',
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #fcd34d 100%)',
    },
  ];

  constructor() {
    addIcons({
      arrowForwardOutline,
      earthOutline,
      trophyOutline,
      statsChartOutline,
      chevronBackOutline,
    });

    toObservable(this.cityQueryText)
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          const sel = this.selectedCountry();
          const trimmed = q.trim();
          if (!sel || trimmed.length < 2) {
            this.citySearching.set(false);
            this.cityResults.set([]);
            return of([]);
          }
          this.citySearching.set(true);
          return this.citySearch.searchCities(trimmed, sel.code).pipe(
            finalize(() => this.citySearching.set(false))
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe((r) => this.cityResults.set(r));
  }

  ngOnInit(): void {
    this.assetPrefetch.warmupHeavyMapResources();
    setTimeout(() => this.animateIn.set(true), 100);
    setTimeout(() => this.showBrand.set(true), 300);
    setTimeout(() => this.showActions.set(true), 800);
  }

  nextSlide(): void {
    if (this.currentSlide() < this.slides.length - 1) {
      this.currentSlide.update((n) => n + 1);
    }
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
  }

  /** From slides: always opens birthplace (same as Continue). Map is only after birthplace Skip or save. */
  skip(): void {
    this.goToBirthplaceStep();
  }

  goToBirthplaceStep(): void {
    this.flowPhase.set('birthplace');
  }

  backToSlides(): void {
    this.flowPhase.set('slides');
  }

  skipBirthplace(): void {
    this.finishWelcome();
  }

  finishWelcome(): void {
    localStorage.setItem('hopahopa_welcome_seen', 'true');
    void this.router.navigate(['/map'], { replaceUrl: true });
  }

  async saveBirthplaceAndFinish(): Promise<void> {
    const c = this.selectedCountry();
    const city = this.selectedCity();
    if (!c || !city) return;
    await this.birthplaceService.save({
      countryCode: c.code,
      countryName: c.name,
      cityName: city.name,
      lng: city.coordinates[0],
      lat: city.coordinates[1],
    });
    this.finishWelcome();
  }

  onCountryFilter(ev: Event): void {
    const ce = ev as CustomEvent<{ value?: string | null }>;
    this.countryFilter.set(String(ce.detail?.value ?? ''));
  }

  onCityQuery(ev: Event): void {
    const ce = ev as CustomEvent<{ value?: string | null }>;
    this.selectedCity.set(null);
    this.cityQueryText.set(String(ce.detail?.value ?? ''));
  }

  selectCountry(c: Country): void {
    this.selectedCountry.set({ code: c.code, name: c.name });
    this.cityQueryText.set('');
    this.cityResults.set([]);
    this.selectedCity.set(null);
  }

  selectCity(r: CityResult): void {
    this.selectedCity.set(r);
  }

  isSelectedCity(r: CityResult): boolean {
    const s = this.selectedCity();
    if (!s) return false;
    return s.name === r.name && s.subtitle === r.subtitle;
  }
}
