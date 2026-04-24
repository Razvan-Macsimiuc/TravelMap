import { Injectable, inject, signal, computed, effect, Injector, runInInjectionContext } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { CountryService } from './country.service';

// Achievement categories
export type AchievementCategory =
  | 'milestone'
  | 'continent'
  | 'special';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: number; // The threshold to unlock
  color: string;
  unlockedMessage: string;
}

export interface UnlockedAchievement extends Achievement {
  unlockedAt: string; // ISO date string
}

// Legacy interface for achievement modal (backwards compatibility)
export interface Milestone {
  count: number;
  title: string;
  icon: string;
  color: string;
  message: string;
  countLabel?: string; // e.g. "Countries Visited", "Cities Logged", "Continents Explored"
}

// ============================================
// MILESTONE ACHIEVEMENTS - Based on countries visited
// ============================================
const MILESTONE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'milestone_1',
    title: 'First Steps',
    description: 'Visit your first country',
    icon: '🎯',
    category: 'milestone',
    requirement: 1,
    color: '#FFE66D',
    unlockedMessage: 'Your journey begins! First country marked!',
  },
  {
    id: 'milestone_5',
    title: 'Wanderer',
    description: 'Visit 5 countries',
    icon: '🗺️',
    category: 'milestone',
    requirement: 5,
    color: '#4ECDC4',
    unlockedMessage: 'You have explored 5 countries!',
  },
  {
    id: 'milestone_10',
    title: 'Adventurer',
    description: 'Visit 10 countries',
    icon: '✈️',
    category: 'milestone',
    requirement: 10,
    color: '#FF6B6B',
    unlockedMessage: '10 countries! You are an adventurer!',
  },
  {
    id: 'milestone_25',
    title: 'Explorer',
    description: 'Visit 25 countries',
    icon: '🌍',
    category: 'milestone',
    requirement: 25,
    color: '#95E1D3',
    unlockedMessage: '25 countries explored! Amazing!',
  },
  {
    id: 'milestone_50',
    title: 'Globe Trotter',
    description: 'Visit 50 countries',
    icon: '🏆',
    category: 'milestone',
    requirement: 50,
    color: '#FFD93D',
    unlockedMessage: '50 countries! You are a true globe trotter!',
  },
  {
    id: 'milestone_75',
    title: 'World Traveler',
    description: 'Visit 75 countries',
    icon: '🌐',
    category: 'milestone',
    requirement: 75,
    color: '#A8E6CF',
    unlockedMessage: '75 countries! Incredible journey!',
  },
  {
    id: 'milestone_100',
    title: 'Century Club',
    description: 'Visit 100 countries',
    icon: '👑',
    category: 'milestone',
    requirement: 100,
    color: '#FF8787',
    unlockedMessage: '100 countries! Legendary achievement!',
  },
  {
    id: 'milestone_150',
    title: 'Master Explorer',
    description: 'Visit 150 countries',
    icon: '💎',
    category: 'milestone',
    requirement: 150,
    color: '#B8B5FF',
    unlockedMessage: '150 countries! You are a master explorer!',
  },
  {
    id: 'milestone_195',
    title: 'World Conqueror',
    description: 'Visit all 195 countries',
    icon: '🌟',
    category: 'milestone',
    requirement: 195,
    color: '#FFD700',
    unlockedMessage: 'ALL COUNTRIES! You conquered the world!',
  },
];

