import { Component, Input, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, shareOutline } from 'ionicons/icons';
import { Share } from '@capacitor/share';
import { Milestone } from '../../services/achievement.service';
import { ConfettiEffect } from '../../utils/confetti';

@Component({
  selector: 'app-achievement-modal',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  template: `
    <div class="achievement-overlay" (click)="dismiss()">
      <div class="achievement-container" (click)="$event.stopPropagation()">
        <!-- Achievement Badge -->
        <div class="achievement-badge" [class.animate-in]="animateIn()">
          <div class="badge-glow" [style.background]="milestone?.color"></div>
          <div class="badge-icon">{{ milestone?.icon }}</div>
          <h1 class="badge-title">{{ milestone?.title }}</h1>
          <p class="badge-message">{{ milestone?.message }}</p>
          <div class="badge-count">
            <span class="count-number">{{ visitedCount }}</span>
            <span class="count-label">Countries Visited</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <ion-button
            expand="block"
            fill="outline"
            (click)="share()"
            class="share-button"
          >
            <ion-icon name="share-outline" slot="start"></ion-icon>
            Share Achievement
          </ion-button>

          <ion-button
            expand="block"
            fill="solid"
            (click)="dismiss()"
            class="continue-button"
          >
            Continue Exploring
          </ion-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .achievement-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20000;
      animation: fadeIn 0.3s ease-out;
    }

    .achievement-container {
      max-width: 400px;
      width: 90%;
      padding: var(--spacing-xl);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-lg);
    }

    .achievement-badge {
      position: relative;
      background: var(--ion-background-color);
      border-radius: var(--border-radius-xl);
      padding: var(--spacing-xl);
      text-align: center;
      box-shadow: var(--shadow-xl);
      border: 2px solid rgba(78, 205, 196, 0.3);
      transform: translateY(-100px) scale(0.5);
      opacity: 0;
      transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      overflow: hidden;

      &.animate-in {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }

    .badge-glow {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      opacity: 0.1;
      filter: blur(60px);
      animation: glowPulse 2s ease-in-out infinite;
    }

    @keyframes glowPulse {
      0%, 100% { opacity: 0.1; transform: scale(1); }
      50% { opacity: 0.2; transform: scale(1.1); }
    }

    .badge-icon {
      font-size: 5rem;
      margin-bottom: var(--spacing-md);
      animation: iconBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.3s;
      animation-fill-mode: both;
    }

    @keyframes iconBounce {
      0% { transform: scale(0) rotate(-180deg); }
      60% { transform: scale(1.2) rotate(10deg); }
      100% { transform: scale(1) rotate(0deg); }
    }

    .badge-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 var(--spacing-sm);
      background: var(--gradient-secondary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .badge-message {
      font-size: 1.1rem;
      color: var(--ion-color-medium);
      margin: 0 0 var(--spacing-lg);
      line-height: 1.4;
    }

    .badge-count {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--spacing-md);
      background: var(--ion-color-step-100);
      border-radius: var(--border-radius-md);
      min-width: 120px;

      .count-number {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--ion-color-primary);
        line-height: 1;
      }

      .count-label {
        font-size: 0.8rem;
        color: var(--ion-color-medium);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }
    }

    .action-buttons {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      animation: slideUp 0.5s ease-out 0.8s;
      animation-fill-mode: both;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .share-button {
      --border-width: 2px;
      --border-color: var(--ion-color-secondary);
      --color: var(--ion-color-secondary);
      font-weight: 600;
    }

    .continue-button {
      --background: var(--gradient-primary);
      font-weight: 600;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `],
})
export class AchievementModalComponent implements OnInit, OnDestroy {
  @Input() milestone?: Milestone;
  @Input() visitedCount: number = 0;

  private readonly modalController = inject(ModalController);
  private confetti: ConfettiEffect | null = null;

  readonly animateIn = signal(false);

  constructor() {
    addIcons({ closeOutline, shareOutline });
  }

  ngOnInit(): void {
    // Trigger entrance animation
    setTimeout(() => {
      this.animateIn.set(true);
    }, 100);

    // Create full-screen confetti
    this.confetti = new ConfettiEffect(document.body);
    
    // Trigger confetti bursts
    this.triggerFullScreenConfetti();
  }

  ngOnDestroy(): void {
    this.confetti?.destroy();
  }

  /**
   * Trigger full-screen confetti explosion.
   */
  private triggerFullScreenConfetti(): void {
    if (!this.confetti) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Multiple bursts for full-screen effect
    this.confetti.burst(centerX, centerY, 50);
    
    setTimeout(() => {
      this.confetti?.burst(centerX - 100, centerY - 50, 30);
      this.confetti?.burst(centerX + 100, centerY - 50, 30);
    }, 100);

    setTimeout(() => {
      this.confetti?.burst(centerX - 150, centerY + 50, 25);
      this.confetti?.burst(centerX + 150, centerY + 50, 25);
    }, 200);
  }

  /**
   * Share achievement via native share API or fallback.
   */
  async share(): Promise<void> {
    const text = `I just reached ${this.milestone?.title} in HopaHopa! 🌍 ${this.visitedCount} countries visited!`;

    try {
      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({
          title: `HopaHopa Achievement: ${this.milestone?.title}`,
          text: text,
          dialogTitle: 'Share Your Achievement',
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(text);
        console.log('[AchievementModal] Achievement text copied to clipboard');
      }
    } catch (error) {
      console.warn('[AchievementModal] Share not available:', error);
      // Fallback: Try clipboard
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Ignore
      }
    }
  }

  dismiss(): void {
    this.modalController.dismiss();
  }
}




