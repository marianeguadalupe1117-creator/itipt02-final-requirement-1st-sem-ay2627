import { HttpErrorResponse } from '@angular/common/http';
import { booleanAttribute, Component, inject, input, signal } from '@angular/core';
import type { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonAvatar,
  IonButton,
  IonContent,
  IonGrid,
  IonIcon,
  IonInput,
  IonNote,
  IonRouterLink,
  IonRow,
  IonText,
  NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { leafOutline } from 'ionicons/icons';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss', './auth-garden.scss'],
  imports: [
    FormsModule,
    IonAvatar,
    IonButton,
    IonContent,
    IonGrid,
    IonIcon,
    IonInput,
    IonNote,
    IonRouterLink,
    IonRow,
    IonText,
    RouterLink,
  ],
})
export class AuthPage {
  private auth = inject(AuthService);
  private nav = inject(NavController);
  registering = input(false, { alias: 'register', transform: booleanAttribute });
  registered = input<string>();
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  submitting = signal(false);
  showPassword = signal(false);
  message = signal('');

  constructor() {
    addIcons({ leafOutline });
  }

  async submit(form: NgForm): Promise<void> {
    if (this.submitting()) return;
    this.message.set('');

    if (form.invalid || (this.registering() && !this.name.trim())) {
      this.message.set('Please fill in all fields with a valid email address.');
      return;
    }
    const passwordLength = Array.from(this.password).length;
    if (passwordLength < 8 || passwordLength > 48) {
      this.message.set('Password must be 8 to 48 characters.');
      return;
    }
    if (this.registering() && this.password !== this.confirmPassword) {
      this.message.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    const details = { email: this.email.trim(), password: this.password };
    try {
      if (this.registering()) {
        await this.auth.register({ ...details, name: this.name.trim(), confirm_password: this.confirmPassword });
        form.resetForm();
        this.showPassword.set(false);
        await this.nav.navigateRoot('/login', { queryParams: { registered: 'true' }, replaceUrl: true });
      } else {
        await this.auth.login(details);
        form.resetForm();
        this.showPassword.set(false);
        await this.nav.navigateRoot('/tab/home', { replaceUrl: true });
      }
    } catch (error) {
      if (error instanceof HttpErrorResponse && typeof error.error?.detail === 'string') {
        this.message.set(error.error.detail);
      } else {
        this.message.set('Could not submit the form. Please try again.');
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
