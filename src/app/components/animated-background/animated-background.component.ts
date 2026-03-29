import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-animated-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="background-layer" [class.subtle]="subtle">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
      <div class="grid-overlay" *ngIf="showGrid"></div>
    </div>
  `,
  styles: [`
    .background-layer {
      position: fixed;
      inset: 0;
      overflow: hidden;
      z-index: 0;
      pointer-events: none;

      &.subtle .gradient-orb {
        opacity: 0.25;
      }
    }

    .gradient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.4;
      animation: orbFloat 20s ease-in-out infinite;

      &.orb-1 {
        width: 500px;
        height: 500px;
        background: #0ea5e9;
        top: -150px;
        left: -150px;
        animation-delay: 0s;
      }

      &.orb-2 {
        width: 400px;
        height: 400px;
        background: #ff6b6b;
        bottom: -100px;
        right: -100px;
        animation-delay: -7s;
      }

      &.orb-3 {
        width: 350px;
        height: 350px;
        background: #fbbf24;
        top: 40%;
        left: 60%;
        transform: translate(-50%, -50%);
        animation-delay: -14s;
      }
    }

    @keyframes orbFloat {
      0%, 100% {
        transform: translate(0, 0) scale(1);
      }
      25% {
        transform: translate(30px, -30px) scale(1.1);
      }
      50% {
        transform: translate(-20px, 20px) scale(0.95);
      }
      75% {
        transform: translate(20px, 30px) scale(1.05);
      }
    }

    .grid-overlay {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 50px 50px;
      opacity: 0.5;
    }
  `]
})
export class AnimatedBackgroundComponent {
  @Input() subtle = false;
  @Input() showGrid = true;
}



