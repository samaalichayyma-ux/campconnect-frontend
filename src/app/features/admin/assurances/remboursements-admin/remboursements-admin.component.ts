import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssuranceService } from '../../../../core/services/assurance.service';
import {
  Remboursement,
  StatutRemboursement
} from '../../../../core/models/assurance.models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-remboursements-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './remboursements-admin.component.html',
  styleUrls: ['./remboursements-admin.component.scss']
})
export class RemboursementsAdminComponent implements OnInit {
  remboursements: Remboursement[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  readonly statusOptions = Object.values(StatutRemboursement);

  readonly statusLabels: Record<string, string> = {
    EN_ATTENTE: 'Pending',
    EFFECTUE: 'Completed',
    REJETE: 'Rejected'
  };

  constructor(private assuranceService: AssuranceService) {}

  ngOnInit(): void {
    this.loadRemboursements();
  }

  loadRemboursements(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.assuranceService.getAllRemboursements().subscribe({
      next: (data) => {
        this.remboursements = data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to load reimbursements.';
        this.loading = false;
      }
    });
  }

  updateStatus(remboursement: Remboursement, statut: StatutRemboursement): void {
    const payload: Remboursement = { ...remboursement, statut };

    this.assuranceService.updateRemboursement(payload).subscribe({
      next: () => {
        remboursement.statut = statut;
        this.successMessage = 'Reimbursement status updated successfully.';
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to update this reimbursement.';
      }
    });
  }

  get completedCount(): number {
    return this.remboursements.filter((r) => r.statut === 'EFFECTUE').length;
  }

  get pendingCount(): number {
    return this.remboursements.filter((r) => r.statut === 'EN_ATTENTE').length;
  }

  get rejectedCount(): number {
    return this.remboursements.filter((r) => r.statut === 'REJETE').length;
  }

  get totalAmount(): number {
    return this.remboursements
      .filter((r) => r.statut === 'EFFECTUE')
      .reduce((sum, r) => sum + Number(r.montant || 0), 0);
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'EFFECTUE':
        return 'badge-completed';

      case 'EN_ATTENTE':
        return 'badge-pending';

      case 'REJETE':
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
}