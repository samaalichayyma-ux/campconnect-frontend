import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AssuranceService } from '../../../../core/services/assurance.service';
import { Assurance, TYPE_ASSURANCE_LABELS } from '../../../../core/models/assurance.models';

@Component({
  selector: 'app-assurance-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assurance-list.component.html',
  styleUrls: ['./assurance-list.component.css']
})
export class AssuranceListComponent implements OnInit {
  assurances: Assurance[] = [];
  filteredAssurances: Assurance[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';

  readonly typeLabels = TYPE_ASSURANCE_LABELS;

  constructor(private assuranceService: AssuranceService) {}

  ngOnInit(): void {
    this.loadAssurances();
  }

  loadAssurances(): void {
    this.loading = true;
    this.errorMessage = '';

    this.assuranceService.getAllAssurances().subscribe({
      next: (data) => {
        this.assurances = data.filter(item => item.active);
        this.filteredAssurances = [...this.assurances];
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de charger les assurances.';
        this.loading = false;
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchTerm = value;

    this.filteredAssurances = this.assurances.filter((assurance) =>
      assurance.titre.toLowerCase().includes(value) ||
      assurance.description.toLowerCase().includes(value) ||
      this.typeLabels[assurance.typeAssurance]?.toLowerCase().includes(value)
    );
  }
}