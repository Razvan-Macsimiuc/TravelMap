import { Injectable, inject } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import {
  ModalController,
  PopoverController,
  AlertController,
  ActionSheetController,
  ToastController,
} from '@ionic/angular/standalone';
import { filter } from 'rxjs/operators';

/**
 * Service that automatically closes all open overlays (modals, popovers, alerts, etc.)
 * when navigating between pages.
 *
 * This service should be injected in the app component to ensure it's active app-wide.
 */
@Injectable({
  providedIn: 'root',
})
export class OverlayService {
  private readonly router = inject(Router);
  private readonly modalController = inject(ModalController);
  private readonly popoverController = inject(PopoverController);
  private readonly alertController = inject(AlertController);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly toastController = inject(ToastController);

  private isInitialized = false;

  /**
   * Initialize the overlay service to listen for navigation events.
   * Call this once in the app component.
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    // Listen to navigation start events
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => {
        this.dismissAllOverlays();
      });

  }

  /**
   * Dismiss all open overlays.
   * Called automatically on navigation, but can also be called manually.
   */
  async dismissAllOverlays(): Promise<void> {
    await Promise.all([
      this.dismissAllModals(),
      this.dismissAllPopovers(),
      this.dismissAllAlerts(),
      this.dismissAllActionSheets(),
      // Note: We don't dismiss toasts as they're usually informational and auto-dismiss
    ]);
  }

  /**
   * Dismiss all open modals.
   */
  private async dismissAllModals(): Promise<void> {
    try {
      let modal = await this.modalController.getTop();
      while (modal) {
        await modal.dismiss();
        modal = await this.modalController.getTop();
      }
    } catch (error) {
      // No modal to dismiss or already dismissed
    }
  }

  /**
   * Dismiss all open popovers.
   */
  private async dismissAllPopovers(): Promise<void> {
    try {
      let popover = await this.popoverController.getTop();
      while (popover) {
        await popover.dismiss();
        popover = await this.popoverController.getTop();
      }
    } catch (error) {
      // No popover to dismiss or already dismissed
    }
  }

  /**
   * Dismiss all open alerts.
   */
  private async dismissAllAlerts(): Promise<void> {
    try {
      let alert = await this.alertController.getTop();
      while (alert) {
        await alert.dismiss();
        alert = await this.alertController.getTop();
      }
    } catch (error) {
      // No alert to dismiss or already dismissed
    }
  }

  /**
   * Dismiss all open action sheets.
   */
  private async dismissAllActionSheets(): Promise<void> {
    try {
      let actionSheet = await this.actionSheetController.getTop();
      while (actionSheet) {
        await actionSheet.dismiss();
        actionSheet = await this.actionSheetController.getTop();
      }
    } catch (error) {
      // No action sheet to dismiss or already dismissed
    }
  }

  /**
   * Dismiss all toasts (optional, usually not needed).
   */
  async dismissAllToasts(): Promise<void> {
    try {
      let toast = await this.toastController.getTop();
      while (toast) {
        await toast.dismiss();
        toast = await this.toastController.getTop();
      }
    } catch (error) {
      // No toast to dismiss or already dismissed
    }
  }
}

