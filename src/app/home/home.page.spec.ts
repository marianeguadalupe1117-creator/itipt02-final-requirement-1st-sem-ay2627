import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HomePage } from './home.page';

describe('HomePage', () => {
  it('links each category from the API to its recipe list', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/dish-categories').flush([
      { id: 1, name: 'Main Dish', image: 'assets/categories/custom-main-dish.webp' },
      { id: 2, name: 'Soup', image: 'assets/categories/soup.webp' },
      { id: 7, name: 'Sides', image: null },
    ]);
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const [mainDish, soup, sides] = page.querySelectorAll<HTMLIonCardElement>('ion-card.category-card');
    expect(mainDish.href).toBe('/tab/recipes/1');
    expect(soup.href).toBe('/tab/recipes/2');
    expect(sides.href).toBe('/tab/recipes/7');
    expect(mainDish?.querySelector('.featured-label')?.textContent).toContain('Main Dish');
    expect(soup?.querySelector('.featured-label')?.textContent).toContain('Soup');
    expect(soup?.querySelector('ion-icon')?.getAttribute('name')).toBe('time-outline');
    expect(mainDish.querySelector('ion-img')?.src).toBe('assets/categories/custom-main-dish.webp');
    expect(soup.classList.contains('light-card')).toBe(true);
    expect(soup.querySelector('ion-img')?.src).toBe('assets/categories/soup.webp');
    expect(sides.querySelector('ion-img')).toBeNull();
    http.verify();
  });
});
