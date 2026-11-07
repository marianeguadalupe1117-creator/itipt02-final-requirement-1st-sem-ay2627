import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'recipes/:categoryId',
    loadComponent: () => import('./recipes/recipes.page').then((m) => m.RecipesPage),
  },

  {
    path: 'instructions/:instructionsId',
    loadComponent: () => import('./instructions/instructions.page').then((m) => m.InstructionsPage),
  },
  {
    path: 'saved',
    loadComponent: () => import('./saved/saved.page').then((m) => m.SavedPage),
  },
  {
    path: 'plan',
    loadComponent: () => import('./plan/plan.page').then((m) => m.PlanPage),
  },
  {
    path: 'ingredient',
    loadComponent: () => import('./ingredient/ingredient.page').then((m) => m.IngredientPage),
  },
];
