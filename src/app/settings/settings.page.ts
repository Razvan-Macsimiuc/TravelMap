import {
  Component,
  inject,
  signal,
  computed,
  OnDestroy,
  afterNextRender,
  ComponentRef,
  Injector,
  ViewContainerRef,
  viewChild,
  NgZone,
} from '@angular/core';
import { outputToObservable } from '@angular/core/rxjs-interop';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonIcon,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { AnimatedBackgroundComponent } from '../components/animated-background/animated-background.component';
import { addIcons } from 'ionicons';
import {
  trashOutline,
  informationCircleOutline,
  heartOutline,
  mapOutline,
  statsChartOutline,
  refreshOutline,
  playCircleOutline,
} from 'ionicons/icons';
import { SettingsService } from '../services/settings.service';
import { StorageService } from '../services/storage.service';
import { CountryService } from '../services/country.service';
import { AchievementService } from '../services/achievement.service';

// App version from package.json - will be replaced at build time
const APP_VERSION = '0.0.1';

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss', '../styles/premium-header.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    AnimatedBackgroundComponent,
  ],
})
export class SettingsPage implements OnDestroy {
  private readonly settingsService = inject(SettingsService);
  private readonly storageService = inject(StorageService);
  private readonly countryService = inject(CountryService);
  private readonly achievementService = inject(AchievementService);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly injector = inject(Injector);
  private readonly ngZone = inject(NgZone);

  private readonly reelOutlet = viewChild('reelOutlet', { read: ViewContainerRef });
  private reelComponentRef: ComponentRef<unknown> | null = null;

  readonly appVersion = APP_VERSION;

  // Stats for display
  readonly visitedCount = computed(() => this.countryService.visitedCount());

  /** Travel reel records stats/achievements; needs at least one visited country for meaningful output. */
  readonly reelRecordAvailable = computed(() => this.visitedCount() > 0);

  readonly showReel = signal(false);

  // Reset state
  readonly isResetting = signal(false);

  constructor() {
    addIcons({
      trashOutline,
      informationCircleOutline,
      heartOutline,
      mapOutline,
      statsChartOutline,
      refreshOutline,
      playCircleOutline,
    });
  }

  ngOnDestroy(): void {
    if (this.reelComponentRef) {
      this.reelComponentRef.destroy();
      this.reelComponentRef = null;
    }
  }

  openTravelReel(): void {
    if (!this.reelRecordAvailable()) return;
    if (this.reelComponentRef) return;
    void (async () => {
      const { TravelReelComponent } = await import(
        '../components/travel-reel/travel-reel.component'
      );
      this.showReel.set(true);
      afterNextRender(
        () => {
          const vc = this.reelOutlet();
          if (!vc || this.reelComponentRef) {
            return;
          }
          vc.clear();
          const ref = vc.createComponent(TravelReelComponent);
          ref.setInput('mapInstance', null);
          ref.changeDetectorRef.detectChanges();
          outputToObservable(
            ref.instance.closed as import('@angular/core').OutputRef<void>
          )
            .pipe(take(1))
            .subscribe(() => {
              this.ngZone.run(() => {
                ref.destroy();
                this.reelComponentRef = null;
                this.showReel.set(false);
              });
            });
          this.reelComponentRef = ref;
        },
        { injector: this.injector }
      );
    })();
  }

  /**
   * Show reset confirmation dialog.
   */
  async onResetData(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Reset All Data',
      message: `This will permanently delete all your travel data including:
        
• ${this.visitedCount()} visited countries
• All settings

This action cannot be undone.`,
      cssClass: 'reset-alert',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Reset Everything',
          role: 'destructive',
          handler: () => {
            this.performReset();
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Perform the actual data reset with minimum 2-second display.
   */
  private async performReset(): Promise<void> {
    this.isResetting.set(true);
    const startTime = Date.now();
    const MIN_DISPLAY_TIME = 2000; // 2 seconds minimum

    try {
      // Perform all reset operations
      await Promise.all([
        this.storageService.clearAll(),
        this.settingsService.resetSettings(),
      ]);

      // Reset achievement milestones
      this.achievementService.resetShownMilestones();

      // Reset welcome screen (show on next launch)
      localStorage.removeItem('hopahopa_welcome_seen');

      // Calculate remaining time to meet minimum display
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsedTime);

      // Wait for minimum display time
      await new Promise((resolve) => setTimeout(resolve, remainingTime));

      // Show success toast
      const toast = await this.toastController.create({
        message: 'All data has been reset. Restarting...',
        duration: 1500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle-outline',
      });
      await toast.present();

      // Reload the app after toast is visible
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('[SettingsPage] Error resetting data:', error);

      // Ensure minimum display time even on error
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsedTime);
      await new Promise((resolve) => setTimeout(resolve, remainingTime));

      this.isResetting.set(false);

      const toast = await this.toastController.create({
        message: 'Failed to reset data. Please try again.',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
        icon: 'alert-circle-outline',
      });
      await toast.present();
    }
    // Note: On success, we don't set isResetting to false because the page will reload
  }
}
