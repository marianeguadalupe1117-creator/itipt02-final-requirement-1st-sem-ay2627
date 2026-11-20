import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AlertController } from '@ionic/angular';
import { vi } from 'vitest';

import { PlanPage } from './plan.page';

describe('PlanPage', () => {
  const dismissAlert = vi.fn();
  const createAlert = vi.fn();

  beforeEach(() => {
    createAlert.mockReset().mockResolvedValue({
      present: () => Promise.resolve(),
      onDidDismiss: dismissAlert.mockReset(),
    });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AlertController, useValue: { create: createAlert } },
      ],
    });
  });

  it('adds, edits, and confirms removal of a meal on the selected calendar date', async () => {
    const fixture = TestBed.createComponent(PlanPage);
    const plan = fixture.componentInstance;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    plan.month.set(tomorrow);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/dish-categories').flush([
      { id: 1, name: 'Main Dish' },
      { id: 2, name: 'Soup' },
    ]);
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const day = page.querySelector<HTMLButtonElement>(`.calendar-day[aria-label="${tomorrow.toDateString()}"]`);
    expect(day).not.toBeNull();
    day?.click();
    fixture.detectChanges();

    const category = page.querySelectorAll('ion-select')[0];
    category.dispatchEvent(new CustomEvent('ionChange', { detail: { value: '1' } }));
    http.expectOne('/api/dish-categories/1/dishes').flush({
      dishes: [{ id: 10, name: 'Chicken Adobo' }],
    });
    fixture.detectChanges();

    const dish = page.querySelectorAll('ion-select')[1];
    expect(dish.disabled).toBe(false);
    dish.dispatchEvent(new CustomEvent('ionChange', { detail: { value: '10' } }));
    fixture.detectChanges();
    page.querySelector<HTMLElement>('.add-meal ion-button')?.click();
    fixture.detectChanges();

    expect(page.querySelector('.meal-item .meal-name')?.textContent).toBe('Chicken Adobo');
    expect(day?.querySelector('.meal-dot')).not.toBeNull();
    expect(plan.dishId()).toBe('');
    expect(plan.showAddSuccessToast()).toBe(true);

    category.dispatchEvent(new CustomEvent('ionChange', { detail: { value: '2' } }));
    fixture.detectChanges();
    expect(dish.disabled).toBe(true);
    http.expectOne('/api/dish-categories/2/dishes').flush({
      dishes: [{ id: 20, name: 'Tinola' }],
    });
    fixture.detectChanges();
    expect(Array.from(dish.querySelectorAll('ion-select-option'), (option) => option.value)).toEqual(['20']);

    page.querySelector<HTMLElement>('ion-button[aria-label="Edit Chicken Adobo"]')?.click();
    http.expectOne('/api/dish-categories/1/dishes').flush({
      dishes: [
        { id: 10, name: 'Chicken Adobo' },
        { id: 11, name: 'Pork Adobo' },
      ],
    });
    fixture.detectChanges();
    expect(dish.value).toBe('10');
    dish.dispatchEvent(new CustomEvent('ionChange', { detail: { value: '11' } }));
    fixture.detectChanges();
    page.querySelector<HTMLElement>('.add-meal ion-button')?.click();
    fixture.detectChanges();
    expect(page.querySelectorAll('.meal-item')).toHaveLength(1);
    expect(page.querySelector('.meal-item .meal-name')?.textContent).toBe('Pork Adobo');

    const removeButton = page.querySelector<HTMLElement>('ion-button[aria-label="Remove meal"]');
    dismissAlert.mockResolvedValueOnce({ role: 'cancel' }).mockResolvedValueOnce({ role: 'confirm' });
    removeButton?.click();
    await vi.waitFor(() => expect(dismissAlert).toHaveBeenCalledTimes(1));
    expect(plan.selectedMeals()).toHaveLength(1);
    expect(plan.showDeleteSuccessToast()).toBe(false);

    removeButton?.click();
    expect(plan.selectedMeals()).toHaveLength(1);
    await vi.waitFor(() => expect(plan.selectedMeals()).toHaveLength(0));
    expect(plan.showDeleteSuccessToast()).toBe(true);
    fixture.detectChanges();
    expect(page.querySelector('.empty-meals')?.textContent).toContain('No meals planned');
    expect(day?.querySelector('.meal-dot')).toBeNull();
    http.verify();
  });

  it('disables past dates and rejects meals for those dates', () => {
    const fixture = TestBed.createComponent(PlanPage);
    const plan = fixture.componentInstance;
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    plan.month.set(yesterday);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/dish-categories').flush([]);

    const page: HTMLElement = fixture.nativeElement;
    const day = page.querySelector<HTMLButtonElement>(`.calendar-day[aria-label="${yesterday.toDateString()}"]`);
    expect(day?.disabled).toBe(true);
    day?.click();
    expect(plan.selectedDate().toDateString()).toBe(today.toDateString());
    expect(plan.isPastDay(today)).toBe(false);

    plan.selectedDate.set(yesterday);
    plan.dishes.set([{ id: 1, name: 'Chicken Adobo' }]);
    plan.dishId.set('1');
    plan.saveMeal();
    expect(plan.plannedMeals()).toEqual([]);
    expect(plan.showAddSuccessToast()).toBe(false);
  });
});
