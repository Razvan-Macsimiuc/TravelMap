import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { AnimatedBackgroundComponent } from '../components/animated-background/animated-background.component';
import { addIcons } from 'ionicons';
import {
  globeOutline,
  flagOutline,
  chevronForwardOutline,
  trophyOutline,
  airplaneOutline,
  ribbonOutline,
  starOutline,
  lockClosedOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { CountryService } from '../services/country.service';
import { AchievementService, AchievementCategory } from '../services/achievement.service';
import { Country } from '../models/country.model';

const TOTAL_WORLD_COUNTRIES = 195;

interface VisitedCountryItem extends Country {
  flagUrl: string;
}

type ViewMode = 'countries' | 'achievements';

@Component({
  selector: 'app-stats',
  templateUrl: 'stats.page.html',
  styleUrls: ['stats.page.scss', '../styles/premium-header.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    AnimatedBackgroundComponent,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
  ],
})
export class StatsPage implements ViewWillEnter {
  private readonly countryService = inject(CountryService);
  private readonly achievementService = inject(AchievementService);
  private readonly router = inject(Router);

  readonly totalWorldCountries = TOTAL_WORLD_COUNTRIES;

  // View mode toggle
  readonly viewMode = signal<ViewMode>('countries');

  // Computed signals for reactive stats
  readonly visitedCount = computed(() => this.countryService.visitedCount());

  readonly visitedPercentage = computed(() => {
    const count = this.visitedCount();
    return Math.round((count / TOTAL_WORLD_COUNTRIES) * 100);
  });

  readonly visitedCountries = computed(() => {
    const countries = this.countryService.visitedCountries();
    return countries
      .map((country) => ({
        ...country,
        flagUrl: this.countryToFlagUrl(country.code),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  // Achievement computed signals
  readonly milestoneAchievements = computed(() => 
    this.achievementService.milestoneAchievements()
  );

  readonly continentAchievements = computed(() => 
    this.achievementService.continentAchievements()
  );

  readonly specialAchievements = computed(() => 
    this.achievementService.specialAchievements()
  );

  readonly unlockedCount = computed(() => 
    this.achievementService.unlockedCount()
  );

  readonly totalAchievements = computed(() => 
    this.achievementService.totalCount()
  );

  readonly achievementProgress = computed(() => 
    this.achievementService.progressPercentage()
  );

  // Full ordered milestone thresholds — derived from the service so they always stay in sync
  private readonly milestoneThresholds = this.achievementService
    .getMilestones()
    .map((m) => m.count); // [1, 5, 10, 25, 50, 75, 100, 150, 195]

  readonly milestoneReached = computed(() => {
    const count = this.visitedCount();
    const milestones = this.achievementService.getMilestones();
    const reached = [...milestones].reverse().find((m) => count >= m.count);
    return reached ? { label: reached.title, threshold: reached.count } : null;
  });

  readonly nextMilestone = computed(() => {
    const count = this.visitedCount();
    const next = this.milestoneThresholds.find((t) => t > count);
    return next ?? this.milestoneThresholds[this.milestoneThresholds.length - 1];
  });

  readonly progressToNextMilestone = computed(() => {
    const count = this.visitedCount();
    const next = this.nextMilestone();
    const nextIdx = this.milestoneThresholds.indexOf(next);
    const prev = nextIdx > 0 ? this.milestoneThresholds[nextIdx - 1] : 0;
    return Math.round(((count - prev) / (next - prev)) * 100);
  });

  constructor() {
    addIcons({
      globeOutline,
      flagOutline,
      chevronForwardOutline,
      trophyOutline,
      airplaneOutline,
      ribbonOutline,
      starOutline,
      lockClosedOutline,
      checkmarkCircleOutline,
    });
  }

  /**
   * Ionic lifecycle hook - runs every time the page becomes visible.
   * Used to check achievements when returning to the page.
   */
  ionViewWillEnter(): void {
    this.checkAchievements();
  }

  /**
   * Check achievements on page load.
   */
  private async checkAchievements(): Promise<void> {
    const visitedCodes = this.countryService.visitedCountries().map(c => c.code);
    await this.achievementService.checkAchievements(visitedCodes);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  navigateToCountry(countryCode: string): void {
    this.router.navigate(['/country', countryCode]);
  }

  private countryToFlagUrl(countryCode: string): string {
    const code = countryCode.toLowerCase();
    return `https://flagcdn.com/w40/${code}.png`;
  }

  getCategoryLabel(category: AchievementCategory): string {
    switch (category) {
      case 'milestone': return 'Milestones';
      case 'continent': return 'Continents';
      case 'special': return 'Special';
    }
  }

  getCategoryIcon(category: AchievementCategory): string {
    switch (category) {
      case 'milestone': return 'trophy-outline';
      case 'continent': return 'globe-outline';
      case 'special': return 'star-outline';
    }
  }
}
