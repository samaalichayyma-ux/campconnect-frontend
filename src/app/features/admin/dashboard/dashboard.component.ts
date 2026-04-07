import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
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
      icon: '👥',
      colorClass: 'blue-card'
    },
    {
      title: 'Reservations',
      value: 58,
      icon: '📅',
      colorClass: 'green-card'
    },
    {
      title: 'Restaurants',
      value: 16,
      icon: '🍽️',
      colorClass: 'olive-card'
    },
    {
      title: 'Assurances',
      value: 27,
      icon: '🛡️',
      colorClass: 'blue-card'
    },
      { title: 'Complaint', 
        Value: '30', 
        icon: '⚠️',
      colorClass: 'olive-card'
      }
    
  ];

  modules = [
    { title: 'Users', subtitle: 'Manage all users', icon: '👤', link: '/admin/users' },
    { title: 'Assurances', subtitle: 'Manage assurances', icon: '🛡️', link: '/admin/assurances' },
    { title: 'Restaurants', subtitle: 'Manage restaurants', icon: '🍴', link: '/admin/repas' },
    { title: 'Guides', subtitle: 'Manage guides', icon: '🧭', link: '/admin/guides' },
    { title: 'Events', subtitle: 'Manage events', icon: '🎉', link: '/admin/events' },
    { title: 'Formations', subtitle: 'Manage trainings', icon: '📘', link: '/admin/formations' },
    { title: 'Complaint', subtitle: 'Manage complains', icon: '⚠️', link: '/admin/reclamations' }
    
  ];

  recentActivities = [
    { action: 'New user created', user: 'Chayma Ben Ali', date: 'Today - 10:30' },
    { action: 'Restaurant updated', user: 'Admin', date: 'Today - 09:15' },
    { action: 'Insurance added', user: 'Molka', date: 'Yesterday - 17:20' },
    { action: 'Guide account approved', user: 'Admin', date: 'Yesterday - 14:05' }
  ];

}
