import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LivraisonService } from '../../../../core/services/livraison.service';
import {
  AvailableOrderForLivraisonResponse,
  LivraisonCreateRequest
} from '../../../../models/livraison.model';

@Component({
  selector: 'app-available-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './available-orders.component.html',
  styleUrl: './available-orders.component.css'
})
export class AvailableOrdersComponent implements OnInit {
  private livraisonService = inject(LivraisonService);

  classicOrders: AvailableOrderForLivraisonResponse[] = [];
  repasOrders: AvailableOrderForLivraisonResponse[] = [];

  loading = false;
  successMessage = '';
  errorMessage = '';

  selectedOrder: AvailableOrderForLivraisonResponse | null = null;

  adresseLivraison = '';
  commentaire = '';

  ngOnInit(): void {
    this.loadAvailableOrders();
  }

  getClientName(order: AvailableOrderForLivraisonResponse | null): string {
  if (!order) {
    return 'Unknown client';
  }

  return order.clientNom || order.clientEmail || `Client #${order.clientId}`;
}

getClientInitial(order: AvailableOrderForLivraisonResponse | null): string {
  return this.getClientName(order).charAt(0).toUpperCase();
}
  loadAvailableOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    this.livraisonService.getAvailableClassicOrders().subscribe({
      next: (classicData) => {
        this.classicOrders = classicData;

        this.livraisonService.getAvailableRepasOrders().subscribe({
          next: (repasData) => {
            this.repasOrders = repasData;
            this.loading = false;
          },
          error: (err) => {
            this.errorMessage =
              err?.error?.message ||
              err?.error ||
              'Error while loading food orders';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while loading classic orders';
        this.loading = false;
      }
    });
  }

  openCreateForm(order: AvailableOrderForLivraisonResponse): void {
    this.selectedOrder = order;
    this.adresseLivraison = '';
    this.commentaire = '';
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelCreate(): void {
    this.selectedOrder = null;
    this.adresseLivraison = '';
    this.commentaire = '';
  }

  canCreateDelivery(order: AvailableOrderForLivraisonResponse): boolean {
  return order.statut === 'PAYEE';
}

  createDelivery(): void {
    if (!this.selectedOrder) {
      return;
    }

    if (!this.adresseLivraison || this.adresseLivraison.trim().length < 3) {
      this.errorMessage = 'Delivery address is required';
      return;
    }

    const payload: LivraisonCreateRequest = {
      commandeId: this.selectedOrder.commandeId,
      typeCommande: this.selectedOrder.typeCommande,
      adresseLivraison: this.adresseLivraison.trim(),
      commentaire: this.commentaire?.trim() || ''
    };

    this.livraisonService.createLivraison(payload).subscribe({
      next: (response) => {
        this.successMessage = `Delivery created successfully #${response.idLivraison}`;
        this.selectedOrder = null;
        this.adresseLivraison = '';
        this.commentaire = '';
        this.loadAvailableOrders();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while creating delivery';
      }
    });
  }
}