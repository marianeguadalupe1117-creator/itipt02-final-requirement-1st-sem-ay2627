import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { IngredientsPage } from './ingredients.page';

describe('IngredientsPage', () => {
  it('shows ingredient categories and recipe quantities from the API', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(IngredientsPage);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/ingredients').flush({
      categories: [{ id: 1, name: 'Poultry', ingredients: [{ id: 20, name: 'Chicken' }] }],
      recipes: [
        {
          id: 1,
          name: 'Chicken Adobo',
          ingredients: [{ ingredient_id: 20, name: 'Chicken', quantity: '1', unit: 'kg' }],
        },
      ],
    });
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('#category-heading + ion-accordion-group')?.textContent).toContain('Poultry');
    expect(page.querySelector('#recipe-heading + ion-accordion-group')?.textContent).toContain('Chicken Adobo');
    expect(page.querySelector('.recipe-ingredient .quantity')?.textContent).toContain('1 kg');
    http.verify();
  });
});
