import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LivraisonService } from '../../../../core/services/livraison.service';

@Component({
  selector: 'app-client-my-deliveries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-my-deliveries.component.html',
  styleUrl: './client-my-deliveries.component.css'
})

export class ClientMyDeliveriesComponent implements OnInit {
  private livraisonService = inject(LivraisonService);
  private router = inject(Router);

  livraisons: any[] = [];

  ngOnInit(): void {
    this.livraisonService.getMyClientLivraisons().subscribe({
      next: (data) => this.livraisons = data.reverse()
    });
  }
selectedStatus: 'ALL' | 'PLANIFIEE' | 'EN_COURS' | 'LIVREE' | 'ECHOUEE' | 'RETOURNEE' = 'ALL';

get filteredLivraisons(): any[] {
  if (this.selectedStatus === 'ALL') {
    return this.livraisons;
  }

  return this.livraisons.filter(l => l.statut === this.selectedStatus);
}

setStatusFilter(status: 'ALL' | 'PLANIFIEE' | 'EN_COURS' | 'LIVREE' | 'ECHOUEE' | 'RETOURNEE'): void {
  this.selectedStatus = status;
}
  openDetails(id: number) {
    this.router.navigate(['/public/my-deliveries', id]);
  }

  getStatusIcon(statut: string): string {
  switch (statut) {
    case 'PLANIFIEE': return 'ri-time-line';
    case 'EN_COURS': return 'ri-truck-line';
    case 'LIVREE': return 'ri-checkbox-circle-line';
    case 'ECHOUEE': return 'ri-error-warning-line';
    case 'RETOURNEE': return 'ri-arrow-go-back-line';
    default: return 'ri-box-3-line';
  }
}

getStatusIconClass(statut: string): string {
  return statut.toLowerCase();
}
}