import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import Swal from 'sweetalert2';
import { LivraisonService } from '../../../../core/services/livraison.service';

@Component({
  selector: 'app-admin-livreur-wallets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-livreur-wallets.component.html',
  styleUrl: './admin-livreur-wallets.component.css'
})
export class AdminLivreurWalletsComponent implements OnInit {
  private livraisonService = inject(LivraisonService);

  wallets: any[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadWallets();
  }

  loadWallets(): void {
    this.loading = true;

    this.livraisonService.getAllLivreurWallets().subscribe({
      next: (data) => {
        this.wallets = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;

        Swal.fire({
          icon: 'error',
          title: 'Loading failed',
          text: err?.error?.message || err?.error || 'Could not load wallets'
        });
      }
    });
  }

  markAsPaid(livreurId: number, balance: number): void {
    if (!balance || balance <= 0) {
      Swal.fire({
        icon: 'info',
        title: 'Nothing to pay',
        text: 'This livreur wallet is already empty.'
      });
      return;
    }

    Swal.fire({
      icon: 'warning',
      title: 'Mark wallet as paid?',
      text: `Confirm you manually paid ${balance.toFixed(2)} DT to this livreur.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, mark as paid',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#1f3d2b',
      cancelButtonColor: '#8f2525'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.livraisonService.markLivreurWalletAsPaid(livreurId).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Wallet paid',
            text: 'Wallet balance has been reset to 0.',
            timer: 1800,
            showConfirmButton: false
          });

          this.loadWallets();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Payment update failed',
            text: err?.error?.message || err?.error || 'Could not mark wallet as paid'
          });
        }
      });
    });
  }
}