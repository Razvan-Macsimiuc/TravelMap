import {
  Component,
  OnInit,
  inject,
  computed,
  signal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap, debounceTime, of } from 'rxjs';
import { CommonModule } from '@angular/common';

import { ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonToggle,
  IonIcon,
  IonSkeletonText,
  IonInput,
  NavController,
} from '@ionic/angular/standalone';
import { AnimatedBackgroundComponent } from '../components/animated-background/animated-background.component';
import { addIcons } from 'ionicons';
import {
  bagCheckOutline,
  checkmarkCircle,
  closeCircle,
  closeOutline,
  globeOutline,
  locationOutline,
  lockClosedOutline,
  restaurantOutline,
  searchOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { CountryService } from '../services/country.service';
import { PageTransitionService } from '../services/page-transition.service';
import { AchievementService } from '../services/achievement.service';
import { CitySearchService, CityResult } from '../services/city-search.service';
import { Country } from '../models/country.model';
import type { CountryInsights } from '../data/country-insights.types';
import { CountryInsightsLoaderService } from '../services/country-insights-loader.service';
@Component({
  selector: 'app-country-detail',
  templateUrl: 'country-detail.page.html',
  styleUrls: ['country-detail.page.scss', '../styles/premium-header.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonToggle,
    IonIcon,
    IonSkeletonText,
    IonInput,
    AnimatedBackgroundComponent,
  ],
})
export class CountryDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly countryService = inject(CountryService);
  private readonly pageTransitionService = inject(PageTransitionService);
  private readonly achievementService = inject(AchievementService);
  private readonly citySearchService = inject(CitySearchService);
  private readonly navController = inject(NavController);
  private readonly insightsLoader = inject(CountryInsightsLoaderService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly countryCode = signal<string>('');

  readonly country = computed<Country | undefined>(() => {
    const code = this.countryCode();
    return code ? this.countryService.getCountryByCode(code) : undefined;
  });

  readonly insights = signal<CountryInsights | null>(null);
  readonly insightsLoading = signal(true);
  readonly insightsFromWikipedia = signal(false);

  readonly flagUrl = computed(() => {
    const code = this.countryCode();
    if (!code || code.length !== 2) return null;
    return `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
  });

  readonly isVisited = computed(() => this.country()?.visited ?? false);

  readonly cities = computed(() => this.country()?.cities ?? []);

  readonly newCityName = signal('');
  readonly citySearchResults = signal<CityResult[]>([]);
  readonly isCitySearching = signal(false);
  readonly showCityDropdown = signal(false);

  readonly isPageLoading = signal(true);
  readonly showHeader = signal(false);

  private readonly cityQuery$ = new Subject<string>();

  constructor() {
    addIcons({
      bagCheckOutline,
      checkmarkCircle,
      closeCircle,
      closeOutline,
      globeOutline,
      locationOutline,
      lockClosedOutline,
      restaurantOutline,
      searchOutline,
      sparklesOutline,
    });

    this.cityQuery$.pipe(
      debounceTime(350),
      switchMap((query) => {
        if (query.trim().length < 2) {
          this.isCitySearching.set(false);
          this.citySearchResults.set([]);
          this.showCityDropdown.set(false);
          return of([]);
        }
        this.isCitySearching.set(true);
        return this.citySearchService.searchCities(query, this.countryCode());
      }),
      takeUntilDestroyed(),
    ).subscribe((results) => {
      this.citySearchResults.set(results);
      this.showCityDropdown.set(results.length > 0);
      this.isCitySearching.set(false);
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((pm) => {
      const code = pm.get('code');
      if (code) {
        this.countryCode.set(code.toUpperCase());

        const transitionState = this.pageTransitionService.getTransitionState();
        if (transitionState.isTransitioning && transitionState.fromPosition) {
          this.triggerEntranceAnimations();
        } else {
          this.showHeader.set(true);
        }

        this.isPageLoading.set(false);
      } else {
        this.isPageLoading.set(false);
      }
      void this.loadInsights();
    });
  }

  private async loadInsights(): Promise<void> {
    const code = this.countryCode();
    const c = this.country();
    if (!code || !c) {
      this.insights.set(null);
      this.insightsLoading.set(false);
      this.insightsFromWikipedia.set(false);
      return;
    }
    this.insightsLoading.set(true);
    await this.insightsLoader.ensureLoaded();
    this.insights.set(this.insightsLoader.getBundle(code, c.name));
    this.insightsFromWikipedia.set(this.insightsLoader.shouldShowWikipediaFooter(code));
    this.insightsLoading.set(false);
  }

  async onVisitedToggle(event: CustomEvent): Promise<void> {
    const code = this.countryCode();
    const country = this.country();
    if (code && country) {
      this.countryService.toggleVisited(code, country.name);
      // Check achievements in both directions: newly earned ones celebrate,
      // revoked ones are removed and will re-celebrate when earned again.
      const visitedCodes = this.countryService.visitedCountries().map((c) => c.code);
      await this.achievementService.checkAchievements(visitedCodes);
    }
  }

  onCityInput(value: string): void {
    this.newCityName.set(value);
    this.cityQuery$.next(value);
  }

  selectCity(cityName: string, coordinates?: [number, number]): void {
    if (!this.isVisited()) return;
    this.showCityDropdown.set(false);
    this.citySearchResults.set([]);
    this.newCityName.set('');
    this.commitCity(cityName, coordinates);
  }

  addCity(): void {
    const name = this.newCityName().trim();
    this.showCityDropdown.set(false);
    this.citySearchResults.set([]);
    this.newCityName.set('');
    this.commitCity(name);
  }

  private commitCity(name: string, coordinates?: [number, number]): void {
    const code = this.countryCode();
    if (!name || !code) return;
    this.countryService.addCity(code, name, coordinates);
    const visitedCodes = this.countryService.visitedCountries().map((c) => c.code);
    this.achievementService.checkAchievements(visitedCodes);
  }

  removeCity(cityName: string): void {
    const code = this.countryCode();
    if (!code) return;
    this.countryService.removeCity(code, cityName);
    const visitedCodes = this.countryService.visitedCountries().map((c) => c.code);
    this.achievementService.checkAchievements(visitedCodes);
  }

  goBack(): void {
    this.showHeader.set(false);

    setTimeout(() => {
      this.navController.navigateBack('/map');
    }, 300);
  }

  private triggerEntranceAnimations(): void {
    setTimeout(() => {
      this.showHeader.set(true);
    }, 200);

    setTimeout(() => {
      this.pageTransitionService.completeTransition();
    }, 800);
  }

}
