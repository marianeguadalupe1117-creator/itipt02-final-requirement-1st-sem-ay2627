import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActionSheetController } from '@ionic/angular';
import { vi } from 'vitest';

import { SavedPage } from './saved.page';

describe('SavedPage', () => {
  it('reloads the Saved tab and removes a saved post', async () => {
    const createSheet = vi.fn().mockResolvedValue({
      present: vi.fn().mockResolvedValue(undefined),
      onDidDismiss: vi.fn().mockResolvedValue({ role: 'remove' }),
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActionSheetController, useValue: { create: createSheet } },
      ],
    });
    const fixture = TestBed.createComponent(SavedPage);
    const http = TestBed.inject(HttpTestingController);

    fixture.componentInstance.ionViewWillEnter();
    http
      .expectOne('http://localhost:8000/api/saved-dishes')
      .flush([{ id: 1, name: 'Chicken Adobo', image_url: '/assets/adobo.jpg' }]);
    http
      .expectOne('http://localhost:8000/api/posts?saved=true')
      .flush([{ id: 9, author_id: 3, dish_name: 'Pancit', recipe: 'Cook the noodles.', author: 'Mara', saved: true }]);
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('.saved-card .saved-name')?.textContent).toContain('Chicken Adobo');
    expect(page.querySelector<HTMLIonImgElement>('.saved-card ion-img')?.src).toBe('/assets/adobo.jpg');
    expect(page.querySelector<HTMLIonCardElement>('.saved-card')?.href).toBe('/tab/instruction/1?fromSaved=true');
    expect(page.querySelector('.saved-posts .post-bubble .dish-name')?.textContent).toContain('Pancit');
    expect(page.querySelector<HTMLIonAccordionGroupElement>('.saved-posts ion-accordion-group')?.value).toBe('recipe');
    expect(page.querySelector('.saved-posts .recipe-text')?.textContent).toContain('Cook the noodles.');

    const optionsButton = page.querySelector<HTMLIonButtonElement>('.saved-posts .post-menu');
    expect(optionsButton?.getAttribute('aria-label')).toBe('Options for Pancit');
    optionsButton?.click();
    expect(createSheet).toHaveBeenCalledWith({
      header: 'Pancit',
      buttons: [
        { text: 'Remove from Saved', role: 'remove' },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    const removal = await vi.waitFor(() =>
      http.expectOne({ method: 'DELETE', url: 'http://localhost:8000/api/posts/9/save' }),
    );
    expect(fixture.componentInstance.showRemovedToast()).toBe(false);
    expect(removal.request.withCredentials).toBe(true);
    removal.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('No saved posts yet.');
    expect(fixture.componentInstance.showRemovedToast()).toBe(true);

    fixture.componentInstance.ionViewWillEnter();
    http.expectOne('http://localhost:8000/api/saved-dishes').flush([]);
    http.expectOne('http://localhost:8000/api/posts?saved=true').flush([]);
    fixture.detectChanges();
    expect(page.textContent).toContain('No saved dishes yet.');
    http.verify();
  });
});
