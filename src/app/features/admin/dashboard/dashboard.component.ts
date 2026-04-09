import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminIconComponent } from '../../../core/components/admin-icon/admin-icon.component';

interface DashboardModuleCard {
  title: string;
  subtitle: string;
  icon: string;
  link: string;
  queryParams?: Record<string, string | number>;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, AdminIconComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  adminName = 'Admin CampConnect';
  adminRole = 'ADMINISTRATEUR';

  readonly modules: DashboardModuleCard[] = [
    { title: 'Users', subtitle: 'Manage all users', icon: 'users', link: '/admin/users' },
    { title: 'Assurances', subtitle: 'Manage assurances', icon: 'assurances', link: '/admin/assurances/new' },
    { title: 'Restaurants', subtitle: 'Manage restaurants', icon: 'restaurants', link: '/admin/repas' },
    { title: 'Guides', subtitle: 'Manage guides', icon: 'guides', link: '/admin/guides' },
    {
      title: 'Event Statistiques',
      subtitle: 'Track demand and occupancy',
      icon: 'events',
      link: '/admin/events/stats',
      queryParams: { from: 'dashboard' }
    },
    {
      title: 'Promotions',
      subtitle: 'Manage promo codes',
      icon: 'sparkles',
      link: '/admin/promotions',
      queryParams: { from: 'dashboard' }
    },
    {
      title: 'Reservation Statistiques',
      subtitle: 'Follow approvals and check-ins',
      icon: 'reservations',
      link: '/admin/reservations/stats',
      queryParams: { from: 'dashboard' }
    },
    { title: 'Formations', subtitle: 'Manage trainings', icon: 'formations', link: '/admin/formations' }
  ];
}
