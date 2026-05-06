import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AssuranceService } from '../../../../core/services/assurance.service';
import { Assurance } from '../../../../core/models/assurance.models';

@Component({
  selector: 'app-agent-assurance-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './agent-assurance-list.component.html',
  styleUrls: ['./agent-assurance-list.component.scss']
})
export class AgentAssuranceListComponent implements OnInit {
  assurances: Assurance[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private assuranceService: AssuranceService) {}

  ngOnInit(): void {
    this.loadAssurances();
  }

  loadAssurances(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.assuranceService.getAllAssurances().subscribe({
      next: (data) => {
        this.assurances = data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to load insurance offers.';
        this.loading = false;
      }
    });
  }

  deleteAssurance(id?: number): void {
    if (!id) return;

    const confirmed = confirm('Are you sure you want to delete this insurance offer?');
    if (!confirmed) return;

    this.assuranceService.deleteAssurance(id).subscribe({
      next: () => {
        this.successMessage = 'Insurance offer deleted successfully.';
        this.loadAssurances();
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to delete this insurance offer.';
      }
    });
  }

  get activeCount(): number {
    return this.assurances.filter((assurance) => assurance.active).length;
  }

  get inactiveCount(): number {
    return this.assurances.filter((assurance) => !assurance.active).length;
  }

  getTypeLabel(type?: string): string {
    switch (type) {
      case 'ANNULATION':
        return 'Cancellation';
      case 'ACCIDENT':
        return 'Accident';
      case 'RESPONSABILITE_CIVILE':
        return 'Civil Liability';
      case 'VOL_EQUIPEMENT':
        return 'Equipment Theft';
      case 'DOMMAGE_MATERIEL':
        return 'Material Damage';
      case 'ASSISTANCE_VOYAGE':
        return 'Travel Assistance';
      default:
        return type || 'Insurance';
    }
  }
}