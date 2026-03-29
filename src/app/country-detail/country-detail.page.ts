import {
  Component,
  OnInit,
  inject,
  computed,
  signal,
} from '@angular/core';
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
  NavController,
} from '@ionic/angular/standalone';
import { AnimatedBackgroundComponent } from '../components/animated-background/animated-background.component';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';
import { CountryService } from '../services/country.service';
import { PageTransitionService } from '../services/page-transition.service';
import { AchievementService } from '../services/achievement.service';
import { Country } from '../models/country.model';

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
    AnimatedBackgroundComponent,
  ],
})
export class CountryDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly countryService = inject(CountryService);
  private readonly pageTransitionService = inject(PageTransitionService);
  private readonly achievementService = inject(AchievementService);
  private readonly navController = inject(NavController);

  private readonly countryCode = signal<string>('');

  readonly country = computed<Country | undefined>(() => {
    const code = this.countryCode();
    return code ? this.countryService.getCountryByCode(code) : undefined;
  });

  readonly flagEmoji = computed(() => {
    const code = this.countryCode();
    return code ? this.countryCodeToFlag(code) : '🏳️';
  });

  readonly isVisited = computed(() => this.country()?.visited ?? false);

  readonly isPageLoading = signal(true);

  readonly showHeader = signal(false);

  constructor() {
    addIcons({ checkmarkCircle, closeCircle });
  }

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code');
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
  }

  async onVisitedToggle(event: CustomEvent): Promise<void> {
    const code = this.countryCode();
    const country = this.country();
    if (code && country) {
      const wasVisited = country.visited;
      this.countryService.toggleVisited(code, country.name);
      const newStatus =
        this.countryService.getCountryByCode(code)?.visited ?? false;

      if (!wasVisited && newStatus) {
        const visitedCount = this.countryService.visitedCount();
        await this.achievementService.checkMilestone(visitedCount);
      }
    }
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

  private countryCodeToFlag(countryCode: string): string {
    const code = countryCode.toUpperCase();
    if (code.length !== 2) return '🏳️';

    const codePoints = [...code].map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
}
