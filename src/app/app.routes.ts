
import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tab',
    loadComponent: () =>
      import('./tab/tab.page').then((m) => m.TabPage),

    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'ingredients',
        loadComponent: () =>
          import('./ingredients/ingredients.page').then((m) => m.IngredientsPage),
      },
      {
        path: 'saved',
        loadComponent: () =>
          import('./saved/saved.page').then((m) => m.SavedPage),
      },
      {
        path: 'plan',
        loadComponent: () =>
          import('./plan/plan.page').then((m) => m.PlanPage),
      },
      {
        path: 'recipes/:category',
        loadComponent: () =>
          import('./recipes/recipes.page').then((m) => m.RecipesPage),
      },
      {
        path: 'instruction',
        loadComponent: () =>
          import('./instruction/instruction.page').then((m) => m.InstructionPage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'tab/home',
    pathMatch: 'full',
  },
];
