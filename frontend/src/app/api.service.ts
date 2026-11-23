import { HttpClient } from '@angular/common/http';
import { inject, isDevMode, Service } from '@angular/core';
import type { Observable } from 'rxjs';

import type { RecipePost } from './posts/recipe-post';

export interface User {
  id: number;
  name: string;
}

export interface LoginDetails {
  email: string;
  password: string;
}

export interface RegistrationDetails extends LoginDetails {
  name: string;
  confirm_password: string;
}

@Service()
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly development = isDevMode();
  private readonly options = { withCredentials: this.development };
  private readonly baseUrl = this.development
    ? `http://${globalThis.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost'}:8000/api`
    : '/api';

  getSession(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/auth/me`, this.options);
  }

  login(details: LoginDetails): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/auth/login`, details, this.options);
  }

  register(details: RegistrationDetails): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/auth/register`, details, this.options);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/logout`, null, this.options);
  }

  getDishCategories<T>(): Observable<T[]> {
    return this.http.get<T[]>(`${this.baseUrl}/dish-categories`, this.options);
  }

  getCategoryDishes<T>(categoryId: string | number): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/dish-categories/${encodeURIComponent(categoryId)}/dishes`, this.options);
  }

  getDish<T>(dishId: string | number): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/dishes/${encodeURIComponent(dishId)}`, this.options);
  }

  getIngredients<T>(): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/ingredients`, this.options);
  }

  getSavedDishes<T>(): Observable<T[]> {
    return this.http.get<T[]>(`${this.baseUrl}/saved-dishes`, this.options);
  }

  saveDish(dishId: string | number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/saved-dishes/${encodeURIComponent(dishId)}`, null, this.options);
  }

  removeSavedDish(dishId: string | number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/saved-dishes/${encodeURIComponent(dishId)}`, this.options);
  }

  getPosts(): Observable<RecipePost[]> {
    return this.http.get<RecipePost[]>(`${this.baseUrl}/posts`, this.options);
  }

  getSavedPosts(): Observable<RecipePost[]> {
    return this.http.get<RecipePost[]>(`${this.baseUrl}/posts?saved=true`, this.options);
  }

  createPost(form: FormData): Observable<RecipePost> {
    return this.http.post<RecipePost>(`${this.baseUrl}/posts`, form, this.options);
  }

  updatePost(postId: number, form: FormData): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/posts/${postId}`, form, this.options);
  }

  deletePost(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/posts/${postId}`, this.options);
  }

  savePost(postId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/posts/${postId}/save`, null, this.options);
  }

  removeSavedPost(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/posts/${postId}/save`, this.options);
  }

  postImageUrl(postId: number, version: number): string {
    return `${this.baseUrl}/posts/${postId}/image?v=${version}`;
  }
}
