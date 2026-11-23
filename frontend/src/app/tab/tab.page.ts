import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  leafOutline,
  bookmarkOutline,
  restaurantOutline,
  chevronForwardOutline,
  homeOutline,
  imagesOutline,
  compassOutline,
  calendarOutline,
  timeOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.page.html',
  styleUrls: ['./tab.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabPage {
  constructor() {
    addIcons({
      leafOutline,
      bookmarkOutline,
      timeOutline,
      homeOutline,
      imagesOutline,
      calendarOutline,
      restaurantOutline,
      chevronForwardOutline,
      compassOutline,
    });
  }
}
