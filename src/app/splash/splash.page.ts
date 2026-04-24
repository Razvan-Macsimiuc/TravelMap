import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AssetPrefetchService } from '../services/asset-prefetch.service';
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule, IonContent],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="false">
      <div class="splash-container" [class.animate-in]="animateIn()" [class.fade-out]="fadeOut()">
        <!-- Animated background -->
        <div class="background-layer">
          <div class="gradient-orb orb-1"></div>
          <div class="gradient-orb orb-2"></div>
          <div class="gradient-orb orb-3"></div>
        </div>

        <!-- Logo & Brand -->
        <div class="brand-section" [class.show]="showBrand()">
          <div class="logo-container">
            <span class="logo-emoji">🌍</span>
            <div class="logo-ring"></div>
            <div class="logo-ring ring-2"></div>
          </div>
          <h1 class="app-name">HopaHopa</h1>
          <p class="tagline">Track Your World Adventures</p>
        </div>

        <!-- Loading indicator -->
        <div class="loading-section" [class.show]="showLoading()">
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styleUrls: ['splash.page.scss'],
})
export class SplashPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly assetPrefetch = inject(AssetPrefetchService);

  readonly animateIn = signal(false);
  readonly showBrand = signal(false);
  readonly showLoading = signal(false);
  readonly fadeOut = signal(false);

  private navigationTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    // Mark splash as shown for this session
    sessionStorage.setItem('hopahopa_splash_shown', 'true');

    // Warm map/tab chunks + GeoJSON cache while splash (and later welcome) runs
    this.assetPrefetch.warmupHeavyMapResources();

    // Trigger entrance animations
    setTimeout(() => this.animateIn.set(true), 100);
    setTimeout(() => this.showBrand.set(true), 200);
    setTimeout(() => this.showLoading.set(true), 600);

    // Determine where to navigate after splash
    const hasCompletedOnboarding = localStorage.getItem('hopahopa_welcome_seen') === 'true';

    // Auto-navigate after splash duration
    this.navigationTimeout = setTimeout(() => {
      this.fadeOut.set(true);
      
      setTimeout(() => {
        if (hasCompletedOnboarding) {
          // User has completed onboarding, go to map
          this.router.navigate(['/map'], { replaceUrl: true });
        } else {
          // First time user, go to onboarding
          this.router.navigate(['/welcome'], { replaceUrl: true });
        }
      }, 400);
    }, 1800); // 1.8 second splash screen
  }

  ngOnDestroy(): void {
    if (this.navigationTimeout) {
      clearTimeout(this.navigationTimeout);
    }
  }
}



