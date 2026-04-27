import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AssuranceService } from '../../../../core/services/assurance.service';
import { Assurance, TYPE_ASSURANCE_LABELS } from '../../../../core/models/assurance.models';

@Component({
  selector: 'app-admin-assurance-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assurance-list-admin.component.html',
  styleUrls: ['./assurance-list-admin.component.css']
})
export class AssuranceListComponent implements OnInit {
  assurances: Assurance[] = [];
  loading = false;
  errorMessage = '';

  readonly typeLabels = TYPE_ASSURANCE_LABELS;

  constructor(private assuranceService: AssuranceService) {}

  ngOnInit(): void {
    this.loadAssurances();
  }

  loadAssurances(): void {
    this.loading = true;
    this.assuranceService.getAllAssurances().subscribe({
      next: (data) => {
        this.assurances = data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de charger les offres.';
        this.loading = false;
      }
    });
  }

  deleteAssurance(id?: number): void {
    if (!id) return;

    const confirmed = confirm('Supprimer cette assurance ?');
    if (!confirmed) return;

    this.assuranceService.deleteAssurance(id).subscribe({
      next: () => this.loadAssurances(),
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Suppression impossible.';
      }
    });
  }
}