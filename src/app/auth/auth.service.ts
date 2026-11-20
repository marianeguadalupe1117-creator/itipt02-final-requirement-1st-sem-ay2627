import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type { CanActivateChildFn } from '@angular/router';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

interface User {
  id: number;
  name: string;
}

interface LoginDetails {
  email: string;
  password: string;
}

interface RegistrationDetails extends LoginDetails {
  name: string;
  confirm_password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  user = signal<User | null>(null);

  async checkSession(): Promise<boolean> {
    try {
      const user = await firstValueFrom(this.http.get<User>('/api/auth/me'));
      this.user.set(user);
      return true;
    } catch {
      this.user.set(null);
      return false;
    }
  }

  async login(details: LoginDetails): Promise<void> {
    const user = await firstValueFrom(this.http.post<User>('/api/auth/login', details));
    this.user.set(user);
  }

  async register(details: RegistrationDetails): Promise<void> {
    const user = await firstValueFrom(this.http.post<User>('/api/auth/register', details));
    this.user.set(user);
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/logout', null));
    this.user.set(null);
  }
}

export const requireLogin: CanActivateChildFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return (await auth.checkSession()) || router.createUrlTree(['/login']);
};