// ============================================
// CONTINENTAL ACHIEVEMENTS - Based on continents explored
// ============================================
const CONTINENT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'continent_europe',
    title: 'European Explorer',
    description: 'Visit a country in Europe',
    icon: '🏰',
    category: 'continent',
    requirement: 1,
    color: '#3498DB',
    unlockedMessage: 'Welcome to Europe!',
  },
  {
    id: 'continent_asia',
    title: 'Asian Adventurer',
    description: 'Visit a country in Asia',
    icon: '🏯',
    category: 'continent',
    requirement: 1,
    color: '#E74C3C',
    unlockedMessage: 'Welcome to Asia!',
  },
  {
    id: 'continent_africa',
    title: 'African Safari',
    description: 'Visit a country in Africa',
    icon: '🦁',
    category: 'continent',
    requirement: 1,
    color: '#F39C12',
    unlockedMessage: 'Welcome to Africa!',
  },
  {
    id: 'continent_namerica',
    title: 'North American Dream',
    description: 'Visit a country in North America',
    icon: '🗽',
    category: 'continent',
    requirement: 1,
    color: '#9B59B6',
    unlockedMessage: 'Welcome to North America!',
  },
  {
    id: 'continent_samerica',
    title: 'South American Spirit',
    description: 'Visit a country in South America',
    icon: '🌴',
    category: 'continent',
    requirement: 1,
    color: '#27AE60',
    unlockedMessage: 'Welcome to South America!',
  },
  {
    id: 'continent_oceania',
    title: 'Oceania Explorer',
    description: 'Visit a country in Oceania',
    icon: '🏝️',
    category: 'continent',
    requirement: 1,
    color: '#1ABC9C',
    unlockedMessage: 'Welcome to Oceania!',
  },
];

// ============================================
// SPECIAL ACHIEVEMENTS - Unique accomplishments
// ============================================
const SPECIAL_ACHIEVEMENTS: Achievement[] = [
  // Continent-based
  {
    id: 'special_5_continents',
    title: 'Continental Champion',
    description: 'Visit countries on 5 different continents',
    icon: '🌏',
    category: 'special',
    requirement: 5,
    color: '#00BCD4',
    unlockedMessage: '5 continents explored! True world traveler!',
  },
  {
    id: 'special_all_continents',
    title: 'Global Citizen',
    description: 'Visit countries on all 6 continents',
    icon: '🌍',
    category: 'special',
    requirement: 6,
    color: '#FFD700',
    unlockedMessage: 'All continents! You are a global citizen!',
  },
  {
    id: 'special_island_hopper',
    title: 'Island Hopper',
    description: 'Visit 5 island nations',
    icon: '🏝️',
    category: 'special',
    requirement: 5,
    color: '#00CED1',
    unlockedMessage: 'Island life suits you!',
  },
  // City-based achievements
  {
    id: 'special_first_city',
    title: 'First Stop',
    description: 'Log your first city',
    icon: '📍',
    category: 'special',
    requirement: 1,
    color: '#6366F1',
    unlockedMessage: 'You logged your first city!',
  },
  {
    id: 'special_city_wanderer',
    title: 'City Wanderer',
    description: 'Log 5 cities across your travels',
    icon: '🗺️',
    category: 'special',
    requirement: 5,
    color: '#4F46E5',
    unlockedMessage: 'You have logged 5 cities across your travels!',
  },
  {
    id: 'special_city_explorer',
    title: 'City Explorer',
    description: 'Add 10 cities across your travels',
    icon: '🏙️',
    category: 'special',
    requirement: 10,
    color: '#7C3AED',
    unlockedMessage: 'You have explored 10 cities across your travels!',
  },
  {
    id: 'special_urban_legend',
    title: 'Urban Legend',
    description: 'Add 25 cities across your travels',
    icon: '🌆',
    category: 'special',
    requirement: 25,
    color: '#8B5CF6',
    unlockedMessage: "25 cities! You know the world's streets!",
  },
  {
    id: 'special_metropolitan',
    title: 'Metropolitan Master',
    description: 'Add 50 cities across your travels',
    icon: '🌃',
    category: 'special',
    requirement: 50,
    color: '#A855F7',
    unlockedMessage: '50 cities conquered! Legendary explorer!',
  },
  // Regional achievements
  {
    id: 'special_nordic',
    title: 'Nordic Explorer',
    description: 'Visit all 5 Nordic countries',
    icon: '❄️',
    category: 'special',
    requirement: 5,
    color: '#38BDF8',
    unlockedMessage: 'The land of the midnight sun awaits!',
  },
  {
    id: 'special_mediterranean',
    title: 'Mediterranean Sun',
    description: 'Visit 5 Mediterranean countries',
    icon: '☀️',
    category: 'special',
    requirement: 5,
    color: '#FB923C',
    unlockedMessage: 'Sun, sea, and culture!',
  },
  {
    id: 'special_southeast_asia',
    title: 'Southeast Asia Trail',
    description: 'Visit 5 Southeast Asian countries',
    icon: '🏯',
    category: 'special',
    requirement: 5,
    color: '#F472B6',
    unlockedMessage: 'The exotic East explored!',
  },
];

