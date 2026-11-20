import type { Routes } from '@angular/router';

import { requireLogin } from './auth/auth.service';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/auth.page').then((m) => m.AuthPage),
    data: { registering: true },
  },
  {
    path: 'tab',
    canActivateChild: [requireLogin],
    loadComponent: () => import('./tab/tab.page').then((m) => m.TabPage),

    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'ingredients',
        loadComponent: () => import('./ingredients/ingredients.page').then((m) => m.IngredientsPage),
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
        path: 'posts',
        loadComponent: () => import('./posts/posts.page').then((m) => m.PostsPage),
      },
      {
        path: 'recipes/:categoryId',
        loadComponent: () => import('./recipes/recipes.page').then((m) => m.RecipesPage),
      },
      {
        path: 'instruction/:dishId',
        loadComponent: () => import('./instruction/instruction.page').then((m) => m.InstructionPage),
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
  {
    path: 'saved',
    loadComponent: () => import('./saved/saved.page').then((m) => m.SavedPage),
  },
];
