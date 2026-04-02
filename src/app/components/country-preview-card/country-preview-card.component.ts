import { Component, Input, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Country } from '../../models/country.model';

@Component({
  selector: 'app-country-preview-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (show()) {
      <div class="preview-card" [class.visible]="visible()">
        <div class="preview-content">
          <div class="preview-header">
            @if (flagUrl()) {
              <img class="preview-flag" [src]="flagUrl()!" [alt]="country?.name" />
            }
            <div class="preview-info">
              <h3 class="preview-name">{{ country?.name }}</h3>
              <p class="preview-code">{{ country?.code }}</p>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 800;
      pointer-events: none;
    }

    .preview-card {
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border-radius: var(--radius-lg);
      border: 1px solid var(--glass-border);
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      width: 280px;

      transform: translateY(20px) scale(0.95);
      opacity: 0;
      filter: blur(10px);
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

      &.visible {
        transform: translateY(0) scale(1);
        opacity: 1;
        filter: blur(0px);
      }
    }

    .preview-content {
      padding: var(--space-4);
    }

    .preview-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .preview-flag {
      width: 40px;
      height: auto;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      flex-shrink: 0;
    }

    .preview-info {
      flex: 1;
      min-width: 0;
    }

    .preview-name {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--ion-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .preview-code {
      margin: 2px 0 0;
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      font-family: 'SF Mono', Monaco, monospace;
      letter-spacing: 0.5px;
    }
  `],
})
export class CountryPreviewCardComponent implements OnInit {
  @Input() country: Country | null = null;

  readonly show = signal(false);
  readonly visible = signal(false);

  readonly flagUrl = computed(() => {
    if (!this.country || this.country.code.length !== 2) return null;
    return `https://flagcdn.com/w40/${this.country.code.toLowerCase()}.png`;
  });

  ngOnInit(): void {
    if (this.country) {
      this.show.set(true);
      setTimeout(() => {
        this.visible.set(true);
      }, 50);
    }
  }

  hide(): void {
    this.visible.set(false);
    setTimeout(() => {
      this.show.set(false);
    }, 400);
  }
}
