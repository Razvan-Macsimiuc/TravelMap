import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  locationOutline,
  statsChartOutline,
  refreshOutline,
  playCircleOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { SettingsService } from '../services/settings.service';
import { StorageService } from '../services/storage.service';
import { CountryService } from '../services/country.service';
import { AchievementService } from '../services/achievement.service';
import { BirthplaceService } from '../services/birthplace.service';

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
export class SettingsPage {
  private readonly settingsService = inject(SettingsService);
  private readonly storageService = inject(StorageService);
  private readonly countryService = inject(CountryService);
  private readonly achievementService = inject(AchievementService);
  private readonly birthplaceService = inject(BirthplaceService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  readonly appVersion = APP_VERSION;

  readonly visitedCount = computed(() => this.countryService.visitedCount());

  readonly savedCityCount = computed(() =>
    this.countryService
      .countries()
      .reduce((n, c) => n + (c.cities?.length ?? 0), 0)
  );

  readonly reelRecordAvailable = computed(() => this.visitedCount() > 0);

  readonly isResetting = signal(false);

  constructor() {
    addIcons({
      trashOutline,
      informationCircleOutline,
      heartOutline,
      mapOutline,
      locationOutline,
      statsChartOutline,
      refreshOutline,
      playCircleOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
    });
  }

  openTravelReel(): void {
    if (!this.reelRecordAvailable()) return;
    void this.router.navigate(['/map'], { queryParams: { travelReel: '1' } });
  }

  async onResetData(): Promise<void> {
    const visited = this.visitedCount();
    const cities = this.savedCityCount();
    const alert = await this.alertController.create({
      header: 'Reset All Data',
      message: `This will permanently delete all your travel data including:\n\n• ${visited} visited countries\n• ${cities} saved cities\n• All settings\n\nThis action cannot be undone.`,
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

  private async performReset(): Promise<void> {
    this.isResetting.set(true);
    const startTime = Date.now();
    const MIN_DISPLAY_TIME = 2000;

    try {
      await Promise.all([
        this.storageService.clearAll(),
        this.settingsService.resetSettings(),
      ]);

      await this.birthplaceService.clear();

      this.achievementService.resetShownMilestones();

      localStorage.removeItem('hopahopa_welcome_seen');

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsedTime);

      await new Promise((resolve) => setTimeout(resolve, remainingTime));

      const toast = await this.toastController.create({
        message: 'All data has been reset. Restarting...',
        duration: 1500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle-outline',
      });
      await toast.present();

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('[SettingsPage] Error resetting data:', error);

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
  }
}
