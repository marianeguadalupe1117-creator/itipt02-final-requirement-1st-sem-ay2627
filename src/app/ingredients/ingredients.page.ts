import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import {
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonContent,
  IonGrid,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { ApiService } from '../api.service';

interface Ingredient {
  id: number;
  name: string;
}

interface IngredientCategory {
  id: number;
  name: string;
  ingredients: Ingredient[];
}

interface IngredientNeed {
  name: string;
  quantity: string;
  unit: string;
}

interface RecipeIngredients {
  id: number;
  name: string;
  ingredients: IngredientNeed[];
}

interface IngredientsResponse {
  categories: IngredientCategory[];
  recipes: RecipeIngredients[];
}

@Component({
  selector: 'app-ingredients',
  templateUrl: './ingredients.page.html',
  styleUrls: ['./ingredients.page.scss'],
  imports: [
    IonAccordion,
    IonAccordionGroup,
    IonButton,
    IonContent,
    IonGrid,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
  ],
})
export class IngredientsPage implements OnInit {
  private api = inject(ApiService);

  categories = signal<IngredientCategory[]>([]);
  recipes = signal<RecipeIngredients[]>([]);
  loading = signal(true);
  failed = signal(false);

  ngOnInit(): void {
    this.loadIngredients();
  }

  loadIngredients(): void {
    this.loading.set(true);
    this.failed.set(false);

    this.api.getIngredients<IngredientsResponse>().subscribe({
      next: (data) => {
        this.categories.set(data.categories);
        this.recipes.set(data.recipes);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }
}
