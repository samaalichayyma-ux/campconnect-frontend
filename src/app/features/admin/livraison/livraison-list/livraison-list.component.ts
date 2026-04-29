import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { LivraisonService } from '../../../../core/services/livraison.service';
import {
  LivraisonResponse,
  LivreurResponse,
  StatutLivraison
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
        this.livraisons = [...data].reverse();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while loading deliveries';

        Swal.fire({
          icon: 'error',
          title: 'Loading failed',
          text: this.errorMessage
        });

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
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text:
            err?.error?.message ||
            err?.error ||
            'Error while loading delivery people'
        });
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
      Swal.fire({
        icon: 'warning',
        title: 'Select a delivery person',
        text: 'Please choose a livreur before assigning.'
      });
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    Swal.fire({
      title: 'Assign delivery person?',
      text: `Are you sure you want to assign this livreur to delivery #${livraisonId}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, assign',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#1f3d2b',
      cancelButtonColor: '#8f2525'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.livraisonService.assignLivreur(livraisonId, { livreurId }).subscribe({
        next: () => {
          this.successMessage = `Delivery person assigned successfully to delivery #${livraisonId}`;
          this.livreurInputs[livraisonId] = null;
          this.loadLivraisons();

          Swal.fire({
            icon: 'success',
            title: 'Assigned!',
            text: this.successMessage,
            timer: 1800,
            showConfirmButton: false
          });
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.message ||
            err?.error ||
            'Error while assigning delivery person';

          Swal.fire({
            icon: 'error',
            title: 'Assignment failed',
            text: this.errorMessage
          });
        }
      });
    });
  }

  updateStatus(livraisonId: number, statut: StatutLivraison): void {
    this.errorMessage = '';
    this.successMessage = '';

    Swal.fire({
      title: 'Update status?',
      text: `Change delivery #${livraisonId} status to ${statut}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#1f3d2b',
      cancelButtonColor: '#8f2525'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.livraisonService.updateStatus(livraisonId, { statut }).subscribe({
        next: () => {
          this.successMessage = `Status updated to ${statut}`;
          this.loadLivraisons();

          Swal.fire({
            icon: 'success',
            title: 'Status updated!',
            text: this.successMessage,
            timer: 1800,
            showConfirmButton: false
          });
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.message ||
            err?.error ||
            'Error while updating status';

          Swal.fire({
            icon: 'error',
            title: 'Update failed',
            text: this.errorMessage
          });
        }
      });
    });
  }

  cancelLivraison(livraisonId: number): void {
    this.errorMessage = '';
    this.successMessage = '';

    Swal.fire({
      title: 'Cancel delivery?',
      text: `Delivery #${livraisonId} will be marked as cancelled.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No',
      confirmButtonColor: '#8f2525',
      cancelButtonColor: '#1f3d2b'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.livraisonService.updateStatus(livraisonId, { statut: 'ANNULEE' }).subscribe({
        next: () => {
          this.successMessage = `Delivery #${livraisonId} cancelled`;
          this.loadLivraisons();

          Swal.fire({
            icon: 'success',
            title: 'Cancelled!',
            text: this.successMessage,
            timer: 1800,
            showConfirmButton: false
          });
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.message ||
            err?.error ||
            'Error while cancelling delivery';

          Swal.fire({
            icon: 'error',
            title: 'Cancellation failed',
            text: this.errorMessage
          });
        }
      });
    });
  }
}