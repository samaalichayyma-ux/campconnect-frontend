import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssuranceService } from '../../../../core/services/assurance.service';
import {
  Remboursement,
  StatutRemboursement,
  STATUT_REMBOURSEMENT_LABELS
} from '../../../../core/models/assurance.models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-remboursements-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './remboursements-admin.component.html',
  styleUrls: ['./remboursements-admin.component.css']
})
export class RemboursementsAdminComponent implements OnInit {
  remboursements: Remboursement[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  readonly statusLabels = STATUT_REMBOURSEMENT_LABELS;
  readonly statusOptions = Object.values(StatutRemboursement);

  constructor(private assuranceService: AssuranceService) {}

  ngOnInit(): void {
    this.loadRemboursements();
  }

  loadRemboursements(): void {
    this.loading = true;
    this.errorMessage = '';

    this.assuranceService.getAllRemboursements().subscribe({
      next: (data) => {
        this.remboursements = data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de charger les remboursements.';
        this.loading = false;
      }
    });
  }

  updateStatus(remboursement: Remboursement, statut: StatutRemboursement): void {
    const payload: Remboursement = { ...remboursement, statut };

    this.assuranceService.updateRemboursement(payload).subscribe({
      next: () => {
        remboursement.statut = statut;
        this.successMessage = 'Statut du remboursement mis à jour.';
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de mettre à jour le remboursement.';
      }
    });
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'EFFECTUE':
        return 'badge-effectue';
      case 'EN_ATTENTE':
        return 'badge-en-attente';
      case 'REJETE':
        return 'badge-rejete';
      default:
        return 'badge-pending';
    }
  }
}