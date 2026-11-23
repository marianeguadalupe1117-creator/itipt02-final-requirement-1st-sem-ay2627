import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RecipesPage } from './recipes.page';

describe('RecipesPage', () => {
  it('loads dishes for the current category and updates when the category changes', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(RecipesPage);
    const http = TestBed.inject(HttpTestingController);

    fixture.componentRef.setInput('categoryId', '1');
    fixture.detectChanges();
    http.expectOne('http://localhost:8000/api/dish-categories/1/dishes').flush({
      category: { id: 1, name: 'Main Dish', image: 'assets/categories/main-dish.webp' },
      dishes: [{ id: 10, name: 'Chicken Adobo' }],
    });
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('.recipe-title')?.textContent).toContain('Main Dish');
    expect(page.querySelector('.recipe-banner-image')?.getAttribute('src')).toBe('assets/categories/main-dish.webp');
    expect(page.querySelector('.recipe-item .dish-name')?.textContent).toContain('Chicken Adobo');

    fixture.componentRef.setInput('categoryId', '6');
    fixture.detectChanges();
    http.expectOne('http://localhost:8000/api/dish-categories/6/dishes').flush({
      category: { id: 6, name: 'Fried', image: null },
      dishes: [{ id: 11, name: 'Lechon Kawali' }],
    });
    fixture.detectChanges();
    expect(page.querySelector('.recipe-title')?.textContent).toContain('Fried');
    expect(page.querySelector('.recipe-banner-image')).toBeNull();
    expect(page.querySelector('.recipe-item .dish-name')?.textContent).toContain('Lechon Kawali');
    http.verify();
  });
});
