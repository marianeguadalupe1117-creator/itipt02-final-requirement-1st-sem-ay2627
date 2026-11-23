import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonGrid,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRouterLink,
  IonRow,
  IonSearchbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';

import { ApiService } from '../api.service';

interface Dish {
  id: number;
  name: string;
}

interface CategoryDishes {
  category: { id: number; name: string; image: string | null };
  dishes: Dish[];
}

@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.page.html',
  styleUrls: ['./recipes.page.scss', './recipe-list.scss'],
  imports: [
    IonButton,
    IonContent,
    IonGrid,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonRouterLink,
    IonRow,
    IonSearchbar,
    RouterLink,
  ],
})
export class RecipesPage {
  private api = inject(ApiService);

  categoryId = input.required<string>();
  categoryName = signal('');
  categoryImage = signal<string | null>(null);
  dishes = signal<Dish[]>([]);
  search = signal('');
  loading = signal(true);
  failed = signal(false);

  matchingDishes = computed(() => {
    const search = this.search().trim().toLowerCase();
    return this.dishes().filter((dish) => dish.name.toLowerCase().includes(search));
  });

  constructor() {
    addIcons({ arrowForwardOutline });

    effect((onCleanup) => {
      const categoryId = this.categoryId();
      this.categoryName.set('');
      this.categoryImage.set(null);
      this.search.set('');
      this.loading.set(true);
      this.failed.set(false);

      const request = this.api.getCategoryDishes<CategoryDishes>(categoryId).subscribe({
        next: (data) => {
          this.categoryName.set(data.category.name);
          this.categoryImage.set(data.category.image);
          this.dishes.set(data.dishes);
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });

      onCleanup(() => request.unsubscribe());
    });
  }
}
