import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AssuranceService } from '../../../../core/services/assurance.service';
import { SouscriptionAssurance, STATUT_SOUSCRIPTION_LABELS } from '../../../../core/models/assurance.models';


@Component({
  selector: 'app-mes-souscriptions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mes-souscriptions.component.html',
  styleUrls: ['./mes-souscriptions.component.css']
})
export class MesSouscriptionsComponent implements OnInit {
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

    this.assuranceService.getMySouscriptions().subscribe({
      next: (data) => {
        this.souscriptions = data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de charger vos souscriptions.';
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
        return 'badge-expiree';
      default:
        return 'badge-pending';
    }
  }
}