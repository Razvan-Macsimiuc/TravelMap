import { Injectable, inject } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular/standalone';

export type ErrorType =
  | 'network'
  | 'permission'
  | 'storage'
  | 'map'
  | 'unknown';

export interface ErrorContext {
  type: ErrorType;
  message: string;
  originalError?: unknown;
  recoverable?: boolean;
}

const ERROR_MESSAGES: Record<ErrorType, string> = {
  network: 'Network error. Please check your connection.',
  permission: 'Permission denied. Please grant the required permissions.',
  storage: 'Failed to save data. Please try again.',
  map: 'Failed to load map data. Please try again.',
  unknown: 'An unexpected error occurred. Please try again.',
};

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  /**
   * Show an error toast with a user-friendly message.
   */
  async showErrorToast(
    error: unknown,
    customMessage?: string,
    type: ErrorType = 'unknown'
  ): Promise<void> {
    const message = customMessage || this.getErrorMessage(error, type);

    console.error(`[ErrorService] ${type}:`, error);

    const toast = await this.toastController.create({
      message,
      duration: 4000,
      position: 'bottom',
      color: 'danger',
      icon: 'alert-circle-outline',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
  }

  /**
   * Show a warning toast (non-critical issues).
   */
  async showWarningToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'warning',
      icon: 'warning-outline',
    });

    await toast.present();
  }

  /**
   * Show a success toast.
   */
  async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      icon: 'checkmark-circle-outline',
    });

    await toast.present();
  }

  /**
   * Show an info toast.
   */
  async showInfoToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color: 'primary',
      icon: 'information-circle-outline',
    });

    await toast.present();
  }

  /**
   * Show an error alert for critical errors.
   */
  async showErrorAlert(
    title: string,
    message: string,
    onRetry?: () => void
  ): Promise<void> {
    const buttons: { text: string; role?: string; handler?: () => void }[] = [
      {
        text: 'OK',
        role: 'cancel',
      },
    ];

    if (onRetry) {
      buttons.unshift({
        text: 'Retry',
        handler: onRetry,
      });
    }

    const alert = await this.alertController.create({
      header: title,
      message,
      buttons,
    });

    await alert.present();
  }

  /**
   * Get a user-friendly error message.
   */
  private getErrorMessage(error: unknown, type: ErrorType): string {
    // Check for specific error types
    if (error instanceof Error) {
      // Network errors
      if (
        error.name === 'TypeError' &&
        error.message.includes('fetch')
      ) {
        return ERROR_MESSAGES.network;
      }

      // Permission errors
      if (
        error.message.includes('permission') ||
        error.message.includes('denied')
      ) {
        return ERROR_MESSAGES.permission;
      }

      // Capacitor errors
      if (error.message.includes('Not implemented on web')) {
        return 'This feature is only available on mobile devices.';
      }

      // User cancelled
      if (
        error.message.includes('cancelled') ||
        error.message.includes('canceled')
      ) {
        return ''; // Don't show toast for user cancellations
      }
    }

    return ERROR_MESSAGES[type] || ERROR_MESSAGES.unknown;
  }

  /**
   * Check if an error is a user cancellation (shouldn't show error).
   */
  isUserCancellation(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('cancelled') ||
        message.includes('canceled') ||
        message.includes('user denied') ||
        message.includes('user cancelled')
      );
    }
    return false;
  }

  /**
   * Log error to console with context.
   */
  logError(context: string, error: unknown): void {
    console.error(`[${context}]`, error);

    // In production, you might want to send this to a logging service
    if (error instanceof Error) {
      console.error(`  Message: ${error.message}`);
      console.error(`  Stack: ${error.stack}`);
    }
  }
}




