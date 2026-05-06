import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssuranceService } from '../../../../core/services/assurance.service';
import { StatutSouscription } from '../../../../core/models/assurance.models';
import { SouscriptionAssurance } from '../../../../core/models/assurance.models';

@Component({
  selector: 'app-souscriptions-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './Souscriptions-admin.component.html',
  styleUrls: ['./Souscriptions-admin.component.scss']
})
export class SouscriptionsAdminComponent implements OnInit {
  souscriptions: SouscriptionAssurance[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  readonly statusLabels: Record<string, string> = {
    EN_ATTENTE: 'Pending',
    ACTIVE: 'Active',
    EXPIREE: 'Expired',
    ANNULEE: 'Cancelled',
    SUSPENDUE: 'Suspended',
    REFUSEE: 'Rejected'
  };

  constructor(private assuranceService: AssuranceService) {}

  ngOnInit(): void {
    this.loadSouscriptions();
  }

  loadSouscriptions(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.assuranceService.getAllSouscriptions().subscribe({
      next: (data) => {
        this.souscriptions = data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to load customer subscriptions.';
        this.loading = false;
      }
    });
  }

  get activeCount(): number {
    return this.souscriptions.filter((s) => s.statut === 'ACTIVE').length;
  }

  get pendingCount(): number {
    return this.souscriptions.filter((s) => s.statut === 'EN_ATTENTE').length;
  }

  get expiredOrCancelledCount(): number {
    return this.souscriptions.filter(
      (s) =>
        s.statut === 'EXPIREE' ||
        s.statut === 'ANNULEE' 
    ).length;
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'ACTIVE':
        return 'badge-active';

      case 'EN_ATTENTE':
      case 'SUSPENDUE':
        return 'badge-pending';

      case 'ANNULEE':
      case 'EXPIREE':
      case 'REFUSEE':
        return 'badge-rejected';

      default:
        return 'badge-neutral';
    }
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) {
      return 'Unknown';
    }

    return this.statusLabels[status] || status;
  }

  changeStatut(id: number | undefined, event: Event): void {
    if (!id) return;

    const statut = (event.target as HTMLSelectElement).value as StatutSouscription;

    this.assuranceService.updateSouscriptionStatut(id, statut).subscribe({
      next: () => {
        this.successMessage = 'Subscription status updated successfully.';
        this.loadSouscriptions();
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to update subscription status.';
      }
    });
  }
}