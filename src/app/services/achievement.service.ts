import { Injectable, inject, signal, computed, effect } from '@angular/core';
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
    icon: '🌟',
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
    id: 'special_city_explorer',
    title: 'City Explorer',
    description: 'Add 10 cities across your travels',
    icon: '🏙️',
    category: 'special',
    requirement: 10,
    color: '#7C3AED',
    unlockedMessage: '10 cities explored! Urban adventurer!',
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
  // Visit frequency achievements
  {
    id: 'special_frequent_flyer',
    title: 'Frequent Flyer',
    description: 'Visit any country 3 or more times',
    icon: '✈️',
    category: 'special',
    requirement: 3,
    color: '#0EA5E9',
    unlockedMessage: 'You found a favorite destination!',
  },
  {
    id: 'special_dedicated_traveler',
    title: 'Dedicated Traveler',
    description: 'Visit any country 5 or more times',
    icon: '🎯',
    category: 'special',
    requirement: 5,
    color: '#0284C7',
    unlockedMessage: 'True dedication to your favorite place!',
  },
  // Days stayed achievements
  {
    id: 'special_week_abroad',
    title: 'Week Abroad',
    description: 'Spend 7+ days in a single country',
    icon: '📅',
    category: 'special',
    requirement: 7,
    color: '#10B981',
    unlockedMessage: 'A week well spent!',
  },
  {
    id: 'special_month_abroad',
    title: 'Month Abroad',
    description: 'Spend 30+ days in a single country',
    icon: '🗓️',
    category: 'special',
    requirement: 30,
    color: '#059669',
    unlockedMessage: 'A month of adventure!',
  },
  {
    id: 'special_world_resident',
    title: 'World Resident',
    description: 'Accumulate 100+ total days traveled',
    icon: '🌐',
    category: 'special',
    requirement: 100,
    color: '#047857',
    unlockedMessage: '100 days exploring the world!',
  },
  // Notes achievements
  {
    id: 'special_storyteller',
    title: 'Storyteller',
    description: 'Add personal notes to 5 countries',
    icon: '📝',
    category: 'special',
    requirement: 5,
    color: '#F59E0B',
    unlockedMessage: 'Your stories are taking shape!',
  },
  {
    id: 'special_travel_journalist',
    title: 'Travel Journalist',
    description: 'Add personal notes to 10 countries',
    icon: '✍️',
    category: 'special',
    requirement: 10,
    color: '#D97706',
    unlockedMessage: 'A true chronicler of adventures!',
  },
  // Perfect country achievement
  {
    id: 'special_perfect_trip',
    title: 'Perfect Trip',
    description: 'Complete a country with cities and a note',
    icon: '⭐',
    category: 'special',
    requirement: 1,
    color: '#FBBF24',
    unlockedMessage: 'A perfectly documented journey!',
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
const CONTINENT_MAP: Record<string, string> = {
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
  private readonly unlockedAchievements = signal<
    Map<string, UnlockedAchievement>
  >(new Map());
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private suppressCelebrations = true; // Prevent celebrations during startup

  // Computed signals for easy access
  readonly allAchievements = computed(() => ALL_ACHIEVEMENTS);

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

    // Mark as initialized
    this.isInitialized = true;

    // Enable celebrations after initial sync is complete
    // Small delay to ensure sync is fully processed
    setTimeout(() => {
      this.suppressCelebrations = false;
      console.log('[AchievementService] Celebrations enabled');
    }, 100);

    // Set up reactive checking for future changes
    effect(() => {
      const visitedCountries = this.countryService.visitedCountries();

      if (this.suppressCelebrations) {
        return;
      }

      const codes = visitedCountries.map((c) => c.code);
      this.checkAchievementsReactive(codes);
    });
  }

  /**
   * Initialize Web Audio API for sound effects.
   */
  private initializeAudio(): void {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('[AchievementService] Web Audio API not available');
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
    } catch (error) {
      console.warn('[AchievementService] Could not play sound:', error);
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
    const specialChecks: { id: string; condition: boolean }[] = [
      {
        id: 'special_5_continents',
        condition: stats.visitedContinents.size >= 5,
      },
      {
        id: 'special_all_continents',
        condition: stats.visitedContinents.size >= 6,
      },
      { id: 'special_island_hopper', condition: stats.islandCount >= 5 },
      { id: 'special_city_explorer', condition: stats.totalCities >= 10 },
      { id: 'special_urban_legend', condition: stats.totalCities >= 25 },
      { id: 'special_metropolitan', condition: stats.totalCities >= 50 },
      { id: 'special_frequent_flyer', condition: stats.maxVisitCount >= 3 },
      { id: 'special_dedicated_traveler', condition: stats.maxVisitCount >= 5 },
      { id: 'special_week_abroad', condition: stats.maxDaysInCountry >= 7 },
      { id: 'special_month_abroad', condition: stats.maxDaysInCountry >= 30 },
      { id: 'special_world_resident', condition: stats.totalDays >= 100 },
      { id: 'special_storyteller', condition: stats.countriesWithNotes >= 5 },
      {
        id: 'special_travel_journalist',
        condition: stats.countriesWithNotes >= 10,
      },
      { id: 'special_perfect_trip', condition: stats.hasPerfectTrip },
      { id: 'special_nordic', condition: stats.nordicCount >= 5 },
      { id: 'special_mediterranean', condition: stats.mediterraneanCount >= 5 },
      {
        id: 'special_southeast_asia',
        condition: stats.southeastAsiaCount >= 5,
      },
    ];

    for (const check of specialChecks) {
      const achievement = SPECIAL_ACHIEVEMENTS.find((a) => a.id === check.id);
      if (achievement) {
        if (check.condition) {
          this.unlockAchievementSilently(achievement);
        } else {
          this.revokeAchievement(achievement.id);
        }
      }
    }

    console.log(
      `[AchievementService] Synced achievements: ${this.unlockedCount()} unlocked`
    );
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

    // Visit frequency (max visits to any country)
    let maxVisitCount = 0;
    visitedCountries.forEach((c) => {
      maxVisitCount = Math.max(maxVisitCount, c.visitCount ?? 1);
    });

    // Days stayed
    let maxDaysInCountry = 0;
    let totalDays = 0;
    visitedCountries.forEach((c) => {
      const days = c.daysStayed ?? 0;
      maxDaysInCountry = Math.max(maxDaysInCountry, days);
      totalDays += days;
    });

    // Notes count
    const countriesWithNotes = visitedCountries.filter(
      (c) => c.note && c.note.trim().length > 0
    ).length;

    const hasPerfectTrip = visitedCountries.some(
      (c) =>
        (c.cities?.length ?? 0) > 0 &&
        c.note &&
        c.note.trim().length > 0
    );

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
      maxVisitCount,
      maxDaysInCountry,
      totalDays,
      countriesWithNotes,
      hasPerfectTrip,
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
    const specialChecks: { id: string; condition: boolean }[] = [
      {
        id: 'special_5_continents',
        condition: stats.visitedContinents.size >= 5,
      },
      {
        id: 'special_all_continents',
        condition: stats.visitedContinents.size >= 6,
      },
      { id: 'special_island_hopper', condition: stats.islandCount >= 5 },
      { id: 'special_city_explorer', condition: stats.totalCities >= 10 },
      { id: 'special_urban_legend', condition: stats.totalCities >= 25 },
      { id: 'special_metropolitan', condition: stats.totalCities >= 50 },
      { id: 'special_frequent_flyer', condition: stats.maxVisitCount >= 3 },
      { id: 'special_dedicated_traveler', condition: stats.maxVisitCount >= 5 },
      { id: 'special_week_abroad', condition: stats.maxDaysInCountry >= 7 },
      { id: 'special_month_abroad', condition: stats.maxDaysInCountry >= 30 },
      { id: 'special_world_resident', condition: stats.totalDays >= 100 },
      { id: 'special_storyteller', condition: stats.countriesWithNotes >= 5 },
      {
        id: 'special_travel_journalist',
        condition: stats.countriesWithNotes >= 10,
      },
      { id: 'special_perfect_trip', condition: stats.hasPerfectTrip },
      { id: 'special_nordic', condition: stats.nordicCount >= 5 },
      { id: 'special_mediterranean', condition: stats.mediterraneanCount >= 5 },
      {
        id: 'special_southeast_asia',
        condition: stats.southeastAsiaCount >= 5,
      },
    ];

    for (const check of specialChecks) {
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

    // Show celebration for the first newly unlocked achievement (skip during startup)
    if (newlyUnlocked.length > 0 && !this.suppressCelebrations) {
      await this.celebrateAchievement(newlyUnlocked[0]);
    }
  }

  /**
   * Legacy method for milestone checking (backwards compatibility).
   * Note: With reactive effects, this is now called automatically.
   * Keeping for explicit checks when needed.
   */
  async checkMilestone(visitedCount: number): Promise<void> {
    const visitedCodes = this.countryService
      .visitedCountries()
      .map((c) => c.code);
    await this.checkAchievements(visitedCodes);
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
    console.log(`[AchievementService] Achievement revoked: ${achievementId}`);
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

    const modal = await this.modalController.create({
      component: AchievementModalComponent,
      componentProps: {
        milestone: {
          count: achievement.requirement,
          title: achievement.title,
          icon: achievement.icon,
          color: achievement.color,
          message: achievement.unlockedMessage,
        },
        visitedCount: achievement.requirement,
      },
      cssClass: 'achievement-modal',
      backdropDismiss: true,
      showBackdrop: true,
    });

    await modal.present();
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
    return ALL_ACHIEVEMENTS.filter((a) => a.category === category).map((a) => ({
      ...a,
      unlocked: this.isUnlocked(a.id),
    }));
  }

  /**
   * Get next milestone achievement.
   */
  getNextMilestone(visitedCount: number): Achievement | null {
    return (
      MILESTONE_ACHIEVEMENTS.find((a) => a.requirement > visitedCount) || null
    );
  }

  /**
   * Load unlocked achievements from localStorage.
   */
  private loadUnlockedAchievements(): void {
    try {
      const stored = localStorage.getItem('hopahopa_achievements');
      if (stored) {
        const array: UnlockedAchievement[] = JSON.parse(stored);
        const map = new Map<string, UnlockedAchievement>();
        array.forEach((a) => map.set(a.id, a));
        this.unlockedAchievements.set(map);
      }
    } catch (error) {
      console.warn('[AchievementService] Could not load achievements');
    }
  }

  /**
   * Save unlocked achievements to localStorage.
   */
  private saveUnlockedAchievements(): void {
    try {
      const array = Array.from(this.unlockedAchievements().values());
      localStorage.setItem('hopahopa_achievements', JSON.stringify(array));
    } catch (error) {
      console.warn('[AchievementService] Could not save achievements');
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
    return MILESTONE_ACHIEVEMENTS.map((a) => ({
      count: a.requirement,
      title: a.title,
      icon: a.icon,
      color: a.color,
      message: a.unlockedMessage,
    }));
  }
}
