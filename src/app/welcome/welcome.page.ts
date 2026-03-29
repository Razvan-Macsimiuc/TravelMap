import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  earthOutline,
  trophyOutline,
  statsChartOutline,
} from 'ionicons/icons';

interface OnboardingSlide {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="false">
      <div class="welcome-container" [class.animate-in]="animateIn()">
        <!-- Animated background -->
        <div class="background-layer">
          <div class="gradient-orb orb-1"></div>
          <div class="gradient-orb orb-2"></div>
          <div class="gradient-orb orb-3"></div>
          <div class="grid-overlay"></div>
        </div>

        <!-- Logo & Brand -->
        <div class="brand-section" [class.show]="showBrand()">
          <div class="logo-container">
            <span class="logo-emoji">🌍</span>
            <div class="logo-ring"></div>
          </div>
          <h1 class="app-name">HopaHopa</h1>
          <p class="tagline">Track Your World Adventures</p>
        </div>

        <!-- Slides -->
        <div class="slides-container">
          @for (slide of slides; track slide.title; let i = $index) {
          <div
            class="slide"
            [class.active]="currentSlide() === i"
            [class.prev]="currentSlide() > i"
            [class.next]="currentSlide() < i"
          >
            <div class="slide-icon" [style.background]="slide.gradient">
              <ion-icon [name]="slide.icon"></ion-icon>
            </div>
            <h2 class="slide-title">{{ slide.title }}</h2>
            <p class="slide-description">{{ slide.description }}</p>
          </div>
          }
        </div>

        <!-- Pagination dots -->
        <div class="pagination">
          @for (slide of slides; track slide.title; let i = $index) {
          <button
            class="dot"
            [class.active]="currentSlide() === i"
            (click)="goToSlide(i)"
          ></button>
          }
        </div>

        <!-- Action buttons -->
        <div class="action-section" [class.show]="showActions()">
          @if (currentSlide() < slides.length - 1) {
          <button class="skip-btn" (click)="skip()">Skip</button>
          <button class="next-btn" (click)="nextSlide()">
            <span>Next</span>
            <ion-icon name="arrow-forward-outline"></ion-icon>
          </button>
          } @else {
          <button class="start-btn" (click)="getStarted()">
            <span>Start Exploring</span>
            <ion-icon name="arrow-forward-outline"></ion-icon>
          </button>
          }
        </div>
      </div>
    </ion-content>
  `,
  styleUrls: ['welcome.page.scss'],
})
export class WelcomePage implements OnInit {
  private readonly router = Router.prototype;

  readonly animateIn = signal(false);
  readonly showBrand = signal(false);
  readonly showActions = signal(false);
  readonly currentSlide = signal(0);

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

  constructor(private routerInstance: Router) {
    this.router = routerInstance;
    addIcons({
      arrowForwardOutline,
      earthOutline,
      trophyOutline,
      statsChartOutline,
    });
  }

  ngOnInit(): void {
    // Trigger entrance animations
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

  skip(): void {
    this.getStarted();
  }

  getStarted(): void {
    // Mark as seen in localStorage
    localStorage.setItem('hopahopa_welcome_seen', 'true');

    // Navigate to map
    this.router.navigate(['/map'], { replaceUrl: true });
  }
}
