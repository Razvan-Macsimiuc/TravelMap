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
import { Capacitor } from '@capacitor/core';
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
            <span class="count-label">{{ milestone?.countLabel ?? 'Countries Visited' }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <ion-button
            expand="block"
            fill="outline"
            (click)="share()"
            [disabled]="sharing()"
            class="share-button"
          >
            <ion-icon name="share-outline" slot="start"></ion-icon>
            {{ sharing() ? 'Preparing...' : 'Share Achievement' }}
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
      padding: var(--space-8);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-6);
    }

    .achievement-badge {
      position: relative;
      background: var(--ion-background-color);
      border-radius: var(--radius-xl);
      padding: var(--space-8);
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
      margin-bottom: var(--space-4);
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
      margin: 0 0 var(--space-2);
      background: var(--gradient-secondary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .badge-message {
      font-size: 1.1rem;
      color: var(--ion-color-medium);
      margin: 0 0 var(--space-6);
      line-height: 1.4;
    }

    .badge-count {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-4);
      background: var(--ion-color-step-100);
      border-radius: var(--radius-md);
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
      gap: var(--space-2);
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
  readonly sharing = signal(false);

  constructor() {
    addIcons({ closeOutline, shareOutline });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.animateIn.set(true);
    }, 100);

    this.confetti = new ConfettiEffect(document.body);
    this.triggerFullScreenConfetti();
  }

  ngOnDestroy(): void {
    this.confetti?.destroy();
  }

  private triggerFullScreenConfetti(): void {
    if (!this.confetti) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

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
   * Draws a standalone achievement card to a canvas and returns its data URL.
   * The card is self-contained (no DOM references) so it can be saved/shared.
   */
  private buildAchievementCard(): string {
    const W = 600;
    const H = 720;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const accent = this.milestone?.color ?? '#4ecdc4';

    // ── Background ───────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0a0a14');
    bgGrad.addColorStop(1, '#13132a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Radial accent glow behind the card
    const glow = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, W * 0.65);
    glow.addColorStop(0, accent + '28');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // ── App name header ──────────────────────────────────────
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✈  HopaHopa', W / 2, 38);

    // ── Card ─────────────────────────────────────────────────
    const cx = 32, cy = 68, cw = W - 64, ch = H - 68 - 52;

    // Card drop shadow / glow
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 48;
    this.roundRect(ctx, cx, cy, cw, ch, 28);
    ctx.fillStyle = '#161626';
    ctx.fill();
    ctx.restore();

    // Card border
    this.roundRect(ctx, cx, cy, cw, ch, 28);
    ctx.strokeStyle = accent + '55';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Achievement icon ─────────────────────────────────────
    ctx.font = '80px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const iconY = cy + 115;
    ctx.fillText(this.milestone?.icon ?? '🌍', W / 2, iconY);

    // ── Title ────────────────────────────────────────────────
    const titleGrad = ctx.createLinearGradient(cx, 0, cx + cw, 0);
    titleGrad.addColorStop(0, '#4ecdc4');
    titleGrad.addColorStop(1, '#45b7d1');
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = titleGrad;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleY = iconY + 80;
    ctx.fillText(this.milestone?.title ?? 'Achievement Unlocked', W / 2, titleY);

    // ── Message (wrapped) ─────────────────────────────────────
    ctx.font = '19px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#8888aa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const msgLines = this.wrapText(ctx, this.milestone?.message ?? '', cw - 80);
    let msgY = titleY + 50;
    for (const line of msgLines) {
      ctx.fillText(line, W / 2, msgY);
      msgY += 30;
    }

    // ── Count bubble ─────────────────────────────────────────
    const bw = 180, bh = 88, bx = (W - bw) / 2, by = msgY + 20;

    this.roundRect(ctx, bx, by, bw, bh, 16);
    ctx.fillStyle = accent + '18';
    ctx.fill();
    ctx.strokeStyle = accent + '45';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(this.visitedCount), W / 2, by + 42);

    const countLabel = (this.milestone?.countLabel ?? 'Countries Visited').toUpperCase();
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#55556a';
    ctx.textBaseline = 'middle';
    ctx.fillText(countLabel, W / 2, by + 72);

    // ── Bottom tagline ────────────────────────────────────────
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#333348';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Track your travels around the world  •  hopahopa.app', W / 2, H - 24);

    return canvas.toDataURL('image/png');
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  /**
   * Renders the achievement card to a PNG and shares it.
   *
   * On native (iOS / Android) the image is written to the cache directory
   * so that the OS share sheet can read it as a real file URI.
   * On web the image never touches Capacitor Filesystem — we hand a File
   * blob straight to the Web Share API (or fall back to a download).
   */
  async share(): Promise<void> {
    if (this.sharing()) return;
    this.sharing.set(true);

    try {
      const dataUrl = this.buildAchievementCard();

      if (Capacitor.isNativePlatform()) {
        await this.nativeShare(dataUrl);
      } else {
        await this.webShare(dataUrl);
      }
    } finally {
      this.sharing.set(false);
    }
  }

  private async nativeShare(dataUrl: string): Promise<void> {
    const base64Data = dataUrl.split(',')[1];
    const fileName = `hopahopa-achievement-${Date.now()}.png`;
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    const { uri } = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Cache,
    });

    try {
      await Share.share({
        files: [uri],
        title: `HopaHopa – ${this.milestone?.title}`,
        dialogTitle: 'Share Your Achievement',
      });
    } finally {
      try {
        await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache });
      } catch {
        // cleanup is best-effort
      }
    }
  }

  private async webShare(dataUrl: string): Promise<void> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], 'hopahopa-achievement.png', { type: 'image/png' });

    // Web Share API Level 2 — supported on Chrome Android, Safari 15+, Edge
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
    };
    if (nav.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `HopaHopa – ${this.milestone?.title}` });
        return;
      } catch (err) {
        // User cancelled or share failed — fall through to download
        if ((err as DOMException).name === 'AbortError') return;
      }
    }

    // Desktop fallback: download the PNG
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'hopahopa-achievement.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  dismiss(): void {
    this.modalController.dismiss();
  }
}
