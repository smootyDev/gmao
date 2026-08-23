import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

const adminOnly = [roleGuard(['ADMIN'])];
const adminManager = [roleGuard(['ADMIN', 'MANAGER'])];

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
      { path: 'workorders/new', loadComponent: () => import('./features/workorders/components/workorder-form.component').then(m => m.WorkorderFormComponent), canActivate: adminManager },
      { path: 'workorders/:id', loadComponent: () => import('./features/workorders/components/workorder-form.component').then(m => m.WorkorderFormComponent) },
      { path: 'assets', loadComponent: () => import('./features/assets/components/asset-list.component').then(m => m.AssetListComponent) },
      { path: 'assets/new', loadComponent: () => import('./features/assets/components/asset-form.component').then(m => m.AssetFormComponent), canActivate: adminManager },
      { path: 'assets/:id', loadComponent: () => import('./features/assets/components/asset-form.component').then(m => m.AssetFormComponent) },
      { path: 'asset-types', loadComponent: () => import('./features/asset-types/components/asset-type-list.component').then(m => m.AssetTypeListComponent) },
      { path: 'asset-types/new', loadComponent: () => import('./features/asset-types/components/asset-type-form.component').then(m => m.AssetTypeFormComponent), canActivate: adminManager },
      { path: 'asset-types/:id', loadComponent: () => import('./features/asset-types/components/asset-type-form.component').then(m => m.AssetTypeFormComponent) },
      { path: 'users', loadComponent: () => import('./features/users/components/user-list.component').then(m => m.UserListComponent), canActivate: adminOnly },
      { path: 'users/new', loadComponent: () => import('./features/users/components/user-form.component').then(m => m.UserFormComponent), canActivate: adminOnly },
      { path: 'users/:id', loadComponent: () => import('./features/users/components/user-form.component').then(m => m.UserFormComponent), canActivate: adminOnly },
      { path: 'locations', loadComponent: () => import('./features/locations/components/location-list.component').then(m => m.LocationListComponent) },
      { path: 'locations/new', loadComponent: () => import('./features/locations/components/location-form.component').then(m => m.LocationFormComponent), canActivate: adminManager },
      { path: 'locations/:id', loadComponent: () => import('./features/locations/components/location-form.component').then(m => m.LocationFormComponent) },
      { path: 'inventory', loadComponent: () => import('./features/inventory/components/inventory-list.component').then(m => m.InventoryListComponent) },
      { path: 'inventory/new', loadComponent: () => import('./features/inventory/components/inventory-form.component').then(m => m.InventoryFormComponent), canActivate: adminManager },
      { path: 'inventory/:id', loadComponent: () => import('./features/inventory/components/inventory-form.component').then(m => m.InventoryFormComponent) },
      { path: 'preventive', loadComponent: () => import('./features/preventive/components/preventive-list.component').then(m => m.PreventiveListComponent) },
      { path: 'preventive/new', loadComponent: () => import('./features/preventive/components/preventive-form.component').then(m => m.PreventiveFormComponent), canActivate: adminManager },
      { path: 'preventive/:id', loadComponent: () => import('./features/preventive/components/preventive-form.component').then(m => m.PreventiveFormComponent) },
      { path: 'ai', loadComponent: () => import('./features/ai/chat/components/ai-chat.component').then(m => m.AiChatComponent) },
      { path: 'ai/settings', loadComponent: () => import('./features/ai/settings/components/ai-settings.component').then(m => m.AiSettingsComponent), canActivate: adminOnly },
      { path: 'audit-logs', loadComponent: () => import('./features/audit/components/audit-log-list.component').then(m => m.AuditLogListComponent), canActivate: adminOnly }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
