import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { InstructionPage } from './instruction.page';

describe('InstructionPage', () => {
  it('shows the selected dish, ingredient quantities, and numbered steps', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(InstructionPage);
    fixture.componentRef.setInput('dishId', '1');
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    http.expectOne('http://localhost:8000/api/dishes/1').flush({
      name: 'Chicken Adobo',
      category_id: 1,
      image_url: '',
      saved: false,
      ingredients: [{ name: 'Chicken', quantity: '1', unit: 'kg' }],
      steps: [{ id: 4, number: 1, text: 'Marinate the chicken.' }],
    });
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('.dish-title')?.textContent).toContain('Chicken Adobo');
    expect(page.querySelector('.ingredients-list ion-item')?.textContent).toContain('1 kg');
    expect(page.querySelector('.steps-list ion-item')?.textContent).toContain('Marinate the chicken.');
    expect(page.querySelector('.recipe-step [slot="start"]')?.textContent).toBe('1.');

    const saveButton = page.querySelector<HTMLButtonElement>('ion-button[aria-label="Save dish"]');
    saveButton?.click();
    expect(fixture.componentInstance.showSavedToast()).toBe(false);
    http.expectOne({ method: 'PUT', url: 'http://localhost:8000/api/saved-dishes/1' }).flush(null, {
      status: 204,
      statusText: 'No Content',
    });
    fixture.detectChanges();
    expect(saveButton?.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.componentInstance.showSavedToast()).toBe(true);
    http.verify();
  });
});
