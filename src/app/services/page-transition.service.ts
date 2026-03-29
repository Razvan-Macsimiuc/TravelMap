import { Injectable, signal } from '@angular/core';

export interface TransitionState {
  isTransitioning: boolean;
  fromPosition?: { x: number; y: number };
  countryCode?: string;
  countryName?: string;
}

/**
 * Service to manage shared element transitions between pages.
 * Handles the zoom-in effect from map to country detail.
 */
@Injectable({
  providedIn: 'root',
})
export class PageTransitionService {
  private readonly transitionState = signal<TransitionState>({
    isTransitioning: false,
  });

  readonly transition = this.transitionState.asReadonly();

  /**
   * Start transition from map to country detail.
   */
  startTransition(
    countryCode: string,
    countryName: string,
    position: { x: number; y: number }
  ): void {
    this.transitionState.set({
      isTransitioning: true,
      fromPosition: position,
      countryCode,
      countryName,
    });

    console.log('[PageTransitionService] Starting transition for', countryName, 'at', position);
  }

  /**
   * Complete the transition (called when destination page is ready).
   */
  completeTransition(): void {
    // Keep position info briefly for exit animation
    setTimeout(() => {
      this.transitionState.update((state) => ({
        ...state,
        isTransitioning: false,
      }));
    }, 100);
  }

  /**
   * Reset transition state.
   */
  resetTransition(): void {
    this.transitionState.set({
      isTransitioning: false,
    });
  }

  /**
   * Get current transition state.
   */
  getTransitionState(): TransitionState {
    return this.transitionState();
  }
}




