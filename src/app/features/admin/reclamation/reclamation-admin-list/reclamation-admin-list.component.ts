import { Component, OnInit } from '@angular/core';
import { ReclamationService } from './reclamation.service';
import { Reclamation } from '../models/reclamation.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reclamation-admin-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reclamation-admin-list.component.html',
  styleUrls: ['./reclamation-admin-list.component.css']
})
export class ReclamationAdminListComponent implements OnInit {

  reclamations: Reclamation[] = [];
  loading = false;
  errorMessage = '';

  // Modal
  showModal = false;
  selectedReclamationId: number | null = null;
  selectedStatut = '';
  reductionPourcentage: number | null = null;

  statutOptions = [
    { value: 'EN_COURS', label: 'In Progress' },
    { value: 'RESOLUE',  label: 'Resolved' },
    { value: 'REJETEE',  label: 'Rejected' }
  ];

  constructor(private reclamationService: ReclamationService) {}

  ngOnInit(): void {
    this.loadReclamations();
  }

  loadReclamations(): void {
    this.loading = true;
    this.reclamationService.getAllReclamations().subscribe({
      next: (data) => {
        this.reclamations = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load reclamations.';
        this.loading = false;
      }
    });
  }

  deleteReclamation(id: number): void {
    if (confirm('Are you sure you want to delete this reclamation?')) {
      this.reclamationService.deleteReclamation(id).subscribe({
        next: () => this.loadReclamations(),
        error: () => { this.errorMessage = 'Failed to delete reclamation.'; }
      });
    }
  }

  openStatutModal(reclamation: Reclamation): void {
    this.selectedReclamationId = reclamation.id;
    this.selectedStatut = reclamation.statut;
    this.reductionPourcentage = reclamation.reductionPourcentage ?? null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedReclamationId = null;
    this.reductionPourcentage = null;
  }

  confirmerChangement(): void {
    if (!this.selectedReclamationId || !this.selectedStatut) return;

    this.reclamationService.changeStatut(
      this.selectedReclamationId,
      this.selectedStatut,
      this.reductionPourcentage ?? undefined
    ).subscribe({
      next: () => {
        this.closeModal();
        this.loadReclamations();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to update status.';
      }
    });
  }


  getStatusClass(status: string): string {
    switch (status) {
  
      case 'EN_COURS':
        return 'progress';
      case 'RESOLUE':
        return 'resolved';
      case 'REJETEE':
        return 'rejected';
      default:
        return '';
    }}
  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'RESOLUE':  return 'Resolved';
      case 'EN_COURS': return 'In Progress';
      case 'REJETEE':  return 'Rejected';
      default:         return 'Pending';

    }
  }

  countByStatus(status: string): number {
    return this.reclamations.filter(r => r.statut === status).length;
  }
}