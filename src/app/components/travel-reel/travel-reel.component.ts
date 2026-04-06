import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  output,
  input,
  ElementRef,
  viewChild,
} from '@angular/core';

// Minimal duck-typed interface — only what we need from mapboxgl.Map
interface SpinnableMap {
  getCanvas(): HTMLCanvasElement;
  setBearing(bearing: number): void;
  getBearing(): number;
  getCenter(): { lng: number; lat: number };
  setCenter(center: { lng: number; lat: number }): void;
  getZoom(): number;
  setZoom(zoom: number): void;
}
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, shareOutline, downloadOutline, playOutline, airplane } from 'ionicons/icons';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { CountryService } from '../../services/country.service';
import { AchievementService, CONTINENT_MAP } from '../../services/achievement.service';

// ── Canvas constants ──────────────────────────────────────────────────────────
const W = 540;
const H = 960;
const TOTAL_S = 21;

// ── Colour palette ────────────────────────────────────────────────────────────
const BG = '#0a0a14';
const CARD = '#161626';
const ACCENT = '#4ecdc4';
const SECONDARY = '#45b7d1';
const TEXT = '#ffffff';
const MUTED = '#8888aa';
const DIM = '#333348';

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// ── Compact country centroids [lat, lng] for globe dot projection ─────────────
const CENTROIDS: Record<string, [number, number]> = {
  // Europe
  GB:[54,-2],FR:[46,2],DE:[51,10],IT:[42,12],ES:[40,-4],PT:[39,-8],
  NL:[52,5],BE:[50,4],CH:[47,8],AT:[47,14],PL:[52,20],CZ:[50,15],
  GR:[39,22],SE:[62,15],NO:[64,13],DK:[56,10],FI:[64,26],IE:[53,-8],
  HU:[47,19],RO:[46,25],HR:[45,16],RS:[44,21],BG:[43,25],SK:[49,19],
  SI:[46,15],BA:[44,17],AL:[41,20],MK:[42,22],LT:[56,24],LV:[57,25],
  EE:[59,25],LU:[50,6],IS:[65,-18],MT:[36,14],CY:[35,33],
  // Asia
  CN:[35,105],JP:[36,138],KR:[36,128],IN:[20,79],TH:[15,101],VN:[16,107],
  ID:[-5,120],MY:[4,110],SG:[1,104],PH:[13,122],TW:[24,121],HK:[22,114],
  TR:[39,35],SA:[24,45],AE:[24,54],IL:[31,35],JO:[31,36],LB:[34,36],
  PK:[30,69],BD:[24,90],NP:[28,84],LK:[8,81],KH:[13,105],MM:[17,96],
  LA:[18,103],MN:[46,105],KZ:[48,68],UZ:[41,64],TM:[39,59],AZ:[40,47],
  GE:[42,44],AM:[40,45],IQ:[33,44],IR:[33,53],AF:[33,65],KW:[29,47],
  QA:[25,51],BH:[26,50],OM:[22,57],YE:[15,48],SY:[35,38],
  // Americas
  US:[38,-97],CA:[60,-95],MX:[23,-102],BR:[-10,-55],AR:[-34,-64],
  CL:[-30,-71],CO:[4,-72],PE:[-10,-76],VE:[8,-66],EC:[-2,-77],
  BO:[-17,-65],PY:[-23,-58],UY:[-33,-56],CR:[10,-84],PA:[9,-80],
  GT:[15,-90],HN:[15,-87],SV:[14,-89],NI:[13,-85],CU:[22,-80],
  DO:[19,-71],JM:[18,-78],HT:[19,-72],TT:[11,-61],PR:[18,-67],
  // Africa
  ZA:[-29,25],NG:[9,8],KE:[1,38],ET:[9,40],GH:[8,-1],TZ:[-6,35],
  EG:[27,30],MA:[32,-5],TN:[34,9],DZ:[28,3],LY:[27,17],SD:[15,30],
  AO:[-12,18],MZ:[-18,35],ZM:[-14,28],ZW:[-19,30],BW:[-22,24],
  NA:[-22,17],MG:[-20,47],CI:[7,-6],CM:[6,12],SN:[14,-14],ML:[17,-4],
  NE:[17,8],TD:[15,19],SO:[10,49],UG:[1,32],RW:[-2,30],BI:[-3,30],
  CD:[-4,24],CG:[-1,15],GA:[-1,12],MU:[-20,57],
  // Oceania
  AU:[-25,135],NZ:[-41,174],PG:[-6,147],FJ:[-18,179],
  // Eastern Europe / Russia
  RU:[60,90],UA:[49,31],BY:[53,28],MD:[47,29],
};

