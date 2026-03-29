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
  flagEmoji: string;
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
        flagEmoji: this.countryCodeToFlag(country.code),
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

  // Milestone achievements (legacy support for the card)
  readonly milestoneReached = computed(() => {
    const count = this.visitedCount();
    if (count >= 100) return { label: 'Century Traveler', threshold: 100 };
    if (count >= 50) return { label: 'Globe Trotter', threshold: 50 };
    if (count >= 25) return { label: 'Explorer', threshold: 25 };
    if (count >= 10) return { label: 'Adventurer', threshold: 10 };
    if (count >= 5) return { label: 'Wanderer', threshold: 5 };
    if (count >= 1) return { label: 'First Steps', threshold: 1 };
    return null;
  });

  readonly nextMilestone = computed(() => {
    const count = this.visitedCount();
    if (count < 1) return 1;
    if (count < 5) return 5;
    if (count < 10) return 10;
    if (count < 25) return 25;
    if (count < 50) return 50;
    if (count < 100) return 100;
    return 195;
  });

  readonly progressToNextMilestone = computed(() => {
    const count = this.visitedCount();
    const next = this.nextMilestone();
    const prev = this.getPreviousMilestone(next);
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

  private countryCodeToFlag(countryCode: string): string {
    const code = countryCode.toUpperCase();
    if (code.length !== 2) return '🏳️';

    const codePoints = [...code].map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  private getPreviousMilestone(next: number): number {
    if (next <= 1) return 0;
    if (next === 5) return 1;
    if (next === 10) return 5;
    if (next === 25) return 10;
    if (next === 50) return 25;
    if (next === 100) return 50;
    return 100;
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