/** Modal count line labels (English). */
const ACHIEVEMENT_COUNT_LABELS: Record<string, string> = {
  'achievements.countLabels.countriesVisited': 'Countries Visited',
  'achievements.countLabels.citiesLogged': 'Cities Logged',
  'achievements.countLabels.continentsExplored': 'Continents Explored',
  'achievements.countLabels.islandNationsVisited': 'Island Nations Visited',
};

// Nordic countries
const NORDIC_COUNTRIES = new Set(['DK', 'FI', 'IS', 'NO', 'SE']);

// Mediterranean countries
const MEDITERRANEAN_COUNTRIES = new Set([
  'ES',
  'FR',
  'IT',
  'GR',
  'HR',
  'SI',
  'ME',
  'AL',
  'MT',
  'CY',
  'TR',
  'LB',
  'IL',
  'EG',
  'LY',
  'TN',
  'DZ',
  'MA',
  'MC',
]);

// Southeast Asian countries
const SOUTHEAST_ASIAN_COUNTRIES = new Set([
  'TH',
  'VN',
  'MY',
  'SG',
  'ID',
  'PH',
  'MM',
  'KH',
  'LA',
  'BN',
  'TL',
]);

// All achievements combined
const ALL_ACHIEVEMENTS: Achievement[] = [
  ...MILESTONE_ACHIEVEMENTS,
  ...CONTINENT_ACHIEVEMENTS,
  ...SPECIAL_ACHIEVEMENTS,
];

