import { Component} from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  leafOutline,
  bookmarkOutline,
  restaurantOutline,
  chevronForwardOutline,
  homeOutline,
  compassOutline,
  calendarOutline,
  timeOutline,
  receiptOutline} from 'ionicons/icons';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.page.html',
  styleUrls: ['./tab.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonContent, IonHeader, IonTitle, IonToolbar, RouterLink ],
})
export class TabPage {
  constructor() {
    addIcons({receiptOutline, leafOutline,bookmarkOutline,timeOutline,homeOutline,calendarOutline,restaurantOutline,chevronForwardOutline,compassOutline});
  }
  }

