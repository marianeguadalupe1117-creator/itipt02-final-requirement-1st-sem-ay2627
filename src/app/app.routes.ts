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
    path: 'auth',
    loadComponent: () => import('./auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'ingredients',
    loadComponent: () => import('./ingredients/ingredients.page').then((m) => m.IngredientsPage),
  },
  {
    path: 'instruction',
    loadComponent: () => import('./instruction/instruction.page').then((m) => m.InstructionPage),
  },
  {
    path: 'plan',
    loadComponent: () => import('./plan/plan.page').then((m) => m.PlanPage),
  },
  {
    path: 'post',
    loadComponent: () => import('./post/post.page').then((m) => m.PostPage),
  },
  {
    path: 'recipes',
    loadComponent: () => import('./recipes/recipes.page').then((m) => m.RecipesPage),
  },
  {
    path: 'tab',
    loadComponent: () => import('./tab/tab.page').then((m) => m.TabPage),
  },
];
