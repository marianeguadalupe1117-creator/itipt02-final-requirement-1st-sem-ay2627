import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ActionSheetController,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonRouterLink,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { ellipsisHorizontal } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../api.service';
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
    IonButton,
    IonCard,
    IonCardContent,
    IonCardTitle,
    IonContent,
    IonGrid,
    IonHeader,
    IonIcon,
    IonImg,
    IonRouterLink,
    IonTitle,
    IonToast,
    IonToolbar,
    PostCardComponent,
    RouterLink,
  ],
})
export class SavedPage {
  private api = inject(ApiService);
  private actions = inject(ActionSheetController);
  user = inject(AuthService).user;

  dishes = signal<SavedDish[]>([]);
  loading = signal(true);
  failed = signal(false);
  posts = signal<RecipePost[]>([]);
  postsLoading = signal(true);
  postsFailed = signal(false);
  removingPost = signal(false);
  removeFailed = signal(false);
  showRemovedToast = signal(false);

  constructor() {
    addIcons({ ellipsisHorizontal });
  }

  ionViewWillEnter(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.postsLoading.set(true);
    this.postsFailed.set(false);
    this.removeFailed.set(false);

    this.api.getSavedDishes<SavedDish>().subscribe({
      next: (dishes) => {
        this.dishes.set(dishes);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });

    this.api.getSavedPosts().subscribe({
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

  async openPostMenu(post: RecipePost): Promise<void> {
    const sheet = await this.actions.create({
      header: post.dish_name,
      buttons: [
        { text: 'Remove from Saved', role: 'remove' },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
    const { role } = await sheet.onDidDismiss();
    if (role === 'remove') await this.removeSavedPost(post.id);
  }

  private async removeSavedPost(postId: number): Promise<void> {
    if (this.removingPost()) return;

    this.removingPost.set(true);
    this.removeFailed.set(false);
    try {
      await firstValueFrom(this.api.removeSavedPost(postId));
      this.posts.update((posts) => posts.filter((post) => post.id !== postId));
      this.showRemovedToast.set(true);
    } catch {
      this.removeFailed.set(true);
    } finally {
      this.removingPost.set(false);
    }
  }
}
