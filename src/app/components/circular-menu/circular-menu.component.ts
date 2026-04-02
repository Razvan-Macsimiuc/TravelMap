import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  closeCircle,
  informationCircleOutline,
} from 'ionicons/icons';

export interface CircularMenuItem {
  id: string;
  icon: string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-circular-menu',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    @if (show()) {
      <div class="circular-menu-overlay" (click)="close()">
        <div
          class="circular-menu"
          [style.left.px]="position().x"
          [style.top.px]="position().y"
          (click)="$event.stopPropagation()"
        >
          <!-- Center touch point -->
          <div class="menu-center"></div>

          <!-- Menu items radiating outward -->
          @for (item of menuItems; track item.id; let i = $index) {
            <button
              class="menu-item"
              [class.visible]="visible()"
              [style.--item-index]="i"
              [style.--item-count]="menuItems.length"
              (click)="onItemClick(item.id)"
            >
              <div class="item-icon" [style.background]="item.color">
                <ion-icon [name]="item.icon"></ion-icon>
              </div>
              <span class="item-label">{{ item.label }}</span>
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .circular-menu-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 1500;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .circular-menu {
      position: fixed;
      transform: translate(-50%, -50%);
    }

    .menu-center {
      position: absolute;
      top: 0;
      left: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      box-shadow: 0 0 20px var(--ion-color-primary);
      transform: translate(-10px, -10px);
      animation: centerPulse 1.5s ease-in-out infinite;
    }

    @keyframes centerPulse {
      0%, 100% { transform: translate(-10px, -10px) scale(1); opacity: 1; }
      50% { transform: translate(-10px, -10px) scale(1.2); opacity: 0.8; }
    }

    .menu-item {
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
      
      // Calculate position in a circle
      --angle: calc((360deg / var(--item-count)) * var(--item-index) - 90deg);
      --radius: 80px;
      
      transform: translate(
        calc(cos(var(--angle)) * 0px - 32px),
        calc(sin(var(--angle)) * 0px - 32px)
      );
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

      &.visible {
        transform: translate(
          calc(cos(var(--angle)) * var(--radius) - 32px),
          calc(sin(var(--angle)) * var(--radius) - 32px)
        );
        opacity: 1;
        transition-delay: calc(0.05s * var(--item-index));
      }

      &:active {
        .item-icon {
          transform: scale(0.9);
        }
      }
    }

    .item-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-lg);
      border: 2px solid rgba(255, 255, 255, 0.3);
      transition: transform 0.2s ease;

      ion-icon {
        font-size: 28px;
        color: #fff;
      }

      &:hover {
        transform: scale(1.1);
      }
    }

    .item-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--ion-text-color);
      background: var(--glass-bg);
      padding: 4px 8px;
      border-radius: 8px;
      white-space: nowrap;
      box-shadow: var(--shadow-sm);
      border: 1px solid rgba(78, 205, 196, 0.2);
    }
  `],
})
export class CircularMenuComponent implements OnInit {
  @Input() position: { x: number; y: number } = { x: 0, y: 0 };
  @Input() isVisited: boolean = false;
  @Output() menuItemSelected = new EventEmitter<string>();

  readonly show = signal(false);
  readonly visible = signal(false);

  menuItems: CircularMenuItem[] = [];

  constructor() {
    addIcons({
      checkmarkCircle,
      closeCircle,
      informationCircleOutline,
    });
  }

  ngOnInit(): void {
    // Build menu items based on visited status
    this.menuItems = this.isVisited
      ? [
          {
            id: 'unvisit',
            icon: 'close-circle',
            label: 'Unmark',
            color: '#FF6B6B',
          },
          {
            id: 'details',
            icon: 'information-circle-outline',
            label: 'Details',
            color: '#FFE66D',
          },
        ]
      : [
          {
            id: 'visit',
            icon: 'checkmark-circle',
            label: 'Mark Visited',
            color: '#95E1D3',
          },
          {
            id: 'details',
            icon: 'information-circle-outline',
            label: 'Details',
            color: '#FFE66D',
          },
        ];

    // Show menu with animation
    this.show.set(true);
    setTimeout(() => {
      this.visible.set(true);
    }, 50);
  }

  onItemClick(itemId: string): void {
    this.menuItemSelected.emit(itemId);
    this.close();
  }

  close(): void {
    this.visible.set(false);
    setTimeout(() => {
      this.show.set(false);
    }, 400);
  }
}