@Component({
  selector: 'app-travel-reel',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, IonSpinner],
  template: `
    <div class="reel-overlay">
      <div class="reel-wrapper">

        <!-- Loading -->
        @if (phase() === 'loading') {
          <div class="reel-center">
            <ion-spinner name="crescent" color="light"></ion-spinner>
            <p class="reel-hint-text">Preparing your travel story…</p>
          </div>
        }

        <!-- Error -->
        @if (phase() === 'error') {
          <div class="reel-center">
            <p class="reel-error-text">Could not load map data.<br>Check your connection.</p>
            <ion-button fill="outline" color="light" (click)="dismiss()">Close</ion-button>
          </div>
        }

        <!-- Canvas: always in DOM so viewChild resolves; hidden until playing -->
        <canvas
          #reelCanvas
          width="540"
          height="960"
          [class.reel-canvas-visible]="phase() === 'playing' || phase() === 'done'"
        ></canvas>

        <!-- Progress bar while recording -->
        @if (phase() === 'playing') {
          <div class="reel-progress-track">
            <div class="reel-progress-fill" [style.width.%]="progress() * 100"></div>
          </div>
          <p class="reel-recording-label">● Recording…</p>
        }

        <!-- Done -->
        @if (phase() === 'done') {
          <!-- Centred app logo shown on completion -->
          <div class="reel-done-logo">
            <div class="reel-done-logo-ring">
              <ion-icon name="airplane" class="reel-done-logo-icon"></ion-icon>
            </div>
            <span class="reel-done-logo-name">HopaHopa</span>
            <span class="reel-done-logo-sub">Your travel story is ready</span>
          </div>

          <div class="reel-done-overlay">
            @if (videoReady()) {
              @if (canNativeShare()) {
                <!-- Native or mobile-web file share -->
                <ion-button expand="block" class="reel-share-btn" (click)="share()" [disabled]="sharing()">
                  <ion-icon name="share-outline" slot="start"></ion-icon>
                  {{ sharing() ? 'Opening share…' : 'Share or save video' }}
                </ion-button>
                <p class="reel-social-hint">
                  In the next sheet, pick WhatsApp, Instagram, Messages, or your gallery app. If they’re not listed, tap “More”.
                  @if (recordingFormat() === 'webm') {
                    <span class="reel-social-hint-warn">
                      This device saved the reel as WebM (most Android browsers). WhatsApp usually accepts it; Instagram often works best if you use “Save to Photos” or “Save to Files” here, then upload from inside Instagram.
                    </span>
                  }
                </p>
                @if (shareError()) {
                  <p class="reel-error-text reel-share-err">{{ shareError() }}</p>
                }
              } @else {
                <!-- Desktop: download + status message -->
                <ion-button expand="block" class="reel-share-btn" (click)="saveToDevice()" [disabled]="sharing()">
                  <ion-icon name="download-outline" slot="start"></ion-icon>
                  {{ downloadStatus() || 'Save to Device' }}
                </ion-button>
                @if (downloadStatus()) {
                  <p class="reel-saved-hint">Open your Downloads folder to share the video.</p>
                }
              }
            } @else {
              <p class="reel-hint-text">Screen-record this video to share it.</p>
            }
            <ion-button expand="block" class="reel-close-overlay-btn" (click)="dismiss()">
              Close
            </ion-button>
          </div>
        }

        <!-- Always-visible close -->
        <button class="reel-close-btn" (click)="dismiss()" aria-label="Close">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background: #000;
    }

    .reel-overlay {
      position: fixed;
      inset: 0;
      z-index: 9000;
      background: #000;
    }

    .reel-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      overflow: hidden;
    }

    canvas {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      opacity: 0;
      transition: opacity 0.4s ease;
    }

    .reel-canvas-visible {
      opacity: 1 !important;
    }

    .reel-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }

    .reel-hint-text {
      color: #8888aa;
      font-size: 15px;
      text-align: center;
      margin: 0;
    }

    .reel-saved-hint {
      color: #4ecdc4;
      font-size: 13px;
      text-align: center;
      margin: 0;
      opacity: 0.85;
    }

    .reel-error-text {
      color: #ff6b6b;
      font-size: 16px;
      text-align: center;
      margin: 0;
      line-height: 1.5;
    }

    .reel-share-err {
      font-size: 13px;
      line-height: 1.45;
    }

    .reel-social-hint {
      color: rgba(200, 200, 220, 0.92);
      font-size: 12.5px;
      line-height: 1.45;
      text-align: center;
      margin: 0;
    }

    .reel-social-hint-warn {
      display: block;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      color: rgba(255, 200, 120, 0.95);
    }

    .reel-progress-track {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.1);
    }

    .reel-progress-fill {
      height: 100%;
      background: #4ecdc4;
      transition: width 0.15s linear;
    }

    .reel-recording-label {
      position: absolute;
      bottom: 10px;
      left: 16px;
      color: #ff4040;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin: 0;
      opacity: 0.85;
    }

    .reel-done-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 20px 24px calc(20px + env(safe-area-inset-bottom, 0px));
      background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 70%, transparent);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .reel-share-btn {
      --background: #4ecdc4;
      --color: #0a0a14;
      font-weight: 700;
    }

    .reel-close-overlay-btn {
      --background: transparent;
      --background-hover: rgba(255, 255, 255, 0.08);
      --color: rgba(255, 255, 255, 0.75);
      --border-color: rgba(255, 255, 255, 0.3);
      --border-style: solid;
      --border-width: 1.5px;
      font-weight: 500;
    }

    .reel-done-logo {
      position: absolute;
      inset: 0;
      bottom: 180px; /* clear the done-overlay panel */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      pointer-events: none;
      animation: reelLogoIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @keyframes reelLogoIn {
      from { opacity: 0; transform: scale(0.6) translateY(20px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .reel-done-logo-ring {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, rgba(78, 205, 196, 0.28), rgba(69, 183, 209, 0.12));
      border: 2px solid rgba(78, 205, 196, 0.55);
      box-shadow: 0 0 32px rgba(78, 205, 196, 0.35), inset 0 0 18px rgba(78, 205, 196, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: reelRingPulse 2.8s ease-in-out infinite;
    }

    @keyframes reelRingPulse {
      0%, 100% { box-shadow: 0 0 28px rgba(78, 205, 196, 0.3), inset 0 0 14px rgba(78, 205, 196, 0.1); }
      50%       { box-shadow: 0 0 48px rgba(78, 205, 196, 0.55), inset 0 0 22px rgba(78, 205, 196, 0.18); }
    }

    .reel-done-logo-icon {
      font-size: 42px;
      color: #4ecdc4;
      filter: drop-shadow(0 0 8px rgba(78, 205, 196, 0.7));
      transform: rotate(-35deg);
    }

    .reel-done-logo-name {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(90deg, #4ecdc4, #45b7d1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: drop-shadow(0 0 12px rgba(78, 205, 196, 0.4));
    }

    .reel-done-logo-sub {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.5);
      letter-spacing: 0.3px;
    }

    .reel-close-btn {
      position: absolute;
      top: calc(14px + env(safe-area-inset-top, 0px));
      right: 14px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.65);
      border: 1.5px solid rgba(255, 255, 255, 0.35);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      transition: background 0.18s ease, transform 0.15s ease;

      ion-icon {
        font-size: 22px;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      &:active {
        transform: scale(0.9);
      }
    }
  `],
})
export class TravelReelComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly closed = output<void>();
  readonly mapInstance = input<SpinnableMap | null>(null);

  private readonly countryService = inject(CountryService);
  private readonly achievementService = inject(AchievementService);

  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('reelCanvas');

  readonly phase = signal<'loading' | 'playing' | 'done' | 'error'>('loading');
  readonly progress = signal(0);
  readonly sharing = signal(false);
  readonly videoReady = signal(false);
  /** True when the platform supports sharing a video file directly. */
  readonly canNativeShare = signal(false);
  /** Set to a confirmation string after a successful desktop download. */
  readonly downloadStatus = signal('');
  /** Native share failed (e.g. Android FileProvider / URI issues). */
  readonly shareError = signal<string | null>(null);
  /** Chrome/Android usually record WebM; Safari often MP4 — matters for Instagram / some apps. */
  readonly recordingFormat = signal<'mp4' | 'webm' | 'unknown'>('unknown');

  private ctx!: CanvasRenderingContext2D;
  private viewReady = false;

  // Animation state
  private animFrame: number | null = null;
  private startTime = 0;

  // Recording state
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private videoBlob: Blob | null = null;
  private resolveRecorderStopped: (() => void) | null = null;
  private recorderStoppedPromise = Promise.resolve();

  // Travel data
  private visitedCodes = new Set<string>();
  private visitedList: string[] = [];
  private visitedNames = new Map<string, string>(); // code → display name
  private initialBearing = 0; // saved Mapbox bearing before reel starts
  private initialCenterLng = 0;
  private initialCenterLat = 20;
  private initialZoom = 1.8;
  /** Zoom used only during intro — pulled back so the full globe fits the frame. */
  private reelIntroZoom = 1.15;
  private flagImages = new Map<string, HTMLImageElement>();
  private unlockedAchievements: Array<{ icon: string; title: string; color: string }> = [];
  private visitedCount = 0;
  private achievementsCount = 0;
  private totalAchievementsCount = 0;
  private continentsCount = 0;

  // Floating starfield particles
  private stars: Array<{ x: number; y: number; vx: number; vy: number; r: number; a: number }> = [];
  // Per-achievement sparkle bursts
  private sparkles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string }> = [];
  private lastFrameTime = 0;

  constructor() {
    addIcons({ closeOutline, shareOutline, downloadOutline, playOutline, airplane });
  }

  ngOnInit(): void {
    this.gatherData();
    this.preloadFlags();
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef().nativeElement.getContext('2d')!;
    this.viewReady = true;
    this.maybeStart();
  }

  ngOnDestroy(): void {
    if (this.animFrame !== null) cancelAnimationFrame(this.animFrame);
    if (this.recorder?.state === 'recording') this.recorder.stop();
    const m = this.mapInstance();
    if (m) {
      m.setCenter({ lng: this.initialCenterLng, lat: this.initialCenterLat });
      m.setBearing(this.initialBearing);
      m.setZoom(this.initialZoom);
    }
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────────

  private gatherData(): void {
    const m = this.mapInstance();
    this.initialBearing = m?.getBearing() ?? 0;
    if (m) {
      const c = m.getCenter();
      this.initialCenterLng = c.lng;
      this.initialCenterLat = c.lat;
      this.initialZoom = m.getZoom();
      // Between full-world and tight crop — pairs with `fit` in drawIntro.
      this.reelIntroZoom = Math.max(1, Math.min(8, this.initialZoom - 0.78));
    }
    const visited = this.countryService.visitedCountries();
    this.visitedList = visited.map(c => c.code);
    visited.forEach(c => this.visitedNames.set(c.code, c.name));
    this.visitedCodes = new Set(this.visitedList);
    this.visitedCount = visited.length;

    const continents = new Set(
      visited.map(c => CONTINENT_MAP[c.code]).filter(Boolean)
    );
    this.continentsCount = continents.size;

    const allAch = [
      ...this.achievementService.milestoneAchievements(),
      ...this.achievementService.continentAchievements(),
      ...this.achievementService.specialAchievements(),
    ];
    this.unlockedAchievements = allAch
      .filter(a => a.unlocked)
      .map(a => ({ icon: a.icon, title: a.title, color: a.color }))
      .slice(0, 12);
    this.achievementsCount = this.unlockedAchievements.length;
    this.totalAchievementsCount = this.achievementService.totalCount();

    // Detect whether the platform can share a video file.
    // Native apps always can. On the web, Web Share API Level 2 with video
    // files works on mobile Chrome/Safari but NOT on desktop Chrome/Windows.
    if (Capacitor.isNativePlatform()) {
      this.canNativeShare.set(true);
    } else {
      try {
        const testBlob = new Blob([''], { type: 'video/webm' });
        const testFile = new File([testBlob], 'test.webm', { type: 'video/webm' });
        const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
        this.canNativeShare.set(nav.canShare?.({ files: [testFile] }) ?? false);
      } catch {
        this.canNativeShare.set(false);
      }
    }
  }

  /** Fire-and-forget: loads flag PNGs from flagcdn.com into the cache.
   *  Called during ngOnInit so images are ready before scene 2 (t=3 s). */
  private preloadFlags(): void {
    for (const code of this.visitedList) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => this.flagImages.set(code, img);
      img.src = `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
    }
  }

  private maybeStart(): void {
    if (!this.viewReady) return;
    this.initStars();
    this.setupRecorder();
    this.phase.set('playing');
    this.animFrame = requestAnimationFrame(ts => this.animate(ts));
  }

  private initStars(): void {
    this.stars = Array.from({ length: 55 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.4 + 0.05),
      r: Math.random() * 1.6 + 0.3,
      a: Math.random() * 0.45 + 0.08,
    }));
  }

  // ── MediaRecorder ───────────────────────────────────────────────────────────

  private setupRecorder(): void {
    this.recorderStoppedPromise = new Promise<void>((resolve) => {
      this.resolveRecorderStopped = resolve;
    });

    if (typeof MediaRecorder === 'undefined') {
      this.resolveRecorderStopped?.();
      this.resolveRecorderStopped = null;
      return;
    }
    try {
      const stream = this.canvasRef().nativeElement.captureStream(30);
      // WhatsApp / Instagram generally prefer H.264 in MP4; Chrome/Edge often only offer WebM from canvas.
      const types = [
        'video/mp4;codecs=avc1.42E01E',
        'video/mp4;codecs=avc1.4D401E',
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      const mimeType = types.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
      this.recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2_500_000,
      });
      this.recorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };
      this.recorder.onstop = () => {
        const mime = (this.recorder?.mimeType || mimeType || '').trim();
        const blobType = mime || 'video/webm';
        this.videoBlob = new Blob(this.chunks, { type: blobType });
        const low = blobType.toLowerCase();
        if (low.includes('mp4') || low.includes('mpeg4') || low.includes('avc1')) {
          this.recordingFormat.set('mp4');
        } else if (low.includes('webm')) {
          this.recordingFormat.set('webm');
        } else {
          this.recordingFormat.set('unknown');
        }
        this.videoReady.set(true);
        this.resolveRecorderStopped?.();
        this.resolveRecorderStopped = null;
      };
      this.recorder.start(100);
    } catch {
      this.resolveRecorderStopped?.();
      this.resolveRecorderStopped = null;
    }
  }

  // ── Animation loop ──────────────────────────────────────────────────────────

  private animate(ts: number): void {
    if (this.startTime === 0) this.startTime = ts;
    const dt = this.lastFrameTime ? Math.min((ts - this.lastFrameTime) / 1000, 0.05) : 0.016;
    this.lastFrameTime = ts;
    const t = Math.min((ts - this.startTime) / 1000, TOTAL_S);
    this.progress.set(t / TOTAL_S);
    this.updateStars(dt);
    this.updateSparkles(dt);
    this.drawFrame(t);

    if (t < TOTAL_S) {
      this.animFrame = requestAnimationFrame((nts) => this.animate(nts));
    } else {
      void this.onAnimationEnd().catch(() => {
        this.phase.set('done');
      });
    }
  }

  private updateStars(dt: number): void {
    for (const s of this.stars) {
      s.x += s.vx * dt * 60;
      s.y += s.vy * dt * 60;
      if (s.y < -4) { s.y = H + 4; s.x = Math.random() * W; }
      if (s.x < -4) s.x = W + 4;
      if (s.x > W + 4) s.x = -4;
    }
  }

  private updateSparkles(dt: number): void {
    for (const sp of this.sparkles) {
      sp.x += sp.vx * dt * 60;
      sp.y += sp.vy * dt * 60;
      sp.life -= dt;
      sp.vy += 0.5 * dt * 60; // gravity
    }
    // prune dead sparkles
    this.sparkles = this.sparkles.filter(sp => sp.life > 0);
  }

  private emitSparkles(cx: number, cy: number, color: string, count = 10): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = Math.random() * 3 + 1.5;
      this.sparkles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: Math.random() * 0.6 + 0.3,
        maxLife: 0.9,
        color,
      });
    }
  }

  private async onAnimationEnd(): Promise<void> {
    if (this.recorder?.state === 'recording') this.recorder.stop();
    await Promise.race([
      this.recorderStoppedPromise,
      new Promise<void>((r) => setTimeout(r, 8000)),
    ]);
    await new Promise<void>((r) => setTimeout(r, 120));
    this.phase.set('done');
  }

  // ── Scene dispatcher ────────────────────────────────────────────────────────

  private drawFrame(t: number): void {
    this.ctx.clearRect(0, 0, W, H);

    if (t < 6) {
      this.drawIntro(t);
    } else if (t < 10) {
      this.drawStatsScene(t);
    } else if (t < 15) {
      this.drawCountriesScene(t);
    } else if (t < 19) {
      this.drawAchievementsScene(t);
    } else {
      this.drawOutro(t);
    }

    this.drawStarsLayer();
    this.drawSparklesLayer();
  }

  // ── Stars + sparkles layers (drawn on top of every scene) ───────────────────

  private drawStarsLayer(): void {
    const ctx = this.ctx;
    for (const s of this.stars) {
      ctx.save();
      ctx.globalAlpha = s.a;
      ctx.fillStyle = ACCENT;
      ctx.shadowColor = ACCENT;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawSparklesLayer(): void {
    const ctx = this.ctx;
    for (const sp of this.sparkles) {
      const frac = sp.life / sp.maxLife;
      ctx.save();
      ctx.globalAlpha = frac * 0.9;
      ctx.fillStyle = sp.color;
      ctx.shadowColor = sp.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 3 * frac, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Scene entry fade overlay ────────────────────────────────────────────────

  private drawSceneEntry(tl: number, durationS = 0.45): void {
    const fade = 1 - this.easeOut(this.norm(tl, 0, durationS));
    if (fade <= 0) return;
    this.ctx.save();
    this.ctx.globalAlpha = fade * 0.75;
    this.ctx.fillStyle = BG;
    this.ctx.fillRect(0, 0, W, H);
    this.ctx.restore();
  }

  // ── Watermark (used on every scene) ─────────────────────────────────────────

  private drawWatermark(alpha = 0.28): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = ACCENT;
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✈  HopaHopa', W / 2, H - 22);
    ctx.restore();
  }

  // ── Scene 1: Intro (0 – 3 s) ────────────────────────────────────────────────

  // ── Scene 1: Spinning Globe Intro (0 – 6 s) ─────────────────────────────────

  private drawIntro(t: number): void {
    const ctx = this.ctx;
    const map  = this.mapInstance();
    const cx   = W / 2;

    if (map) {
      // ── Use the live Mapbox globe ─────────────────────────────────────────
      // Longitudinal spin: animate center longitude (Earth-like rotation on its axis).
      // Bearing stays fixed — we are not yawing the camera.
      const degPerSec = 22;
      const lng = this.wrapLongitude(this.initialCenterLng + t * degPerSec);
      map.setZoom(this.reelIntroZoom);
      map.setBearing(this.initialBearing);
      map.setCenter({ lng, lat: this.initialCenterLat });

      const mapCanvas = map.getCanvas();
      if (mapCanvas.width > 0 && mapCanvas.height > 0) {
        // Match the map view: letterbox, then scale like contain + modest zoom so framing matches the in-app globe.
        this.fillBg(ctx);
        const mw = mapCanvas.width;
        const mh = mapCanvas.height;
        const fit = Math.min(W / mw, H / mh) * 1.35;
        const dw = mw * fit;
        const dh = mh * fit;
        const dx = (W - dw) / 2;
        const dy = (H - dh) / 2;
        ctx.drawImage(mapCanvas, 0, 0, mw, mh, dx, dy, dw, dh);
      } else {
        this.fillBg(ctx);
      }

      // Top vignette (keeps text readable)
      const topV = ctx.createLinearGradient(0, 0, 0, H * 0.28);
      topV.addColorStop(0, 'rgba(0,0,0,0.55)');
      topV.addColorStop(1, 'transparent');
      ctx.fillStyle = topV;
      ctx.fillRect(0, 0, W, H);

      // Bottom vignette (text area)
      const botV = ctx.createLinearGradient(0, H * 0.6, 0, H);
      botV.addColorStop(0, 'transparent');
      botV.addColorStop(1, 'rgba(0,0,0,0.88)');
      ctx.fillStyle = botV;
      ctx.fillRect(0, 0, W, H);

    } else {
      // ── Fallback: procedural globe (no map available) ─────────────────────
      this.fillBg(ctx);
      const cy   = 360;
      const R    = 230;
      const spin = t * 0.42;

      const atm = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R * 1.42);
      atm.addColorStop(0, 'rgba(78,205,196,0.22)');
      atm.addColorStop(0.45, 'rgba(45,160,200,0.08)');
      atm.addColorStop(1, 'transparent');
      ctx.fillStyle = atm;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.42, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      const ocean = ctx.createRadialGradient(cx - R * 0.28, cy - R * 0.28, 0, cx, cy, R);
      ocean.addColorStop(0,   '#1e4a6e');
      ocean.addColorStop(0.4, '#0f2d4a');
      ocean.addColorStop(0.8, '#081a2e');
      ocean.addColorStop(1,   '#030d1a');
      ctx.fillStyle = ocean;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      for (const lat of [-60, -30, 0, 30, 60]) {
        const latRad = (lat * Math.PI) / 180;
        const lineY  = cy + R * Math.sin(latRad);
        const lineRx = R * Math.cos(latRad);
        const lineRy = Math.max(lineRx * 0.12, 1.5);
        ctx.strokeStyle = lat === 0 ? 'rgba(78,205,196,0.55)' : 'rgba(78,205,196,0.2)';
        ctx.lineWidth   = lat === 0 ? 1.4 : 0.7;
        ctx.beginPath();
        ctx.ellipse(cx, lineY, lineRx, lineRy, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const angle  = (i / 12) * Math.PI * 2 + spin;
        const cosA   = Math.cos(angle);
        const lineRx = Math.abs(cosA) * R;
        ctx.strokeStyle = cosA >= 0 ? 'rgba(78,205,196,0.2)' : 'rgba(78,205,196,0.045)';
        ctx.lineWidth   = cosA >= 0 ? 0.8 : 0.4;
        ctx.beginPath();
        ctx.ellipse(cx, cy, lineRx, R, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (const code of this.visitedList) {
        const c = CENTROIDS[code];
        if (!c) continue;
        const latR = (c[0] * Math.PI) / 180;
        const lngR = (c[1] * Math.PI) / 180;
        const relL = lngR - spin;
        if (Math.cos(latR) * Math.cos(relL) <= 0) continue;
        const dotX = cx + R * Math.cos(latR) * Math.sin(relL);
        const dotY = cy - R * Math.sin(latR);
        const depth = Math.cos(latR) * Math.cos(relL);
        ctx.fillStyle = ACCENT;
        ctx.shadowColor = ACCENT;
        ctx.shadowBlur = 8 * depth;
        ctx.globalAlpha = 0.55 + depth * 0.45;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3.5 * depth + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
      const spec = ctx.createRadialGradient(
        cx - R * 0.38, cy - R * 0.38, 0, cx - R * 0.38, cy - R * 0.38, R * 0.55);
      spec.addColorStop(0, 'rgba(255,255,255,0.14)');
      spec.addColorStop(1, 'transparent');
      ctx.fillStyle = spec;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(78,205,196,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // ── Text overlay (shared by both paths) ──────────────────────────────────
    const textY = H * 0.78;

    const nameP = this.easeOut(this.norm(t, 2.0, 3.2));
    if (nameP > 0) {
      ctx.save();
      ctx.globalAlpha = nameP;
      ctx.translate(0, (1 - nameP) * 18);
      const ng = ctx.createLinearGradient(cx - 165, 0, cx + 165, 0);
      ng.addColorStop(0, ACCENT);
      ng.addColorStop(0.5, '#7ee8e0');
      ng.addColorStop(1, SECONDARY);
      ctx.fillStyle = ng;
      ctx.font = `bold 56px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = ACCENT;
      ctx.shadowBlur = 22;
      ctx.fillText('HopaHopa', cx, textY);
      ctx.restore();
    }

    const tagP = this.easeOut(this.norm(t, 2.8, 3.8));
    if (tagP > 0) {
      ctx.save();
      ctx.globalAlpha = tagP * 0.75;
      ctx.translate(0, (1 - tagP) * 10);
      ctx.fillStyle = MUTED;
      ctx.font = `20px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Track your travels around the world', cx, textY + 52);
      ctx.restore();
    }

    const yearP = this.easeOut(this.norm(t, 3.5, 4.3));
    if (yearP > 0) {
      const badgeY = textY + 104;
      ctx.save();
      ctx.globalAlpha = yearP * 0.65;
      this.roundRect(ctx, cx - 40, badgeY - 14, 80, 28, 14);
      ctx.fillStyle = ACCENT + '22';
      ctx.fill();
      ctx.strokeStyle = ACCENT + '55';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = ACCENT;
      ctx.font = `bold 13px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(new Date().getFullYear().toString(), cx, badgeY);
      ctx.restore();
    }

    this.drawWatermark(0.18);
  }

  // ── Scene 3: Countries Explored (10 – 15 s) — flag cascade ──────────────────

  private drawCountriesScene(t: number): void {
    const ctx = this.ctx;
    this.fillBg(ctx);

    const tl = t - 10; // 0..5
    this.drawSceneEntry(tl, 0.5);

    // Background dot-grid texture
    ctx.save();
    ctx.fillStyle = 'rgba(78,205,196,0.035)';
    for (let gx = 18; gx < W; gx += 36) {
      for (let gy = 18; gy < H; gy += 36) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Radial glow behind counter
    const bgGlow = ctx.createRadialGradient(W / 2, 200, 0, W / 2, 200, 260);
    bgGlow.addColorStop(0, ACCENT + '18');
    bgGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, W, H);

    // ── Title ────────────────────────────────────────────────────────────────
    const titleP = this.easeOut(this.norm(tl, 0, 0.7));
    ctx.save();
    ctx.globalAlpha = titleP;
    ctx.translate(0, (1 - titleP) * 10);
    const tg = ctx.createLinearGradient(80, 0, W - 80, 0);
    tg.addColorStop(0, ACCENT);
    tg.addColorStop(1, SECONDARY);
    ctx.fillStyle = tg;
    ctx.font = `bold 30px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 16;
    ctx.fillText('Countries Explored', W / 2, 90);
    ctx.restore();

    // ── Large animated counter ────────────────────────────────────────────────
    const counterP = this.easeOut(this.norm(tl, 0.2, 0.9));
    const counterVal = Math.round(this.visitedCount * this.easeOut(this.norm(tl, 0.2, 1.1)));
    ctx.save();
    ctx.globalAlpha = counterP;
    const cg = ctx.createLinearGradient(W / 2 - 110, 0, W / 2 + 110, 0);
    cg.addColorStop(0, ACCENT);
    cg.addColorStop(1, SECONDARY);
    ctx.fillStyle = cg;
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 32;
    ctx.font = `bold 96px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(counterVal), W / 2, 190);
    ctx.shadowBlur = 0;
    ctx.fillStyle = MUTED;
    ctx.font = `19px ${FONT}`;
    ctx.fillText(
      `of 195 countries  ·  ${Math.round((this.visitedCount / 195) * 100)}% of the world`,
      W / 2, 250,
    );
    ctx.restore();

    // ── Thin progress bar ────────────────────────────────────────────────────
    const barReveal = this.easeOut(this.norm(tl, 0.5, 1.3));
    if (barReveal > 0) {
      const barX = 40, barY = 278, barW = W - 80, barH = 4;
      ctx.save();
      ctx.globalAlpha = barReveal;
      // Track
      this.roundRect(ctx, barX, barY, barW, barH, 2);
      ctx.fillStyle = '#1e2035';
      ctx.fill();
      // Fill
      const fillFrac = (this.visitedCount / 195) * this.easeOut(this.norm(tl, 0.45, 1.25));
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      barGrad.addColorStop(0, ACCENT);
      barGrad.addColorStop(1, SECONDARY);
      ctx.fillStyle = barGrad;
      ctx.shadowColor = ACCENT;
      ctx.shadowBlur = 8;
      this.roundRect(ctx, barX, barY, Math.max(4, barW * fillFrac), barH, 2);
      ctx.fill();
      ctx.restore();
    }

    // ── Flag grid ────────────────────────────────────────────────────────────
    const COLS = 5;
    const CELL_W = (W - 40) / COLS; // 100 px
    const CELL_H = 108;             // taller to fit flag + name
    const GRID_TOP = 304;
    const MAX_FLAGS = 25;           // 5 × 5 clean grid
    const shown = Math.min(this.visitedList.length, MAX_FLAGS);

    for (let i = 0; i < shown; i++) {
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      const delay = 0.45 + i * 0.038;
      const p = this.easeOut(this.norm(tl, delay, delay + 0.22));
      if (p <= 0) continue;

      const cx = 20 + col * CELL_W + CELL_W / 2;
      const cy = GRID_TOP + row * CELL_H + CELL_H / 2;
      const scale = 0.25 + p * 0.75;

      ctx.save();
      ctx.globalAlpha = p;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      // Card background
      const cardH = CELL_H - 8;
      const cardW = CELL_W - 8;
      this.roundRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 12);
      ctx.fillStyle = '#1a1b2e';
      ctx.fill();
      ctx.strokeStyle = p > 0.5 ? ACCENT + '40' : 'transparent';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Emit sparkles as flag pops in (only once near p≈0.5)
      if (p > 0.45 && p < 0.55) {
        this.emitSparkles(cx, cy, ACCENT, 5);
      }

      // Flag image sits in the upper portion of the card
      const flagImg = this.flagImages.get(this.visitedList[i]);
      const flagY = -18; // shift flag up to leave room for name below
      if (flagImg && flagImg.naturalWidth > 0) {
        const fw = 62;
        const fh = Math.round(fw * flagImg.naturalHeight / flagImg.naturalWidth);
        ctx.save();
        this.roundRect(ctx, -fw / 2, flagY - fh / 2, fw, fh, 5);
        ctx.clip();
        ctx.drawImage(flagImg, -fw / 2, flagY - fh / 2, fw, fh);
        ctx.restore();
      } else {
        ctx.fillStyle = ACCENT;
        ctx.font = `bold 20px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.visitedList[i], 0, flagY);
      }

      // Country name label below the flag
      const rawName = this.visitedNames.get(this.visitedList[i]) ?? this.visitedList[i];
      const maxNameW = cardW - 10;
      ctx.font = `11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Truncate to fit
      let label = rawName;
      while (label.length > 2 && ctx.measureText(label).width > maxNameW) {
        label = label.slice(0, -1);
      }
      if (label !== rawName) label = label.trimEnd() + '…';
      ctx.fillStyle = 'rgba(200,210,230,0.82)';
      ctx.fillText(label, 0, cardH / 2 - 11);

      ctx.restore();
    }

    // "+X more" badge if user visited > MAX_FLAGS countries
    const remaining = this.visitedList.length - MAX_FLAGS;
    if (remaining > 0) {
      const lastRow = Math.floor((shown - 1) / COLS);
      const badgeY = GRID_TOP + (lastRow + 1) * CELL_H + 34;
      const moreDelay = 0.45 + shown * 0.038 + 0.12;
      const moreP = this.easeOut(this.norm(tl, moreDelay, moreDelay + 0.35));
      ctx.save();
      ctx.globalAlpha = moreP;
      this.roundRect(ctx, 40, badgeY - 22, W - 80, 44, 22);
      const mg = ctx.createLinearGradient(40, 0, W - 40, 0);
      mg.addColorStop(0, ACCENT + '28');
      mg.addColorStop(1, SECONDARY + '28');
      ctx.fillStyle = mg;
      ctx.fill();
      ctx.strokeStyle = ACCENT + '55';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = ACCENT;
      ctx.font = `bold 18px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+ ${remaining} more countries`, W / 2, badgeY);
      ctx.restore();
    }

    this.drawWatermark();
  }


  // ── Scene 2: Stats / Your Progress (6 – 10 s) — circular arc gauges ─────────

  private drawStatsScene(t: number): void {
    const ctx = this.ctx;
    this.fillBg(ctx);

    // Radial bg glow
    const glow = ctx.createRadialGradient(W / 2, H * 0.44, 0, W / 2, H * 0.44, 400);
    glow.addColorStop(0, SECONDARY + '1a');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const tl = t - 6; // 0..4
    this.drawSceneEntry(tl, 0.4);

    // Title
    const titleP = this.easeOut(this.norm(tl, 0, 0.6));
    ctx.save();
    ctx.globalAlpha = titleP;
    const tg = ctx.createLinearGradient(80, 0, W - 80, 0);
    tg.addColorStop(0, ACCENT);
    tg.addColorStop(1, SECONDARY);
    ctx.fillStyle = tg;
    ctx.font = `bold 36px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 16;
    ctx.fillText('Your Progress', W / 2, 110);
    ctx.restore();

    // Large center gauge — countries / 195
    const mainP = this.easeOut(this.norm(tl, 0.3, 1.0));
    const mainArc = this.easeOut(this.norm(tl, 0.5, 2.0));
    this.drawGauge(ctx, W / 2, 370, 118, this.visitedCount, 195,
      mainArc, mainP, '🌍', `${this.visitedCount}`, 'of 195 countries',
      [ACCENT, SECONDARY], 14);

    // Bottom two gauges
    const leftP = this.easeOut(this.norm(tl, 1.0, 1.6));
    const leftArc = this.easeOut(this.norm(tl, 1.2, 2.8));
    const worldPct = Math.round((this.visitedCount / 195) * 100);
    this.drawGauge(ctx, 152, 650, 82, worldPct, 100,
      leftArc, leftP, '🗺', `${worldPct}%`, 'of the World',
      ['#f7b733', '#fc4a1a'], 10);

    const rightP = this.easeOut(this.norm(tl, 1.5, 2.1));
    const rightArc = this.easeOut(this.norm(tl, 1.7, 3.2));
    this.drawGauge(ctx, W - 152, 650, 82, this.achievementsCount, Math.max(this.totalAchievementsCount, 1),
      rightArc, rightP, '🏆', `${this.achievementsCount}`, 'achievements',
      ['#a855f7', '#6366f1'], 10);

    this.drawWatermark();
  }

  private drawGauge(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, r: number,
    value: number, max: number,
    arcProgress: number, alpha: number,
    icon: string, label: string, sublabel: string,
    gradColors: [string, string],
    lineWidth: number,
  ): void {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    const startA = -Math.PI / 2;
    const endA = startA + 2 * Math.PI * Math.min(value / max, 1) * arcProgress;

    // Track arc (bg)
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#1e2035';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Coloured arc
    if (arcProgress > 0.01) {
      const arcGrad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
      arcGrad.addColorStop(0, gradColors[0]);
      arcGrad.addColorStop(1, gradColors[1]);
      ctx.beginPath();
      ctx.arc(cx, cy, r, startA, endA);
      ctx.strokeStyle = arcGrad;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.shadowColor = gradColors[0];
      ctx.shadowBlur = 12;
      ctx.stroke();
    }

    // Dot at arc tip
    if (arcProgress > 0.02) {
      const tipX = cx + Math.cos(endA) * r;
      const tipY = cy + Math.sin(endA) * r;
      ctx.beginPath();
      ctx.arc(tipX, tipY, lineWidth / 2 + 1, 0, Math.PI * 2);
      ctx.fillStyle = gradColors[1];
      ctx.shadowColor = gradColors[1];
      ctx.shadowBlur = 10;
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    // Icon
    ctx.font = `${Math.round(r * 0.42)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, cx, cy - r * 0.22);

    // Main label (gradient)
    const lg = ctx.createLinearGradient(cx - r * 0.7, 0, cx + r * 0.7, 0);
    lg.addColorStop(0, gradColors[0]);
    lg.addColorStop(1, gradColors[1]);
    ctx.fillStyle = lg;
    ctx.font = `bold ${Math.round(r * 0.38)}px ${FONT}`;
    ctx.fillText(label, cx, cy + r * 0.22);

    // Sublabel
    ctx.fillStyle = MUTED;
    ctx.font = `${Math.round(r * 0.17)}px ${FONT}`;
    ctx.fillText(sublabel, cx, cy + r * 0.52);

    ctx.restore();
  }

  // ── Scene 4: Achievements (15 – 19 s) ───────────────────────────────────────

  private drawAchievementsScene(t: number): void {
    const ctx = this.ctx;
    this.fillBg(ctx);

    const tl = t - 15; // 0..4
    this.drawSceneEntry(tl, 0.4);

    // Background glow
    const glow = ctx.createRadialGradient(W / 2, H * 0.46, 0, W / 2, H * 0.46, 380);
    glow.addColorStop(0, '#a855f725');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Title
    const titleP = this.easeOut(this.norm(tl, 0, 0.6));
    ctx.save();
    ctx.globalAlpha = titleP;
    ctx.font = '44px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆', W / 2, 82);
    const tg = ctx.createLinearGradient(80, 0, W - 80, 0);
    tg.addColorStop(0, '#a855f7');
    tg.addColorStop(1, '#6366f1');
    ctx.fillStyle = tg;
    ctx.font = `bold 34px ${FONT}`;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 16;
    ctx.fillText('Achievements', W / 2, 138);
    ctx.shadowBlur = 0;
    ctx.fillStyle = MUTED;
    ctx.font = `19px ${FONT}`;
    ctx.fillText(
      this.achievementsCount > 0
        ? `${this.achievementsCount} / ${this.totalAchievementsCount} unlocked`
        : 'Keep exploring to unlock!',
      W / 2, 178,
    );
    ctx.restore();

    if (this.unlockedAchievements.length === 0) {
      const seedP = this.easeOut(this.norm(tl, 0.5, 1.3));
      ctx.save();
      ctx.globalAlpha = seedP;
      ctx.font = '72px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌱', W / 2, H / 2);
      ctx.restore();
      this.drawWatermark();
      return;
    }

    const COLS = 3;
    const CELL_W = (W - 40) / COLS;
    const CELL_H = 138;
    const GRID_TOP = 208;

    this.unlockedAchievements.forEach((ach, idx) => {
      const row = Math.floor(idx / COLS);
      const col = idx % COLS;
      const delay = 0.22 + idx * 0.1;
      const p = this.easeOut(this.norm(tl, delay, delay + 0.45));
      if (p <= 0) return;

      const cx = 20 + col * CELL_W + CELL_W / 2;
      const cy = GRID_TOP + row * CELL_H + CELL_H / 2;
      const color = ach.color || ACCENT;

      // Emit sparkles once when card pops in
      if (p > 0.5 && p < 0.55) {
        this.emitSparkles(cx, cy - 10, color, 8);
      }

      // Scale + slight rotation pop
      const scale = 0.4 + p * 0.6;
      const rot = (1 - p) * 0.25;

      ctx.save();
      ctx.globalAlpha = p;
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.scale(scale, scale);

      // Outer glow halo
      const haloGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 62);
      haloGrad.addColorStop(0, color + '40');
      haloGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = haloGrad;
      ctx.fillRect(-62, -62, 124, 124);

      // Card
      this.roundRect(ctx, -52, -52, 104, 104, 18);
      ctx.fillStyle = CARD;
      ctx.fill();
      // Gradient border
      const borderGrad = ctx.createLinearGradient(-52, -52, 52, 52);
      borderGrad.addColorStop(0, color + '90');
      borderGrad.addColorStop(1, color + '30');
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Icon
      ctx.font = '40px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ach.icon, 0, -8);

      // Title
      ctx.font = `bold 11px ${FONT}`;
      ctx.fillStyle = TEXT;
      const short = ach.title.length > 13 ? ach.title.slice(0, 12) + '…' : ach.title;
      ctx.fillText(short, 0, 36);

      ctx.restore();
    });

    this.drawWatermark();
  }

  // ── Scene 5: Outro (19 – 21 s) ──────────────────────────────────────────────

  private drawOutro(t: number): void {
    const ctx = this.ctx;
    this.fillBg(ctx);

    const tl = t - 19; // 0..2

    // Expanding rings burst at start
    for (let i = 0; i < 3; i++) {
      const phase = this.norm(tl, i * 0.12, i * 0.12 + 1.5);
      if (phase <= 0) continue;
      const r = phase * 280;
      const a = (1 - phase) * 0.25;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 2;
      ctx.shadowColor = ACCENT;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Deep glow
    const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 300);
    glow.addColorStop(0, ACCENT + '2e');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const fadeOut = 1 - this.easeOut(this.norm(tl, 1.35, 2));
    const p = this.easeOut(this.norm(tl, 0, 0.75)) * fadeOut;

    ctx.save();
    ctx.globalAlpha = p;
    ctx.translate(0, (1 - p) * 20);

    // Plane with glow
    ctx.font = '80px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 30;
    ctx.fillText('✈', W / 2, H / 2 - 100);
    ctx.shadowBlur = 0;

    // Headline gradient
    const hg = ctx.createLinearGradient(60, 0, W - 60, 0);
    hg.addColorStop(0, ACCENT);
    hg.addColorStop(0.5, '#7ee8e0');
    hg.addColorStop(1, SECONDARY);
    ctx.fillStyle = hg;
    ctx.font = `bold 50px ${FONT}`;
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 20;
    ctx.fillText('Keep Exploring!', W / 2, H / 2 + 10);
    ctx.shadowBlur = 0;

    // App name
    ctx.fillStyle = MUTED;
    ctx.font = `24px ${FONT}`;
    ctx.fillText('HopaHopa', W / 2, H / 2 + 85);

    // Tagline
    ctx.fillStyle = DIM;
    ctx.font = `16px ${FONT}`;
    ctx.fillText('Track your travels around the world', W / 2, H / 2 + 124);

    ctx.restore();
  }

  // ── Rendering helpers ───────────────────────────────────────────────────────

  private fillBg(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
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

  /** Keep longitude in [-180, 180] for Mapbox setCenter. */
  private wrapLongitude(lng: number): number {
    let x = lng;
    while (x > 180) x -= 360;
    while (x < -180) x += 360;
    return x;
  }

  // ── Easing ──────────────────────────────────────────────────────────────────

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private norm(t: number, start: number, end: number): number {
    return Math.max(0, Math.min(1, (t - start) / (end - start)));
  }

  // ── Share / Download ────────────────────────────────────────────────────────

  /** Used when canNativeShare() is true — native app or mobile web. */
  async share(): Promise<void> {
    if (!this.videoBlob || this.sharing()) return;
    this.shareError.set(null);
    this.sharing.set(true);
    try {
      const ext = this.fileExtensionForBlob(this.videoBlob);
      const fileName = `hopahopa-travel-reel-${Date.now()}.${ext}`;
      if (Capacitor.isNativePlatform()) {
        await this.nativeShare(fileName);
      } else {
        await this.mobileWebShare(fileName);
      }
    } finally {
      this.sharing.set(false);
    }
  }

  /** Used on desktop browsers where Web Share API with files is unavailable. */
  async saveToDevice(): Promise<void> {
    if (!this.videoBlob || this.sharing()) return;
    this.sharing.set(true);
    try {
      this.triggerDownload();
      this.downloadStatus.set('✓ Saved to Downloads!');
    } finally {
      this.sharing.set(false);
    }
  }

  private fileExtensionForBlob(blob: Blob): string {
    const t = blob.type.toLowerCase();
    if (t.includes('mp4') || t.includes('mpeg4') || t.includes('avc1')) return 'mp4';
    if (t.includes('webm')) return 'webm';
    if (t.includes('quicktime')) return 'mov';
    return 'mp4';
  }

  private async nativeShare(fileName: string): Promise<void> {
    if (!this.videoBlob) return;
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const base64 = await this.blobToBase64(this.videoBlob);

    let fileUri: string;
    let cleanupPath = fileName;
    let cleanupDir = Directory.Cache;

    try {
      const extPath = `HopaHopa/${fileName}`;
      const writeResult = await Filesystem.writeFile({
        path: extPath,
        data: base64,
        directory: Directory.External,
        recursive: true,
      });
      fileUri = writeResult.uri;
      cleanupPath = extPath;
      cleanupDir = Directory.External;
    } catch (err) {
      try {
        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
        });
        fileUri = writeResult.uri;
        cleanupPath = fileName;
        cleanupDir = Directory.Cache;
      } catch (err2) {
        console.error('[TravelReel] writeFile failed', err, err2);
        this.shareError.set('Could not save the video to app storage. Try freeing space or try again.');
        return;
      }
    }

    const scheduleCleanup = (): void => {
      window.setTimeout(() => {
        void Filesystem.deleteFile({ path: cleanupPath, directory: cleanupDir }).catch(() => {});
      }, 120_000);
    };

    const isUserCancelled = (err: unknown): boolean => {
      const msg = err instanceof Error ? err.message : String(err);
      return /cancel|canceled|abort/i.test(msg);
    };

    try {
      // Android Share only accepts file:// URLs; use `url` for a single file (Capacitor docs).
      await Share.share({
        title: 'My HopaHopa Travel Reel',
        dialogTitle: 'Share or save video',
        url: fileUri,
      });
      scheduleCleanup();
    } catch (e: unknown) {
      if (isUserCancelled(e)) {
        scheduleCleanup();
        return;
      }
      try {
        await Share.share({
          title: 'My HopaHopa Travel Reel',
          dialogTitle: 'Share or save video',
          files: [fileUri],
        });
        scheduleCleanup();
      } catch (e2: unknown) {
        if (isUserCancelled(e2)) {
          scheduleCleanup();
          return;
        }
        console.error('[TravelReel] Share failed', e, e2);
        scheduleCleanup();
        this.shareError.set(
          'Could not open the share sheet. From Share, choose Photos, Drive, or Files to save the video.'
        );
      }
    }
  }

  private async mobileWebShare(fileName: string): Promise<void> {
    if (!this.videoBlob) return;
    const file = new File([this.videoBlob], fileName, { type: this.videoBlob.type });
    try {
      await navigator.share({ files: [file], title: 'My HopaHopa Travel Reel' });
    } catch (e) {
      // User cancelled or share failed
      if ((e as DOMException).name !== 'AbortError') {
        this.triggerDownload();
      }
    }
  }

  private triggerDownload(): void {
    if (!this.videoBlob) return;
    const ext = this.fileExtensionForBlob(this.videoBlob);
    const url = URL.createObjectURL(this.videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hopahopa-travel-reel.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  dismiss(): void {
    this.closed.emit();
  }
}
