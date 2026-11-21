import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonContent,
  IonGrid,
  IonHeader,
  IonImg,
  IonRouterLink,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { AuthService } from '../auth/auth.service';
import { PostCardComponent } from '../posts/post-card.component';
import type { RecipePost } from '../posts/recipe-post';

interface SavedDish {
  id: number;
  name: string;
  image_url: string;
}

@Component({
  selector: 'app-saved',
  templateUrl: './saved.page.html',
  styleUrls: ['./saved.page.scss'],
  imports: [
    IonCard,
    IonCardContent,
    IonCardTitle,
    IonContent,
    IonGrid,
    IonHeader,
    IonImg,
    IonRouterLink,
    IonTitle,
    IonToolbar,
    PostCardComponent,
    RouterLink,
  ],
})
export class SavedPage {
  private http = inject(HttpClient);
  user = inject(AuthService).user;

  dishes = signal<SavedDish[]>([]);
  loading = signal(true);
  failed = signal(false);
  posts = signal<RecipePost[]>([]);
  postsLoading = signal(true);
  postsFailed = signal(false);

  ionViewWillEnter(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.postsLoading.set(true);
    this.postsFailed.set(false);

    this.http.get<SavedDish[]>('/api/saved-dishes').subscribe({
      next: (dishes) => {
        this.dishes.set(dishes);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });

    this.http.get<RecipePost[]>('/api/posts?saved=true').subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.postsLoading.set(false);
      },
      error: () => {
        this.postsFailed.set(true);
        this.postsLoading.set(false);
      },
    });
  }
}
