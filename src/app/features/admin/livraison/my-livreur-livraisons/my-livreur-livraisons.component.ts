import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LivraisonService } from '../../../../core/services/livraison.service';
import {
  LivraisonResponse,
  LivraisonStatusUpdateRequest
} from '../../../../models/livraison.model';

@Component({
  selector: 'app-my-livreur-livraisons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-livreur-livraisons.component.html',
  styleUrl: './my-livreur-livraisons.component.css'
})
export class MyLivreurLivraisonsComponent implements OnInit {
  private livraisonService = inject(LivraisonService);

  livraisons: LivraisonResponse[] = [];
  loading = false;
  successMessage = '';
  errorMessage = '';

  preuveInputs: Record<number, string> = {};
  commentaireInputs: Record<number, string> = {};

  ngOnInit(): void {
    this.loadMyLivraisons();
  }

  loadMyLivraisons(): void {
    this.loading = true;
    this.errorMessage = '';

    this.livraisonService.getMyLivraisons().subscribe({
      next: (data) => {
        this.livraisons = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while loading your deliveries';
        this.loading = false;
      }
    });
  }

  startDelivery(livraisonId: number): void {
    const payload: LivraisonStatusUpdateRequest = {
      statut: 'EN_COURS',
      commentaire: 'Delivery started',
      preuveLivraison: ''
    };

    this.updateDeliveryStatus(livraisonId, payload);
  }

  markAsDelivered(livraisonId: number): void {
    const preuve = this.preuveInputs[livraisonId];

    if (!preuve || preuve.trim().length < 2) {
      this.errorMessage = 'Delivery proof is required';
      return;
    }

    const payload: LivraisonStatusUpdateRequest = {
      statut: 'LIVREE',
      preuveLivraison: preuve.trim(),
      commentaire: this.commentaireInputs[livraisonId]?.trim() || 'Delivered'
    };

    this.updateDeliveryStatus(livraisonId, payload);
  }

  private updateDeliveryStatus(
    livraisonId: number,
    payload: LivraisonStatusUpdateRequest
  ): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.livraisonService.updateStatus(livraisonId, payload).subscribe({
      next: () => {
        this.successMessage = `Delivery #${livraisonId} updated successfully`;
        this.preuveInputs[livraisonId] = '';
        this.commentaireInputs[livraisonId] = '';
        this.loadMyLivraisons();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while updating delivery';
      }
    });
  }

  canStart(livraison: LivraisonResponse): boolean {
    return livraison.statut === 'PLANIFIEE';
  }

  canDeliver(livraison: LivraisonResponse): boolean {
    return livraison.statut === 'EN_COURS';
  }

  isDelivered(livraison: LivraisonResponse): boolean {
    return livraison.statut === 'LIVREE';
  }
}