import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LivraisonService } from '../../../../core/services/livraison.service';
import {
  LivraisonResponse,
  LivreurResponse
} from '../../../../models/livraison.model';

@Component({
  selector: 'app-livraison-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './livraison-list.component.html',
  styleUrl: './livraison-list.component.css'
})
export class LivraisonListComponent implements OnInit {
  private livraisonService = inject(LivraisonService);

  livraisons: LivraisonResponse[] = [];
  livreurs: LivreurResponse[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';

  livreurInputs: Record<number, number | null> = {};

  ngOnInit(): void {
    this.loadLivraisons();
    this.loadLivreurs();
  }

  loadLivraisons(): void {
    this.loading = true;
    this.errorMessage = '';

    this.livraisonService.getAllLivraisons().subscribe({
      next: (data) => {
        this.livraisons = data.reverse();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while loading deliveries';
        this.loading = false;
      }
    });
  }

  loadLivreurs(): void {
    this.livraisonService.getLivreurs().subscribe({
      next: (data) => {
        this.livreurs = data;
      },
      error: (err) => {
        console.error('Error while loading delivery people', err);
      }
    });
  }

  getLivreurDisplayName(livreur: LivreurResponse): string {
    return `${livreur.prenom || ''} ${livreur.nom || ''}`.trim() || livreur.email;
  }

  getInitials(livraison: LivraisonResponse): string {
    const first = livraison.livreurPrenom?.charAt(0) || '';
    const last = livraison.livreurNom?.charAt(0) || '';
    return (first + last).toUpperCase() || 'D';
  }

  assignLivreur(livraisonId: number): void {
    const livreurId = this.livreurInputs[livraisonId];

    if (!livreurId || livreurId <= 0) {
      this.errorMessage = 'Please select a delivery person';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.livraisonService.assignLivreur(livraisonId, { livreurId }).subscribe({
      next: () => {
        this.successMessage = `Delivery person assigned successfully to delivery #${livraisonId}`;
        this.livreurInputs[livraisonId] = null;
        this.loadLivraisons();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while assigning delivery person';
      }
    });
  }
}