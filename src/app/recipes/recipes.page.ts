import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonImg,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
  IonTabBar,
  IonTabButton
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  searchOutline,
  arrowForward,
  restaurantOutline,
  home,
  compassOutline,
  bookmarkOutline,
  calendarOutline
} from 'ionicons/icons';

interface Recipe {
  recipe_id: number;
  recipe_name: string;
}

@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.page.html',
  styleUrls: ['./recipes.page.scss'],
  imports: [
    
    IonContent, IonContent,
    IonImg,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonText,
    IonTabBar,
    IonTabButton, 
    CommonModule, 
    FormsModule],
})
export class RecipesPage implements OnInit {

   categoryName = signal('Ulam Recipes');

  categoryImage = signal(
    'assets/images/ulam-banner.jpg'
  );

  recipes = signal<Recipe[]>([]);

   constructor() {
    addIcons({
      searchOutline,
      arrowForward,
      restaurantOutline,
      home,
      compassOutline,
      bookmarkOutline,
      calendarOutline
    });
  }

  ngOnInit() {}
}
