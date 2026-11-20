import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import type { OnDestroy } from '@angular/core';
import { Component, DOCUMENT, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActionSheetController,
  AlertController,
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonModal,
  IonNote,
  IonRow,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTextarea,
  IonToast,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  cameraOutline,
  checkmarkCircleOutline,
  ellipsisHorizontal,
  newspaperOutline,
  personOutline,
  refreshOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../auth/auth.service';

import { PostCardComponent } from './post-card.component';
import type { RecipePost } from './recipe-post';

@Component({
  selector: 'app-posts',
  templateUrl: './posts.page.html',
  styleUrls: ['./posts.page.scss', './post-composer.scss'],
  imports: [
    FormsModule,
    IonButton,
    IonButtons,
    IonCard,
    IonContent,
    IonGrid,
    IonHeader,
    IonIcon,
    IonImg,
    IonInput,
    IonModal,
    IonNote,
    IonRow,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonText,
    IonTextarea,
    IonToast,
    IonTitle,
    IonToolbar,
    PostCardComponent,
  ],
})
export class PostsPage implements OnDestroy {
  private http = inject(HttpClient);
  private actions = inject(ActionSheetController);
  private alerts = inject(AlertController);
  private document = inject(DOCUMENT);
  private posts: RecipePost[] = [];
  private photo?: File;

  user = inject(AuthService).user;

  tab = signal<'feed' | 'profile'>('feed');
  visiblePosts = signal<RecipePost[]>([]);
  hasPostsInTab = signal(false);
  search = signal('');

  loading = signal(true);
  feedError = signal(false);
  notice = signal('');
  showSavedToast = signal(false);
  actionError = signal('');
  updatingPost = signal(false);

  showForm = signal(false);
  editing = signal<RecipePost | null>(null);
  posting = signal(false);
  postError = signal('');
  imageVersion = signal(0);
  photoPreview = signal('');
  dishName = '';
  recipe = '';

  constructor() {
    addIcons({
      addOutline,
      cameraOutline,
      checkmarkCircleOutline,
      ellipsisHorizontal,
      newspaperOutline,
      personOutline,
      refreshOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.loadPosts();
  }

  async loadPosts(): Promise<void> {
    this.loading.set(true);
    this.feedError.set(false);
    try {
      this.posts = await firstValueFrom(this.http.get<RecipePost[]>('/api/posts'));
      this.showMatchingPosts();
    } catch {
      this.feedError.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  selectTab(tab: 'feed' | 'profile'): void {
    this.tab.set(tab);
    this.searchPosts('');
  }

  searchPosts(text: string): void {
    this.search.set(text);
    this.showMatchingPosts();
  }

  private showMatchingPosts(): void {
    const search = this.search().trim().toLowerCase();
    const onlyMyPosts = this.tab() === 'profile';
    const userId = this.user()?.id;
    const matches: RecipePost[] = [];
    let hasPosts = false;

    for (const post of this.posts) {
      if (onlyMyPosts && post.author_id !== userId) {
        continue;
      }

      hasPosts = true;
      const dishMatches = post.dish_name.toLowerCase().includes(search);
      const authorMatches = post.author.toLowerCase().includes(search);
      if (dishMatches || authorMatches) {
        matches.push(post);
      }
    }

    this.hasPostsInTab.set(hasPosts);
    this.visiblePosts.set(matches);
  }

  async openPostMenu(post: RecipePost): Promise<void> {
    const buttons = [{ text: post.saved ? 'Remove from Saved' : 'Save', role: 'save' }];
    if (post.author_id === this.user()?.id) {
      buttons.unshift({ text: 'Edit', role: 'edit' });
      buttons.push({ text: 'Delete', role: 'destructive' });
    }
    buttons.push({ text: 'Cancel', role: 'cancel' });
    const sheet = await this.actions.create({ header: post.dish_name, buttons });
    await sheet.present();
    const choice = await sheet.onDidDismiss();
    if (choice.role === 'edit') {
      this.openEditor(post);
    } else if (choice.role === 'save') {
      await this.toggleSaved(post);
    } else if (choice.role === 'destructive') {
      await this.confirmDelete(post);
    }
  }

  private async toggleSaved(post: RecipePost): Promise<void> {
    const url = `/api/posts/${post.id}/save`;
    this.notice.set('');
    this.actionError.set('');
    this.updatingPost.set(true);
    try {
      if (post.saved) {
        await firstValueFrom(this.http.delete(url));
        post.saved = false;
        this.notice.set('Recipe removed from Saved.');
      } else {
        await firstValueFrom(this.http.put(url, null));
        post.saved = true;
        this.showSavedToast.set(true);
      }
    } catch {
      this.actionError.set('Could not update Saved. Try again.');
    } finally {
      this.updatingPost.set(false);
    }
  }

  private async confirmDelete(post: RecipePost): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Delete this post?',
      message: 'This removes the recipe from the feed.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') return;

    this.notice.set('');
    this.actionError.set('');
    this.updatingPost.set(true);
    try {
      await firstValueFrom(this.http.delete(`/api/posts/${post.id}`));
      this.posts = this.posts.filter((item) => item.id !== post.id);
      this.showMatchingPosts();
      this.notice.set('Post deleted.');
    } catch {
      this.actionError.set('Could not delete this post. Try again.');
    } finally {
      this.updatingPost.set(false);
    }
  }

  openEditor(post: RecipePost | null = null): void {
    this.editing.set(post);
    this.dishName = post?.dish_name ?? '';
    this.recipe = post?.recipe ?? '';
    this.showForm.set(true);
  }

  canCloseForm = async (): Promise<boolean> => !this.posting();

  resetForm(): void {
    this.showForm.set(false);
    this.dishName = '';
    this.recipe = '';
    this.postError.set('');
    this.editing.set(null);
    this.clearPreview();
  }

  ngOnDestroy(): void {
    this.clearPreview();
  }

  pickPhoto(): void {
    const input = this.document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = () => {
      const photo = input.files?.[0];
      if (!photo) return;

      this.clearPreview();
      this.postError.set('');
      if (photo.size > 5 * 1024 * 1024) {
        this.postError.set('Choose an image that is 5 MB or smaller.');
        return;
      }

      this.photo = photo;
      this.photoPreview.set(URL.createObjectURL(photo));
    };
    input.click();
  }

  private clearPreview(): void {
    this.photo = undefined;
    const preview = this.photoPreview();
    if (preview) URL.revokeObjectURL(preview);
    this.photoPreview.set('');
  }

  async publish(): Promise<void> {
    if (this.posting() || this.loading()) return;
    this.postError.set('');
    this.notice.set('');
    this.actionError.set('');

    const editing = this.editing();
    const dishName = this.dishName.trim();
    const recipe = this.recipe.trim();
    const photo = this.photo;
    if (!dishName || !recipe) {
      this.postError.set('Enter a dish name and recipe.');
      return;
    }
    if (!editing && !photo) {
      this.postError.set('Add a dish photo.');
      return;
    }
    const form = new FormData();
    form.append('dish_name', dishName);
    form.append('recipe', recipe);
    if (photo) form.append('image', photo);

    this.posting.set(true);
    try {
      if (editing) {
        await firstValueFrom(this.http.put(`/api/posts/${editing.id}`, form));
        if (photo) this.imageVersion.set(this.imageVersion() + 1);
      } else {
        await firstValueFrom(this.http.post('/api/posts', form));
      }
    } catch (error) {
      const detail = error instanceof HttpErrorResponse ? error.error?.detail : undefined;
      this.postError.set(typeof detail === 'string' ? detail : 'Could not publish your recipe. Try again.');
      return;
    } finally {
      this.posting.set(false);
    }
    this.searchPosts('');
    this.showForm.set(false);
    if (editing) {
      this.showSavedToast.set(true);
    } else {
      this.notice.set('Recipe posted.');
    }
    await this.loadPosts();
  }
}
