import { Routes } from '@angular/router';

import { PublicLayoutComponent } from './core/layout/public-layout/public-layout.component';
import { AdminLayoutComponent } from './core/layout/admin-layout/admin-layout.component';

import { LandingPageComponent } from './features/public/landing/landing-page/landing-page.component';

import { LoginComponent } from './features/public/auth/login/login.component';
import { RegisterComponent } from './features/public/auth/register/register.component';

import { AssuranceListComponent as PublicAssuranceListComponent } from './features/public/assurances/assurance-list/assurance-list.component';
import { AssuranceDetailsComponent as PublicAssuranceDetailsComponent } from './features/public/assurances/assurance-details/assurance-details.component';

import { DashboardComponent } from './features/admin/dashboard/dashboard.component';

import { UserListComponent } from './features/admin/users/user-list/user-list.component';
import { UserCreateComponent } from './features/admin/users/user-create/user-create.component';
import { UserEditComponent } from './features/admin/users/user-edit/user-edit.component';
import { UserDetailsComponent } from './features/admin/users/user-details/user-details.component';

import { AssuranceCreateComponent } from './features/admin/assurances/assurance-create/assurance-create.component';
import { AssuranceEditComponent } from './features/admin/assurances/assurance-edit/assurance-edit.component';

export const routes: Routes = [
  // ADMIN d'abord
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: DashboardComponent, pathMatch: 'full' },

      { path: 'users', component: UserListComponent },
      { path: 'users/new', component: UserCreateComponent },
      { path: 'users/:id/edit', component: UserEditComponent },
      { path: 'users/:id', component: UserDetailsComponent },

      { path: 'assurances/new', component: AssuranceCreateComponent },
      { path: 'assurances/:id/edit', component: AssuranceEditComponent },
    ],
  },

  // PUBLIC ensuite
  {
    path: 'public',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: LandingPageComponent, pathMatch: 'full' },
      { path: 'assurances', component: PublicAssuranceListComponent },
      { path: 'assurances/:id', component: PublicAssuranceDetailsComponent },
    ],
  },



  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: '**', redirectTo: '' },
];