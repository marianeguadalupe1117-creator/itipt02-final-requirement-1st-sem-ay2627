import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonText, IonIcon, IonButton, IonHeader, IonToolbar, IonTitle, IonContent, IonTab, } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  leafOutline,
  bookmarkOutline,
  restaurantOutline,
  chevronForwardOutline,
  homeOutline,
  compassOutline,
  calendarOutline,
   timeOutline } from 'ionicons/icons';

   
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [ IonText, IonIcon, IonButton, IonTab, IonHeader, IonToolbar, IonTitle, IonContent, RouterLink],
})
export class HomePage {
  constructor() {
     addIcons({leafOutline,bookmarkOutline,timeOutline,homeOutline,calendarOutline,restaurantOutline,chevronForwardOutline,compassOutline});
  }
}
