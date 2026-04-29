import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { LivraisonService } from '../../../../core/services/livraison.service';
import { LivraisonResponse } from '../../../../models/livraison.model';


@Component({
  selector: 'app-livreur-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminIconComponent],
  templateUrl: './livreur-dashboard.component.html',
  styleUrl: './livreur-dashboard.component.css'
})
export class LivreurDashboardComponent implements OnInit {
  private livraisonService = inject(LivraisonService);

  livreurName = 'Delivery CampConnect';
  livreurRole = 'LIVREUR';

  livraisons: LivraisonResponse[] = [];

  stats = [
    {
      title: 'Assigned',
      value: 0,
      icon: 'reservations',
      colorClass: 'blue-card'
    },
    {
      title: 'Planned',
      value: 0,
      icon: 'events',
      colorClass: 'olive-card'
    },
    {
      title: 'In Progress',
      value: 0,
      icon: 'guides',
      colorClass: 'green-card'
    },
    {
      title: 'Delivered',
      value: 0,
      icon: 'assurances',
      colorClass: 'blue-card'
    }
  ];

  modules = [
  {
    title: 'My Delivery',
    subtitle: 'View assigned deliveries',
    icon: 'reservations',
    link: '/admin/livraison/mine'
  },
  {
    title: 'Wallet & Tips',
    subtitle: 'View tips, ratings and balance',
    icon: 'assurances',
    link: '/admin/livraison/wallet'
  },
  {
    title: 'History',
    subtitle: 'See completed deliveries',
    icon: 'guides',
    link: '/admin/livraison/mine'
  }
];

  recentActivities: { action: string; user: string; date: string }[] = [];

  wallet: any = null;
  tips: any[] = [];

  walletBalance = 0;
  totalTips = 0;
  avgRating = 0;

ngOnInit(): void {
  this.loadStats();
  this.loadMyLivraisons();
  this.loadWallet();
  this.loadTips();
}

loadMyLivraisons(): void {
  this.livraisonService.getMyLivraisons().subscribe({
    next: (data) => {
      this.livraisons = data;
      this.buildRecentActivities();
    },
    error: (err) => {
      console.error('Error while loading delivery person deliveries', err);
    }
  });
}

loadStats(): void {
  this.livraisonService.getMyStats().subscribe({
    next: (data) => {
      this.stats = [
        { title: 'Assigned', value: data.totalAssigned, icon: 'reservations', colorClass: 'blue-card' },
        { title: 'Planned', value: data.planned, icon: 'events', colorClass: 'olive-card' },
        { title: 'In Progress', value: data.inProgress, icon: 'guides', colorClass: 'green-card' },
        { title: 'Delivered', value: data.delivered, icon: 'assurances', colorClass: 'blue-card' }
      ];
    },
    error: (err) => {
      console.error('Error while loading stats', err);
    }
  });
}

  updateStats(): void {
    const assigned = this.livraisons.length;
    const planned = this.livraisons.filter(l => l.statut === 'PLANIFIEE').length;
    const inProgress = this.livraisons.filter(l => l.statut === 'EN_COURS').length;
    const delivered = this.livraisons.filter(l => l.statut === 'LIVREE').length;

    this.stats = [
      { title: 'Assigned', value: assigned, icon: 'reservations', colorClass: 'blue-card' },
      { title: 'Planned', value: planned, icon: 'events', colorClass: 'olive-card' },
      { title: 'In Progress', value: inProgress, icon: 'guides', colorClass: 'green-card' },
      { title: 'Delivered', value: delivered, icon: 'assurances', colorClass: 'blue-card' }
    ];
  }

  buildRecentActivities(): void {
    this.recentActivities = this.livraisons.slice(0, 5).map(l => ({
      action: `Delivery #${l.idLivraison} - ${l.statut}`,
      user: 'Assigned to me',
      date: l.dateLivraisonEffective || l.dateDepart || 'No date'
    }));
  }

  get currentStatus(): string {
    if (this.stats[2].value > 0) return 'On Delivery';
    return 'Available';
  }

  loadWallet(): void {
  this.livraisonService.getMyLivreurWallet().subscribe({
    next: (data) => {
      this.wallet = data;
      this.walletBalance = data?.balance || 0;
    },
    error: (err) => {
      console.error('Error while loading wallet', err);
    }
  });
}

loadTips(): void {
  this.livraisonService.getMyLivreurTips().subscribe({
    next: (data) => {
      this.tips = data || [];

      this.totalTips = this.tips.reduce(
        (sum, tip) => sum + (tip.amount || 0),
        0
      );

      const ratedTips = this.tips.filter(tip => tip.rating);
      this.avgRating = ratedTips.length
        ? ratedTips.reduce((sum, tip) => sum + tip.rating, 0) / ratedTips.length
        : 0;
    },
    error: (err) => {
      console.error('Error while loading tips', err);
    }
  });
}

getStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}
}