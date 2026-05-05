import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { LivraisonService } from '../../../../core/services/livraison.service';
import {
  LivraisonResponse,
  LivreurResponse
} from '../../../../models/livraison.model';

@Component({
  selector: 'app-admin-livraison-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-livraison-detail.component.html',
  styleUrl: './admin-livraison-detail.component.css'
})
export class AdminLivraisonDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private livraisonService = inject(LivraisonService);

  livraison: LivraisonResponse | null = null;
  livreurs: LivreurResponse[] = [];

  selectedLivreurId: number | null = null;

  loading = false;
  assigning = false;
  cancelling = false;

  errorMessage = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || Number.isNaN(id)) {
      this.errorMessage = 'Invalid delivery id';
      return;
    }

    this.loadLivraison(id);
    this.loadLivreurs();
  }

  loadLivraison(id: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.livraisonService.getLivraisonById(id).subscribe({
      next: (data) => {
        this.livraison = data;
        this.selectedLivreurId = data.livreurId || null;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while loading delivery details';

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
        console.error('Error while loading livreurs', err);
      }
    });
  }

  getLivreurDisplayName(livreur: LivreurResponse): string {
    return `${livreur.prenom || ''} ${livreur.nom || ''}`.trim() || livreur.email;
  }

  getInitials(): string {
    if (!this.livraison) return 'D';

    const first = this.livraison.livreurPrenom?.charAt(0) || '';
    const last = this.livraison.livreurNom?.charAt(0) || '';

    return (first + last).toUpperCase() || 'D';
  }

  canEdit(): boolean {
    if (!this.livraison) return false;

    return this.livraison.statut !== 'LIVREE' && this.livraison.statut !== 'ANNULEE';
  }

  assignLivreur(): void {
    if (!this.livraison) return;

    if (!this.selectedLivreurId || this.selectedLivreurId <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Select a livreur',
        text: 'Please select a delivery person before saving.'
      });
      return;
    }

    Swal.fire({
      icon: 'question',
      title: this.livraison.livreurId ? 'Reassign delivery?' : 'Assign delivery?',
      text: `Confirm assignment for delivery #${this.livraison.idLivraison}.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, save',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#1f3d2b',
      cancelButtonColor: '#8f2525'
    }).then((result) => {
      if (!result.isConfirmed || !this.livraison) return;

      this.assigning = true;

      this.livraisonService
        .assignLivreur(this.livraison.idLivraison, {
          livreurId: this.selectedLivreurId!
        })
        .subscribe({
          next: (updated) => {
            this.livraison = updated;
            this.selectedLivreurId = updated.livreurId || null;
            this.assigning = false;

            Swal.fire({
              icon: 'success',
              title: 'Saved',
              text: 'Delivery person updated successfully.',
              timer: 1800,
              showConfirmButton: false
            });
          },
          error: (err) => {
            this.assigning = false;

            Swal.fire({
              icon: 'error',
              title: 'Assignment failed',
              text:
                err?.error?.message ||
                err?.error ||
                'Error while assigning delivery person'
            });
          }
        });
    });
  }

cancelLivraison(): void {
  if (!this.livraison) return;

  Swal.fire({
    icon: 'warning',
    title: 'Cancel delivery?',
    text: `Delivery #${this.livraison.idLivraison} will be marked as cancelled.`,
    showCancelButton: true,
    confirmButtonText: 'Yes, cancel it',
    cancelButtonText: 'No',
    confirmButtonColor: '#8f2525',
    cancelButtonColor: '#1f3d2b'
  }).then((result) => {
    if (!result.isConfirmed || !this.livraison) return;

    this.cancelling = true;

    this.livraisonService.updateStatus(this.livraison.idLivraison, {
      statut: 'ANNULEE'
    }).subscribe({
      next: (updated) => {
        this.livraison = updated;
        this.cancelling = false;

        Swal.fire({
          icon: 'success',
          title: 'Cancelled',
          text: 'Delivery has been cancelled.',
          timer: 1800,
          showConfirmButton: false
        });
      },
      error: (err) => {
        this.cancelling = false;

        Swal.fire({
          icon: 'error',
          title: 'Cancellation failed',
          text:
            err?.error?.message ||
            err?.error ||
            'Error while cancelling delivery'
        });
      }
    });
  });
}

  goBack(): void {
    this.router.navigate(['/admin/livraison/all']);
  }
}