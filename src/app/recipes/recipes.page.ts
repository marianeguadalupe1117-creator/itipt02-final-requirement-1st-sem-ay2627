import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButtons,
  IonBackButton, IonTitle } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  arrowBackOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.page.html',
  styleUrls: ['./recipes.page.scss'],
  imports: [IonTitle, 
    RouterLink,
    IonContent,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButtons,
    IonBackButton
  ]
})
export class RecipesPage {
  constructor() {
    addIcons({
      arrowForwardOutline,
      arrowBackOutline
    });
  }
}