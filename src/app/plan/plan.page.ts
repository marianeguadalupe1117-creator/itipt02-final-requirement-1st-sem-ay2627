import { HttpClient } from '@angular/common/http';
import type { OnInit } from '@angular/core';
import { Component, computed, inject, signal } from '@angular/core';
import {
  AlertController,
  IonAvatar,
  IonButton,
  IonCard,
  IonCardContent,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonItem,
  IonLabel,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonText,
  IonToast,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calendarOutline,
  chevronBackOutline,
  chevronForwardOutline,
  pencilOutline,
  trashOutline,
} from 'ionicons/icons';
import type { Subscription } from 'rxjs';

interface DishOption {
  id: number;
  name: string;
}

interface PlannedMeal {
  date: string;
  name: string;
  categoryId: string;
  dishId: string;
}

@Component({
  selector: 'app-plan',
  templateUrl: './plan.page.html',
  styleUrls: ['./plan.page.scss', './plan-calendar.scss'],
  imports: [
    IonAvatar,
    IonButton,
    IonCard,
    IonCardContent,
    IonCol,
    IonContent,
    IonGrid,
    IonIcon,
    IonItem,
    IonLabel,
    IonRow,
    IonSelect,
    IonSelectOption,
    IonText,
    IonToast,
  ],
})
export class PlanPage implements OnInit {
  private http = inject(HttpClient);
  private alerts = inject(AlertController);
  private dishRequest?: Subscription;

  today = signal(new Date());
  month = signal(this.today());
  selectedDate = signal(this.today());
  plannedMeals = signal<PlannedMeal[]>([]);
  editingMeal = signal<PlannedMeal | null>(null);
  showEditSuccessToast = signal(false);
  showDeleteSuccessToast = signal(false);
  showAddSuccessToast = signal(false);
  categories = signal<DishOption[]>([]);
  dishes = signal<DishOption[]>([]);
  categoryId = signal('');
  dishId = signal('');
  loadingDishes = signal(false);
  loadError = signal('');

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  calendarDays = computed(() => {
    const year = this.month().getFullYear();
    const month = this.month().getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];

    for (let index = 0; index < firstDay; index++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  });

  monthLabel = computed(() => this.month().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  dateLabel = computed(() => this.selectedDate().toLocaleDateString('en-US', { dateStyle: 'long' }));
  selectedMeals = computed(() => {
    const date = this.selectedDate().toDateString();
    return this.plannedMeals().filter((meal) => meal.date === date);
  });

  constructor() {
    addIcons({ addOutline, calendarOutline, chevronBackOutline, chevronForwardOutline, pencilOutline, trashOutline });
  }

  ngOnInit(): void {
    this.http.get<DishOption[]>('/api/dish-categories').subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.loadError.set('Could not load categories.'),
    });
  }

  chooseCategory(categoryId: string, selectedDishId = ''): void {
    this.dishRequest?.unsubscribe();
    this.categoryId.set(categoryId);
    this.dishId.set('');
    this.dishes.set([]);
    this.loadError.set('');
    this.loadingDishes.set(Boolean(categoryId));
    if (!categoryId) return;

    this.dishRequest = this.http.get<{ dishes: DishOption[] }>(`/api/dish-categories/${categoryId}/dishes`).subscribe({
      next: (data) => {
        this.dishes.set(data.dishes);
        if (data.dishes.some((dish) => dish.id.toString() === selectedDishId)) {
          this.dishId.set(selectedDishId);
        }
        this.loadingDishes.set(false);
      },
      error: () => {
        this.loadError.set('Could not load dishes.');
        this.loadingDishes.set(false);
      },
    });
  }

  ionViewWillEnter(): void {
    this.today.set(new Date());
  }

  changeMonth(amount: number): void {
    const currentMonth = this.month();
    this.month.set(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + amount, 1));
  }

  hasMeals(day: Date): boolean {
    const date = day.toDateString();
    return this.plannedMeals().some((meal) => meal.date === date);
  }

  isPastDay(day: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return day.getTime() < today.getTime();
  }

  selectDay(day: Date): void {
    if (this.isPastDay(day)) return;
    if (day.toDateString() !== this.selectedDate().toDateString() && this.editingMeal()) {
      this.cancelEdit();
    }
    this.selectedDate.set(day);
  }

  editMeal(meal: PlannedMeal): void {
    if (this.isPastDay(this.selectedDate())) return;
    this.editingMeal.set(meal);
    this.chooseCategory(meal.categoryId, meal.dishId);
  }

  cancelEdit(): void {
    this.editingMeal.set(null);
    this.chooseCategory('');
  }

  saveMeal(): void {
    const dish = this.dishes().find((dish) => dish.id === Number(this.dishId()));
    if (!dish || this.isPastDay(this.selectedDate())) return;

    const date = this.selectedDate().toDateString();
    const meal = { date, name: dish.name, categoryId: this.categoryId(), dishId: this.dishId() };
    const editingMeal = this.editingMeal();
    if (editingMeal) {
      this.plannedMeals.update((meals) => meals.map((item) => (item === editingMeal ? meal : item)));
      this.editingMeal.set(null);
      this.showEditSuccessToast.set(true);
    } else {
      this.plannedMeals.update((meals) => [...meals, meal]);
      this.showAddSuccessToast.set(true);
    }
    this.dishId.set('');
  }

  async deleteMeal(meal: PlannedMeal): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Are you sure you want to delete this meal?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm' || !this.plannedMeals().includes(meal)) return;

    if (this.editingMeal() === meal) this.cancelEdit();
    this.plannedMeals.update((meals) => meals.filter((item) => item !== meal));
    this.showDeleteSuccessToast.set(true);
  }
}
