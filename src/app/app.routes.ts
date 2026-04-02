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
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { authGuard } from './core/guards/auth.guards';
import { ProfileComponent } from './features/public/profile/profile/profile.component';
import { adminGuard } from './core/guards/admin.guard';
import { AdminProfileComponent } from './features/admin/profile/admin-profile/admin-profile.component';
import { CampingSitesComponent } from './features/public/camping-sites/camping-sites.component';
import { SiteBookingComponent } from './features/public/site-booking/site-booking.component';
import { CampingSiteListComponent } from './features/admin/camping-sites/camping-site-list/camping-site-list.component';
import { CampingSiteCreateComponent } from './features/admin/camping-sites/camping-site-create/camping-site-create.component';
import { CampingSiteEditComponent } from './features/admin/camping-sites/camping-site-edit/camping-site-edit.component';


import { ReclamationListComponent } from './features/public/reclamation/reclamation-list/reclamation-list.component';
import { ReclamationAddComponent } from './features/public/reclamation/reclamation-add/reclamation-add.component';
import { RepasListComponent } from './features/public/restauration/repas-list/repas-list.component';
import { CommandeRepasComponent } from './features/public/restauration/commande-repas/commande-repas.component';

import { ReclamationAdminListComponent } from './features/admin/reclamation/reclamation-admin-list/reclamation-admin-list.component';
import { RepasAdminComponent } from './features/admin/restauration/repas-admin/repas-admin.component';
import { CommandesAdminComponent } from './features/admin/restauration/commandes-admin/commandes-admin.component';
import {  AccueilmarketComponent } from './features/public/MarketPlace/accueilmarket/accueilmarket.component';
import { ListeProduitComponent } from './features/public/MarketPlace/liste-produit/liste-produit.component';
import { AddProductComponent } from './features/admin/MarketPlace/add-product/add-product.component';
import { DetailproduitComponent } from './features/public/MarketPlace/detailproduit/detailproduit.component';
import { ListProductComponent } from './features/admin/MarketPlace/list-product/list-product.component';


export const routes: Routes = [
  { path: '', redirectTo: 'public', pathMatch: 'full' },
  // ADMIN d'abord
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },

      { path: 'profile', component: AdminProfileComponent },

      { path: 'users', component: UserListComponent },
      { path: 'users/create', component: UserCreateComponent },
      { path: 'users/edit/:id', component: UserEditComponent },
      { path: 'users/details/:id', component: UserDetailsComponent },

      { path: 'assurances/new', component: AssuranceCreateComponent },
      { path: 'assurances/:id/edit', component: AssuranceEditComponent },
      
      { path: 'camping-sites', component: CampingSiteListComponent },
      { path: 'camping-sites/new', component: CampingSiteCreateComponent },
      { path: 'camping-sites/:id/edit', component: CampingSiteEditComponent },
      
       { path: 'reclamations', component: ReclamationAdminListComponent },
  { path: 'repas', component: RepasAdminComponent },
  { path: 'commandes-repas', component: CommandesAdminComponent },
    { path: 'Market/AddProduct', component: AddProductComponent },
    { path: 'Market/EditProduct/:id', component: AddProductComponent },
    { path: 'Market/listProduct', component: ListProductComponent },





  
    ],
  },

  // client ensuite
  {
    path: 'public',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: LandingPageComponent, pathMatch: 'full' },

      { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
      { path: 'assurances', component: PublicAssuranceListComponent },
      { path: 'assurances/:id', component: PublicAssuranceDetailsComponent },

       { path: 'camping-sites', component: CampingSitesComponent },
      { path: 'site-booking/:id', component: SiteBookingComponent },
 
        { path: 'reclamations/add', component: ReclamationAddComponent },
        { path: 'reclamations', component: ReclamationListComponent },
        { path: 'repas', component: RepasListComponent },
        { path: 'commande-repas', component: CommandeRepasComponent },
        { path: 'Accueil-Market', component: AccueilmarketComponent },
        {path: 'listP', component: ListeProduitComponent},
  { path: 'detailP/:id', component: DetailproduitComponent }


],

  },

  



  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: '**', component: NotFoundComponent },
];