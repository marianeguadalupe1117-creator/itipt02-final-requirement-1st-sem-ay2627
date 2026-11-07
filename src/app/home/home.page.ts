
import { Component, signal } from '@angular/core';

import {
  IonContent,
  IonCard,
  IonCardContent,
  IonImg,
  IonIcon,
  IonText,
  IonButton,
  IonFooter,
  IonToolbar,
  IonTabBar,
  IonTabButton,
  IonLabel
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  leafOutline,
  bookmarkOutline,
  restaurantOutline,
  chevronForwardOutline,
  homeOutline,
  compassOutline,
  calendarOutline
} from 'ionicons/icons';

interface Category {
  id: number;
  name: string;
  image: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonCard,
    IonCardContent,
    IonImg,
    IonIcon,
    IonText,
    IonButton,
    IonFooter,
    IonToolbar,
    IonTabBar,
    IonTabButton,
    IonLabel
  ]
})
export class HomePage {

  categories = signal<Category[]>([
    { id: 1, name: 'Main Dishes', image: '' },
    { id: 2, name: 'Soup', image: '' },
    { id: 3, name: 'Noodles', image: '' },
    { id: 4, name: 'Rice', image: '' },
    { id: 5, name: 'Fried', image: '' },
    { id: 6, name: 'Roasted/Grilled', image: '' }
  ]);

  constructor() {
    addIcons({
      leafOutline,
      bookmarkOutline,
      restaurantOutline,
      chevronForwardOutline,
      homeOutline,
      compassOutline,
      calendarOutline
    });
  }
}