// Continent mapping for countries
export const CONTINENT_MAP: Record<string, string> = {
  // Europe
  AL: 'europe',
  AD: 'europe',
  AT: 'europe',
  BY: 'europe',
  BE: 'europe',
  BA: 'europe',
  BG: 'europe',
  HR: 'europe',
  CY: 'europe',
  CZ: 'europe',
  DK: 'europe',
  EE: 'europe',
  FI: 'europe',
  FR: 'europe',
  DE: 'europe',
  GR: 'europe',
  HU: 'europe',
  IS: 'europe',
  IE: 'europe',
  IT: 'europe',
  XK: 'europe',
  LV: 'europe',
  LI: 'europe',
  LT: 'europe',
  LU: 'europe',
  MT: 'europe',
  MD: 'europe',
  MC: 'europe',
  ME: 'europe',
  NL: 'europe',
  MK: 'europe',
  NO: 'europe',
  PL: 'europe',
  PT: 'europe',
  RO: 'europe',
  RU: 'europe',
  SM: 'europe',
  RS: 'europe',
  SK: 'europe',
  SI: 'europe',
  ES: 'europe',
  SE: 'europe',
  CH: 'europe',
  UA: 'europe',
  GB: 'europe',
  VA: 'europe',
  // Asia
  AF: 'asia',
  AM: 'asia',
  AZ: 'asia',
  BH: 'asia',
  BD: 'asia',
  BT: 'asia',
  BN: 'asia',
  KH: 'asia',
  CN: 'asia',
  GE: 'asia',
  IN: 'asia',
  ID: 'asia',
  IR: 'asia',
  IQ: 'asia',
  IL: 'asia',
  JP: 'asia',
  JO: 'asia',
  KZ: 'asia',
  KW: 'asia',
  KG: 'asia',
  LA: 'asia',
  LB: 'asia',
  MY: 'asia',
  MV: 'asia',
  MN: 'asia',
  MM: 'asia',
  NP: 'asia',
  KP: 'asia',
  OM: 'asia',
  PK: 'asia',
  PS: 'asia',
  PH: 'asia',
  QA: 'asia',
  SA: 'asia',
  SG: 'asia',
  KR: 'asia',
  LK: 'asia',
  SY: 'asia',
  TW: 'asia',
  TJ: 'asia',
  TH: 'asia',
  TL: 'asia',
  TR: 'asia',
  TM: 'asia',
  AE: 'asia',
  UZ: 'asia',
  VN: 'asia',
  YE: 'asia',
  // Africa
  DZ: 'africa',
  AO: 'africa',
  BJ: 'africa',
  BW: 'africa',
  BF: 'africa',
  BI: 'africa',
  CM: 'africa',
  CV: 'africa',
  CF: 'africa',
  TD: 'africa',
  KM: 'africa',
  CD: 'africa',
  CG: 'africa',
  CI: 'africa',
  DJ: 'africa',
  EG: 'africa',
  GQ: 'africa',
  ER: 'africa',
  ET: 'africa',
  GA: 'africa',
  GM: 'africa',
  GH: 'africa',
  GN: 'africa',
  GW: 'africa',
  KE: 'africa',
  LS: 'africa',
  LR: 'africa',
  LY: 'africa',
  MG: 'africa',
  MW: 'africa',
  ML: 'africa',
  MR: 'africa',
  MU: 'africa',
  MA: 'africa',
  MZ: 'africa',
  NA: 'africa',
  NE: 'africa',
  NG: 'africa',
  RW: 'africa',
  ST: 'africa',
  SN: 'africa',
  SC: 'africa',
  SL: 'africa',
  SO: 'africa',
  ZA: 'africa',
  SS: 'africa',
  SD: 'africa',
  SZ: 'africa',
  TZ: 'africa',
  TG: 'africa',
  TN: 'africa',
  UG: 'africa',
  ZM: 'africa',
  ZW: 'africa',
  // North America
  AG: 'namerica',
  BS: 'namerica',
  BB: 'namerica',
  BZ: 'namerica',
  CA: 'namerica',
  CR: 'namerica',
  CU: 'namerica',
  DM: 'namerica',
  DO: 'namerica',
  SV: 'namerica',
  GD: 'namerica',
  GT: 'namerica',
  HT: 'namerica',
  HN: 'namerica',
  JM: 'namerica',
  MX: 'namerica',
  NI: 'namerica',
  PA: 'namerica',
  KN: 'namerica',
  LC: 'namerica',
  VC: 'namerica',
  TT: 'namerica',
  US: 'namerica',
  // South America
  AR: 'samerica',
  BO: 'samerica',
  BR: 'samerica',
  CL: 'samerica',
  CO: 'samerica',
  EC: 'samerica',
  GY: 'samerica',
  PY: 'samerica',
  PE: 'samerica',
  SR: 'samerica',
  UY: 'samerica',
  VE: 'samerica',
  // Oceania
  AU: 'oceania',
  FJ: 'oceania',
  KI: 'oceania',
  MH: 'oceania',
  FM: 'oceania',
  NR: 'oceania',
  NZ: 'oceania',
  PW: 'oceania',
  PG: 'oceania',
  WS: 'oceania',
  SB: 'oceania',
  TO: 'oceania',
  TV: 'oceania',
  VU: 'oceania',
};

