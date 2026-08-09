import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/components/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/components/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'workorders', loadComponent: () => import('./features/workorders/components/workorder-list.component').then(m => m.WorkorderListComponent) },
      { path: 'workorders/new', loadComponent: () => import('./features/workorders/components/workorder-form.component').then(m => m.WorkorderFormComponent) },
      { path: 'workorders/:id', loadComponent: () => import('./features/workorders/components/workorder-form.component').then(m => m.WorkorderFormComponent) },
      { path: 'assets', loadComponent: () => import('./features/assets/components/asset-list.component').then(m => m.AssetListComponent) },
      { path: 'assets/new', loadComponent: () => import('./features/assets/components/asset-form.component').then(m => m.AssetFormComponent) },
      { path: 'assets/:id', loadComponent: () => import('./features/assets/components/asset-form.component').then(m => m.AssetFormComponent) }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
