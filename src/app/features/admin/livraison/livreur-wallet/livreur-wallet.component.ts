import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { LivraisonService } from '../../../../core/services/livraison.service';

@Component({
  selector: 'app-livreur-wallet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './livreur-wallet.component.html',
  styleUrl: './livreur-wallet.component.css'
})
export class LivreurWalletComponent implements OnInit {
  private livraisonService = inject(LivraisonService);

  wallet: any = null;
  tips: any[] = [];
  withdrawHistory: any[] = [];

  loading = false;
  errorMessage = '';

  totalTips = 0;
  avgRating = 0;
  totalWithdrawn = 0;

  ngOnInit(): void {
    this.loadWallet();
    this.loadTips();
    this.loadWithdrawHistory();
  }

  loadWallet(): void {
    this.loading = true;

    this.livraisonService.getMyLivreurWallet().subscribe({
      next: (res) => {
        this.wallet = res;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load wallet';
        this.loading = false;
      }
    });
  }

  loadTips(): void {
    this.livraisonService.getMyLivreurTips().subscribe({
      next: (data) => {
        this.tips = data || [];
        this.totalTips = this.tips.reduce((sum, t) => sum + (t.amount || 0), 0);

        const ratings = this.tips.filter(t => t.rating);
        this.avgRating = ratings.length
          ? ratings.reduce((sum, t) => sum + t.rating, 0) / ratings.length
          : 0;
      },
      error: () => {
        this.tips = [];
      }
    });
  }

  loadWithdrawHistory(): void {
    this.livraisonService.getMyWithdrawHistory().subscribe({
      next: (data) => {
        this.withdrawHistory = data || [];
        this.totalWithdrawn = this.withdrawHistory.reduce(
          (sum, w) => sum + (w.amount || 0),
          0
        );
      },
      error: () => {
        this.withdrawHistory = [];
      }
    });
  }

  getStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}