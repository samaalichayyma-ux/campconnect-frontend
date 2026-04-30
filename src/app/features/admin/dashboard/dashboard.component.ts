import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminIconComponent } from '../../../core/components/admin-icon/admin-icon.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, AdminIconComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  adminName = 'Admin CampConnect';
  adminRole = 'ADMINISTRATEUR';

stats = [
  {
    title: 'Users',
    value: 124,
    icon: 'users',
    colorClass: 'blue-card'
  },
  {
    title: 'Reservations',
    value: 58,
    icon: 'reservations',
    colorClass: 'green-card'
  },
  {
    title: 'Camping Sites',
    value: 12,
    icon: 'camping',
    colorClass: 'olive-card'
  },
  {
    title: 'Deliveries',
    value: 34,
    icon: 'delivery',
    colorClass: 'green-card'
  },
  {
    title: 'Restaurants',
    value: 16,
    icon: 'restaurants',
    colorClass: 'olive-card'
  },
  {
    title: 'Assurances',
    value: 27,
    icon: 'assurances',
    colorClass: 'blue-card'
  },
  {
    title: 'Complaint',
    value: 30,
    icon: 'complaints',
    colorClass: 'olive-card'
  }
];

modules = [
  { title: 'Users', subtitle: 'Manage all users', icon: 'users', link: '/admin/users' },
  { title: 'Camping Sites', subtitle: 'Manage camping sites', icon: 'camping', link: '/admin/camping-sites' },
  { title: 'Delivery Management', subtitle: 'Manage deliveries and livreurs', icon: 'delivery', link: '/admin/livraison/all' },
  { title: 'Assurances', subtitle: 'Manage assurances', icon: 'assurances', link: '/admin/assurances' },
  { title: 'Restaurants', subtitle: 'Manage restaurants', icon: 'restaurants', link: '/admin/repas' },
  { title: 'Guides', subtitle: 'Manage guides', icon: 'guides', link: '/admin/guides' },
  { title: 'Events', subtitle: 'Manage events', icon: 'events', link: '/admin/events' },
  { title: 'Reservations', subtitle: 'Manage reservations', icon: 'reservations', link: '/admin/reservations' },
  { title: 'Formations', subtitle: 'Manage trainings', icon: 'formations', link: '/admin/formations' },
  { title: 'Complaints', subtitle: 'Manage complaints', icon: 'complaints', link: '/admin/reclamations' }
];

  recentActivities = [
    { action: 'New user created', user: 'Chayma Ben Ali', date: 'Today - 10:30' },
    { action: 'Restaurant updated', user: 'Admin', date: 'Today - 09:15' },
    { action: 'Insurance added', user: 'Molka', date: 'Yesterday - 17:20' },
    { action: 'Guide account approved', user: 'Admin', date: 'Yesterday - 14:05' }
  ];
}
