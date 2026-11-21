import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonGrid,
  IonIcon,
  IonImg,
  IonItem,
  IonLabel,
  IonList,
  IonRouterLink,
  IonRow,
  IonToast,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, bookmark, bookmarkOutline } from 'ionicons/icons';

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface CookingStep {
  id: number;
  number: number;
  text: string;
}

interface DishDetails {
  name: string;
  category_id: number;
  image_url: string;
  saved: boolean;
  ingredients: Ingredient[];
  steps: CookingStep[];
}

@Component({
  selector: 'app-instruction',
  templateUrl: './instruction.page.html',
  styleUrls: ['./instruction.page.scss'],
  imports: [
    IonButton,
    IonContent,
    IonGrid,
    IonIcon,
    IonImg,
    IonItem,
    IonLabel,
    IonList,
    IonRouterLink,
    IonRow,
    IonToast,
    RouterLink,
  ],
})
export class InstructionPage {
  private http = inject(HttpClient);
  private refresh = signal(0);

  dishId = input.required<string>();
  fromSaved = input<string>();
  dish = signal<DishDetails | null>(null);
  loading = signal(true);
  saved = signal(false);
  saving = signal(false);
  saveFailed = signal(false);
  showSavedToast = signal(false);

  constructor() {
    addIcons({ arrowBackOutline, bookmark, bookmarkOutline });

    effect((onCleanup) => {
      const dishId = this.dishId();
      this.refresh();
      this.loading.set(true);
      this.dish.set(null);
      this.saveFailed.set(false);

      const request = this.http.get<DishDetails>(`/api/dishes/${encodeURIComponent(dishId)}`).subscribe({
        next: (dish) => {
          this.dish.set(dish);
          this.saved.set(dish.saved);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

      onCleanup(() => request.unsubscribe());
    });
  }

  ionViewWillEnter(): void {
    if (this.dish()) {
      this.refresh.update((count) => count + 1);
    }
  }

  toggleSaved(): void {
    const dishId = this.dishId();
    const shouldSave = !this.saved();
    const url = `/api/saved-dishes/${encodeURIComponent(dishId)}`;
    const request = shouldSave ? this.http.put(url, null) : this.http.delete(url);

    this.saving.set(true);
    this.saveFailed.set(false);
    request.subscribe({
      next: () => {
        if (this.dishId() === dishId) {
          this.saved.set(shouldSave);
          if (shouldSave) {
            this.showSavedToast.set(true);
          }
        }
        this.saving.set(false);
      },
      error: () => {
        this.saveFailed.set(true);
        this.saving.set(false);
      },
    });
  }
}