// Island nations for special achievement
const ISLAND_NATIONS = new Set([
  'AU',
  'BS',
  'BB',
  'CU',
  'CY',
  'DM',
  'DO',
  'FJ',
  'GD',
  'HT',
  'IS',
  'ID',
  'IE',
  'JM',
  'JP',
  'KI',
  'MG',
  'MV',
  'MT',
  'MH',
  'MU',
  'FM',
  'NR',
  'NZ',
  'PW',
  'PG',
  'PH',
  'KN',
  'LC',
  'VC',
  'WS',
  'ST',
  'SC',
  'SG',
  'SB',
  'LK',
  'TW',
  'TL',
  'TO',
  'TT',
  'TV',
  'GB',
  'VU',
]);

@Injectable({
  providedIn: 'root',
})
export class AchievementService {
  private readonly modalController = inject(ModalController);
  private readonly countryService = inject(CountryService);
  private readonly injector = inject(Injector);
  private readonly unlockedAchievements = signal<
    Map<string, UnlockedAchievement>
  >(new Map());
  private audioContext: AudioContext | null = null;
  private suppressCelebrations = true; // Prevent celebrations during startup

  // Computed signals for easy access
  readonly allAchievements = computed(() =>
    ALL_ACHIEVEMENTS.map((a) => this.localizeAchievement(a))
  );

  readonly unlockedList = computed(() =>
    Array.from(this.unlockedAchievements().values())
  );

  readonly unlockedCount = computed(() => this.unlockedAchievements().size);

  readonly totalCount = computed(() => ALL_ACHIEVEMENTS.length);

  readonly progressPercentage = computed(() =>
    Math.round((this.unlockedCount() / this.totalCount()) * 100)
  );

  readonly milestoneAchievements = computed(() =>
    this.getAchievementsByCategory('milestone')
  );

  readonly continentAchievements = computed(() =>
    this.getAchievementsByCategory('continent')
  );

  readonly specialAchievements = computed(() =>
    this.getAchievementsByCategory('special')
  );

  constructor() {
    this.loadUnlockedAchievements();
    this.initializeAudio();

    // Delay initialization to let data load first
    setTimeout(() => {
      this.initializeReactiveChecking();
    }, 500);
  }

