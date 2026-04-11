import { Component , OnInit } from '@angular/core';
import { ReclamationService } from './reclamation.service';
import { Reclamation } from '../models/reclamation.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reclamation-admin-list',
  standalone: true, // important pour utiliser imports ici
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reclamation-admin-list.component.html',
  styleUrls: ['./reclamation-admin-list.component.css']
})
export class ReclamationAdminListComponent implements OnInit {

  reclamations: Reclamation[] = [];
  loading = false;
  errorMessage = '';

  constructor(private reclamationService: ReclamationService) {}

  ngOnInit(): void {
    this.loadReclamations();
  }

  loadReclamations(): void {
    this.loading = true;
    this.reclamationService.getAllReclamations().subscribe({
      next: (data) => {
      console.log('reclamations =', data);
        this.reclamations = data;
        this.loading = false;
      },
      error: (err) => {
      console.error('erreur reclamations =', err);
        this.errorMessage = 'Failed to load reclamations.';
        this.loading = false;
      }
    });
  }

  deleteReclamation(id: number): void {
    if (confirm('Are you sure you want to delete this reclamation?')) {
      this.reclamationService.deleteReclamation(id).subscribe({
        next: () => this.loadReclamations(),
        error: () => {
          this.errorMessage = 'Failed to delete reclamation.';
        }
      });
    }
  }

  changerStatut(id: number, statut: string) {
    this.reclamationService.changeStatut(id, statut).subscribe({
      next: () => {
        this.loadReclamations();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'EN_ATTENTE':
        return 'pending';
      case 'EN_COURS':
        return 'progress';
      case 'RESOLUE':
        return 'resolved';
      case 'REJETEE':
        return 'rejected';
      default:
        return '';
    }
  }

  countByStatus(status: string): number {
    return this.reclamations.filter(r => r.statut === status).length;
  }
}