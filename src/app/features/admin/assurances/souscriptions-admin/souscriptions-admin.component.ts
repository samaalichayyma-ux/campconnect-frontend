import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssuranceService } from '../../../../core/services/assurance.service';
import {
  SouscriptionAssurance,
  STATUT_SOUSCRIPTION_LABELS
} from '../../../../core/models/assurance.models';

@Component({
  selector: 'app-souscriptions-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './Souscriptions-admin.component.html',
  styleUrls: ['./Souscriptions-admin.component.css']
})
export class SouscriptionsAdminComponent implements OnInit {
  souscriptions: SouscriptionAssurance[] = [];
  loading = false;
  errorMessage = '';

  readonly statusLabels = STATUT_SOUSCRIPTION_LABELS;

  constructor(private assuranceService: AssuranceService) {}

  ngOnInit(): void {
    this.loadSouscriptions();
  }

  loadSouscriptions(): void {
    this.loading = true;
    this.errorMessage = '';

    this.assuranceService.getAllSouscriptions().subscribe({
      next: (data) => {
        this.souscriptions = data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de charger les souscriptions.';
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'ACTIVE':
        return 'badge-active';
      case 'EN_ATTENTE':
      case 'SUSPENDUE':
        return 'badge-en-attente';
      case 'ANNULEE':
      case 'EXPIREE':
        return 'badge-rejete';
      default:
        return 'badge-pending';
    }
  }
}