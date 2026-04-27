import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AssuranceService } from '../../../../core/services/assurance.service';
import { Assurance, Garantie, TYPE_ASSURANCE_LABELS } from '../../../../core/models/assurance.models';


@Component({
  selector: 'app-assurance-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assurance-details.component.html',
  styleUrls: ['./assurance-details.component.css']
})
export class AssuranceDetailsComponent implements OnInit {
  assuranceId!: number;
  assurance?: Assurance;
  garanties: Garantie[] = [];
  loading = false;
  errorMessage = '';

  readonly typeLabels = TYPE_ASSURANCE_LABELS;

  constructor(
    private route: ActivatedRoute,
    private assuranceService: AssuranceService
  ) {}

  ngOnInit(): void {
  const idParam = this.route.snapshot.paramMap.get('id');
  this.assuranceId = Number(idParam);

  if (!idParam || isNaN(this.assuranceId)) {
    this.errorMessage = 'Identifiant assurance invalide.';
    this.loading = false;
    return;
  }

  this.loadDetails();
}

  loadDetails(): void {
  if (!this.assuranceId || isNaN(this.assuranceId)) {
    this.errorMessage = 'Identifiant assurance invalide.';
    return;
  }

  this.loading = true;
  this.errorMessage = '';

  this.assuranceService.getAssuranceById(this.assuranceId).subscribe({
    next: (assurance) => {
      this.assurance = assurance;
      this.assuranceService.getGarantiesByAssurance(this.assuranceId).subscribe({
        next: (garanties) => {
          this.garanties = garanties;
          this.loading = false;
        },
        error: () => {
          this.garanties = [];
          this.loading = false;
        }
      });
    },
    error: (error) => {
      console.error(error);
      this.errorMessage = 'Impossible de charger le détail de cette assurance.';
      this.loading = false;
    }
  });
}
}