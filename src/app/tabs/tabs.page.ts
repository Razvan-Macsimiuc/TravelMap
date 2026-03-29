import { Component } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  globe,
  globeOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  cog,
  cogOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  constructor() {
    addIcons({
      globe,
      globeOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      cog,
      cogOutline,
    });
  }
}