  /**
   * Initialize reactive achievement checking after initial data load.
   */
  private initializeReactiveChecking(): void {
    // First, sync achievements silently based on current state
    const visitedCodes = this.countryService
      .visitedCountries()
      .map((c) => c.code);
    this.syncAchievementsOnStartup(visitedCodes);

    // Enable celebrations after initial sync is complete
    // Small delay to ensure sync is fully processed
    setTimeout(() => {
      this.suppressCelebrations = false;
    }, 100);

    // Set up reactive checking for future changes.
    // runInInjectionContext is required because this method is called from
    // a setTimeout callback, which runs outside Angular's injection context.
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const visitedCountries = this.countryService.visitedCountries();

        if (this.suppressCelebrations) {
          return;
        }

        const codes = visitedCountries.map((c) => c.code);
        this.checkAchievementsReactive(codes);
      });
    });
  }

  /**
   * Initialize Web Audio API for sound effects.
   */
  private initializeAudio(): void {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    } catch {
    }
  }

  /**
   * Play achievement "ding" sound using Web Audio API.
   */
  private async playAchievementSound(): Promise<void> {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        400,
        this.audioContext.currentTime + 0.1
      );

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.5
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);
    } catch {
      // Sound unavailable; silently skip
    }
  }

  /**
   * Reactive achievement check - called from effect().
   * Wraps the async method in a non-blocking call.
   */
  private checkAchievementsReactive(visitedCodes: string[]): void {
    queueMicrotask(() => {
      this.checkAchievements(visitedCodes);
    });
  }

  /**
   * Sync achievements on app startup without showing celebrations.
   * This ensures achievements are always in sync with current stats.
   */
  private syncAchievementsOnStartup(visitedCodes: string[]): void {
    const stats = this.computeAchievementStats(visitedCodes);

    // Sync milestone achievements
    for (const achievement of MILESTONE_ACHIEVEMENTS) {
      const meetsRequirement = stats.visitedCount >= achievement.requirement;
      if (meetsRequirement) {
        this.unlockAchievementSilently(achievement);
      } else {
        this.revokeAchievement(achievement.id);
      }
    }

    // Sync continent achievements
    for (const achievement of CONTINENT_ACHIEVEMENTS) {
      const continentId = achievement.id.replace('continent_', '');
      const meetsRequirement = stats.visitedContinents.has(continentId);
      if (meetsRequirement) {
        this.unlockAchievementSilently(achievement);
      } else {
        this.revokeAchievement(achievement.id);
      }
    }

    // Sync all special achievements
    for (const check of this.buildSpecialChecks(stats)) {
      const achievement = SPECIAL_ACHIEVEMENTS.find((a) => a.id === check.id);
      if (achievement) {
        if (check.condition) {
          this.unlockAchievementSilently(achievement);
        } else {
          this.revokeAchievement(achievement.id);
        }
      }
    }

  }

  /**
   * Unlock an achievement silently (no celebration).
   * Used for startup sync.
   */
  private unlockAchievementSilently(achievement: Achievement): void {
    if (this.unlockedAchievements().has(achievement.id)) {
      return; // Already unlocked
    }

    const unlocked: UnlockedAchievement = {
      ...achievement,
      unlockedAt: new Date().toISOString(),
    };

    this.unlockedAchievements.update((map) => {
      const newMap = new Map(map);
      newMap.set(achievement.id, unlocked);
      return newMap;
    });

    this.saveUnlockedAchievements();
  }

  /**
   * Compute all stats needed for achievement checking.
   */
  private buildSpecialChecks(stats: ReturnType<AchievementService['computeAchievementStats']>): { id: string; condition: boolean }[] {
    return [
      { id: 'special_5_continents',   condition: stats.visitedContinents.size >= 5 },
      { id: 'special_all_continents', condition: stats.visitedContinents.size >= 6 },
      { id: 'special_island_hopper',  condition: stats.islandCount >= 5 },
      { id: 'special_first_city',     condition: stats.totalCities >= 1 },
      { id: 'special_city_wanderer',  condition: stats.totalCities >= 5 },
      { id: 'special_city_explorer',  condition: stats.totalCities >= 10 },
      { id: 'special_urban_legend',   condition: stats.totalCities >= 25 },
      { id: 'special_metropolitan',   condition: stats.totalCities >= 50 },
      { id: 'special_nordic',         condition: stats.nordicCount >= 5 },
      { id: 'special_mediterranean',  condition: stats.mediterraneanCount >= 5 },
      { id: 'special_southeast_asia', condition: stats.southeastAsiaCount >= 5 },
    ];
  }

  private computeAchievementStats(visitedCodes: string[]) {
    const countries = this.countryService.countries();
    const visitedCountries = countries.filter((c) => c.visited);

    // Basic counts
    const visitedCount = visitedCodes.length;
    const visitedContinents = this.getVisitedContinents(visitedCodes);
    const islandCount = visitedCodes.filter((code) =>
      ISLAND_NATIONS.has(code)
    ).length;

    // City counts
    let totalCities = 0;
    visitedCountries.forEach((c) => {
      totalCities += c.cities?.length ?? 0;
    });

    // Regional counts
    const nordicCount = visitedCodes.filter((c) =>
      NORDIC_COUNTRIES.has(c)
    ).length;
    const mediterraneanCount = visitedCodes.filter((c) =>
      MEDITERRANEAN_COUNTRIES.has(c)
    ).length;
    const southeastAsiaCount = visitedCodes.filter((c) =>
      SOUTHEAST_ASIAN_COUNTRIES.has(c)
    ).length;

    return {
      visitedCount,
      visitedContinents,
      islandCount,
      totalCities,
      nordicCount,
      mediterraneanCount,
      southeastAsiaCount,
    };
  }

  /**
   * Check all achievements based on current stats.
   * Unlocks achievements when criteria are met, revokes when no longer met.
   */
  async checkAchievements(visitedCodes: string[]): Promise<void> {
    const stats = this.computeAchievementStats(visitedCodes);
    const newlyUnlocked: Achievement[] = [];

    // Check milestone achievements (unlock or revoke)
    for (const achievement of MILESTONE_ACHIEVEMENTS) {
      const meetsRequirement = stats.visitedCount >= achievement.requirement;
      if (meetsRequirement) {
        if (this.unlockAchievement(achievement)) {
          newlyUnlocked.push(achievement);
        }
      } else {
        this.revokeAchievement(achievement.id);
      }
    }

    // Check continent achievements (unlock or revoke)
    for (const achievement of CONTINENT_ACHIEVEMENTS) {
      const continentId = achievement.id.replace('continent_', '');
      const meetsRequirement = stats.visitedContinents.has(continentId);
      if (meetsRequirement) {
        if (this.unlockAchievement(achievement)) {
          newlyUnlocked.push(achievement);
        }
      } else {
        this.revokeAchievement(achievement.id);
      }
    }

    // Check all special achievements
    for (const check of this.buildSpecialChecks(stats)) {
      const achievement = SPECIAL_ACHIEVEMENTS.find((a) => a.id === check.id);
      if (achievement) {
        if (check.condition) {
          if (this.unlockAchievement(achievement)) {
            newlyUnlocked.push(achievement);
          }
        } else {
          this.revokeAchievement(achievement.id);
        }
      }
    }

    // Show celebration for every newly unlocked achievement sequentially (skip during startup)
    if (newlyUnlocked.length > 0 && !this.suppressCelebrations) {
      for (const achievement of newlyUnlocked) {
        await this.celebrateAchievement(achievement);
      }
    }
  }

  /**
   * Get visited continents from country codes.
   */
  private getVisitedContinents(codes: string[]): Set<string> {
    const continents = new Set<string>();
    for (const code of codes) {
      const continent = CONTINENT_MAP[code.toUpperCase()];
      if (continent) {
        continents.add(continent);
      }
    }
    return continents;
  }

  /**
   * Unlock an achievement if not already unlocked.
   * Returns true if newly unlocked.
   */
  private unlockAchievement(achievement: Achievement): boolean {
    if (this.unlockedAchievements().has(achievement.id)) {
      return false;
    }

    const unlocked: UnlockedAchievement = {
      ...achievement,
      unlockedAt: new Date().toISOString(),
    };

    this.unlockedAchievements.update((map) => {
      const newMap = new Map(map);
      newMap.set(achievement.id, unlocked);
      return newMap;
    });

    this.saveUnlockedAchievements();
    return true;
  }

  /**
   * Revoke an achievement if it's currently unlocked.
   * This happens when the user no longer meets the criteria.
   */
  private revokeAchievement(achievementId: string): void {
    if (!this.unlockedAchievements().has(achievementId)) {
      return; // Not unlocked, nothing to revoke
    }

    this.unlockedAchievements.update((map) => {
      const newMap = new Map(map);
      newMap.delete(achievementId);
      return newMap;
    });

    this.saveUnlockedAchievements();
  }

  /**
   * Show achievement celebration.
   */
  private async celebrateAchievement(achievement: Achievement): Promise<void> {
    await this.playAchievementSound();

    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      // Haptics not available
    }

    const { AchievementModalComponent } = await import(
      '../components/achievement-modal/achievement-modal.component'
    );

    const loc = this.localizeAchievement(achievement);
    const visited = this.countryService.visitedCountries();
    let countLabelKey = 'achievements.countLabels.countriesVisited';
    let displayCount = visited.length;

    if (['special_first_city', 'special_city_wanderer', 'special_city_explorer', 'special_urban_legend', 'special_metropolitan'].includes(achievement.id)) {
      countLabelKey = 'achievements.countLabels.citiesLogged';
      displayCount = visited.reduce((sum, c) => sum + (c.cities?.length ?? 0), 0);
    } else if (['special_5_continents', 'special_all_continents'].includes(achievement.id)) {
      countLabelKey = 'achievements.countLabels.continentsExplored';
      displayCount = new Set(
        visited.map((c) => CONTINENT_MAP[c.code]).filter(Boolean)
      ).size;
    } else if (['special_island_hopper'].includes(achievement.id)) {
      countLabelKey = 'achievements.countLabels.islandNationsVisited';
      displayCount = visited.filter((c) => ISLAND_NATIONS.has(c.code)).length;
    } else if (['special_nordic', 'special_mediterranean', 'special_southeast_asia'].includes(achievement.id)) {
      countLabelKey = 'achievements.countLabels.countriesVisited';
    }

    const countLabel =
      ACHIEVEMENT_COUNT_LABELS[countLabelKey] ?? countLabelKey;

    const modal = await this.modalController.create({
      component: AchievementModalComponent,
      componentProps: {
        milestone: {
          count: achievement.requirement,
          title: loc.title,
          icon: achievement.icon,
          color: achievement.color,
          message: loc.unlockedMessage,
          countLabel,
        },
        visitedCount: displayCount,
      },
      cssClass: 'achievement-modal',
      backdropDismiss: true,
      showBackdrop: true,
    });

    await modal.present();
    await modal.onDidDismiss();
  }

  /**
   * Check if an achievement is unlocked.
   */
  isUnlocked(achievementId: string): boolean {
    return this.unlockedAchievements().has(achievementId);
  }

  /**
   * Get achievements by category with unlock status.
   */
  getAchievementsByCategory(
    category: AchievementCategory
  ): (Achievement & { unlocked: boolean })[] {
    return ALL_ACHIEVEMENTS.filter((a) => a.category === category).map((a) => {
      const loc = this.localizeAchievement(a);
      return {
        ...loc,
        unlocked: this.isUnlocked(a.id),
      };
    });
  }

  /**
   * Get next milestone achievement.
   */
  getNextMilestone(visitedCount: number): Achievement | null {
    const raw = MILESTONE_ACHIEVEMENTS.find((a) => a.requirement > visitedCount);
    return raw ? this.localizeAchievement(raw) : null;
  }

  /**
   * Load unlocked achievements from localStorage.
   */
  private loadUnlockedAchievements(): void {
    try {
      const stored = localStorage.getItem('hopahopa_achievements');
      if (stored) {
        const array: UnlockedAchievement[] = JSON.parse(stored);
        const validIds = new Set(ALL_ACHIEVEMENTS.map((a) => a.id));
        const map = new Map<string, UnlockedAchievement>();
        array.filter((a) => validIds.has(a.id)).forEach((a) => map.set(a.id, a));
        this.unlockedAchievements.set(map);
      }
    } catch {
      // Ignore corrupt localStorage data
    }
  }

  /**
   * Save unlocked achievements to localStorage.
   */
  private saveUnlockedAchievements(): void {
    try {
      const array = Array.from(this.unlockedAchievements().values());
      localStorage.setItem('hopahopa_achievements', JSON.stringify(array));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Reset all achievements (for testing or data reset).
   */
  resetShownMilestones(): void {
    this.unlockedAchievements.set(new Map());
    localStorage.removeItem('hopahopa_achievements');
    localStorage.removeItem('hopahopa_shown_milestones');
  }

  /**
   * Get all milestones (legacy compatibility).
   */
  getMilestones() {
    return MILESTONE_ACHIEVEMENTS.map((a) => {
      const loc = this.localizeAchievement(a);
      return {
        count: a.requirement,
        title: loc.title,
        icon: a.icon,
        color: a.color,
        message: loc.unlockedMessage,
      };
    });
  }

  private localizeAchievement(a: Achievement): Achievement {
    return { ...a };
  }
}
