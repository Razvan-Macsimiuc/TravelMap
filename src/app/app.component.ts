import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { OverlayService } from './services/overlay.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly overlayService = inject(OverlayService);

  constructor() {
    // Initialize overlay service to close modals/menus on navigation
    this.overlayService.initialize();
  }
}
