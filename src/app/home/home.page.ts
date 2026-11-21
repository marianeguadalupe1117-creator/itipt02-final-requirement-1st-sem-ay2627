import { HttpClient } from '@angular/common/http';
import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonAvatar,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonContent,
  IonGrid,
  IonIcon,
  IonImg,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonRouterLink,
  IonRow,
  NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { leafOutline, personOutline, timeOutline } from 'ionicons/icons';

import { AuthService } from '../auth/auth.service';

interface DishCategory {
  id: number;
  name: string;
  image: string | null;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['./home.page.scss', './home-cards.scss'],
  imports: [
    IonAvatar,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardTitle,
    IonContent,
    IonGrid,
    IonIcon,
    IonImg,
    IonItem,
    IonLabel,
    IonList,
    IonPopover,
    IonRouterLink,
    IonRow,
    RouterLink,
  ],
})
export class HomePage implements OnInit {
  private http = inject(HttpClient);
  private alerts = inject(AlertController);
  private nav = inject(NavController);

  private auth = inject(AuthService);
  user = this.auth.user;

  categories = signal<DishCategory[]>([]);
  loading = signal(true);
  failed = signal(false);

  featuredDishes: Record<string, string> = {
    'Main Dish': 'Chicken Adobo',
    Soup: 'Pork Sinigang',
    'Pasta/Noodles': 'Sweet Spaghetti',
    'Grilled/Roasted': 'Pork Barbeque',
    'Snacks/Dessert': 'Bananaque',
    Fried: 'Lechon Kawali',
  };

  constructor() {
    addIcons({ leafOutline, personOutline, timeOutline });
  }

  ngOnInit(): void {
    this.http.get<DishCategory[]>('/api/dish-categories').subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  async confirmLogout(): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Log out?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Log out', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') return;

    try {
      await this.auth.logout();
      await this.nav.navigateRoot('/login', { replaceUrl: true });
    } catch {
      const error = await this.alerts.create({ message: 'Could not log out. Please try again.', buttons: ['OK'] });
      await error.present();
    }
  }
}
