import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SavedPage } from './saved.page';

describe('SavedPage', () => {
  it('reloads saved dishes whenever the tab is opened', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(SavedPage);
    const http = TestBed.inject(HttpTestingController);

    fixture.componentInstance.ionViewWillEnter();
    http.expectOne('/api/saved-dishes').flush([{ id: 1, name: 'Chicken Adobo', image_url: '/assets/adobo.jpg' }]);
    http
      .expectOne('/api/posts?saved=true')
      .flush([{ id: 9, author_id: 3, dish_name: 'Pancit', recipe: 'Cook the noodles.', author: 'Mara', saved: true }]);
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('.saved-card .saved-name')?.textContent).toContain('Chicken Adobo');
    expect(page.querySelector<HTMLIonImgElement>('.saved-card ion-img')?.src).toBe('/assets/adobo.jpg');
    expect(page.querySelector<HTMLIonCardElement>('.saved-card')?.href).toBe('/tab/instruction/1?fromSaved=true');
    expect(page.querySelector('.saved-posts .post-bubble .dish-name')?.textContent).toContain('Pancit');
    expect(page.querySelector<HTMLIonAccordionGroupElement>('.saved-posts ion-accordion-group')?.value).toBe('recipe');
    expect(page.querySelector('.saved-posts .recipe-text')?.textContent).toContain('Cook the noodles.');

    fixture.componentInstance.ionViewWillEnter();
    http.expectOne('/api/saved-dishes').flush([]);
    http.expectOne('/api/posts?saved=true').flush([]);
    fixture.detectChanges();
    expect(page.textContent).toContain('No saved dishes yet.');
    http.verify();
  });
});
