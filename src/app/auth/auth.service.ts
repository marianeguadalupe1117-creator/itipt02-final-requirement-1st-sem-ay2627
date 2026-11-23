import { inject, Injectable, signal } from '@angular/core';
import type { CanActivateChildFn } from '@angular/router';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import type { LoginDetails, RegistrationDetails, User } from '../api.service';
import { ApiService } from '../api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  user = signal<User | null>(null);

  async checkSession(): Promise<boolean> {
    try {
      const user = await firstValueFrom(this.api.getSession());
      this.user.set(user);
      return true;
    } catch {
      this.user.set(null);
      return false;
    }
  }

  async login(details: LoginDetails): Promise<void> {
    const user = await firstValueFrom(this.api.login(details));
    this.user.set(user);
  }

  async register(details: RegistrationDetails): Promise<void> {
    await firstValueFrom(this.api.register(details));
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.api.logout());
    this.user.set(null);
  }
}

export const requireLogin: CanActivateChildFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return (await auth.checkSession()) || router.createUrlTree(['/login']);
};
