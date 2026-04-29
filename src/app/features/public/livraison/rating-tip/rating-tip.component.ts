import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LivraisonService } from '../../../../core/services/livraison.service';

@Component({
  selector: 'app-rating-tip',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rating-tip.component.html',
  styleUrl: './rating-tip.component.css'
})
export class RatingTipComponent implements OnInit {
  private livraisonService = inject(LivraisonService);

  @Input() livraisonId!: number;
  @Input() statut = '';

  rating = 0;
  tipAmount = 0;
  comment = '';

  tipOptions = [2, 5, 10];
  tipHistory: any[] = [];

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadTipHistory();
  }

  get alreadyRatedOrTipped(): boolean {
    return this.tipHistory.length > 0;
  }

  setRating(value: number): void {
    this.rating = value;
  }

  selectTip(amount: number): void {
    this.tipAmount = amount;
  }

  submit(): void {
    if (this.alreadyRatedOrTipped) {
      this.errorMessage = 'You already rated/tipped this delivery';
      return;
    }

    if (this.statut !== 'LIVREE') {
      this.errorMessage = 'You can only rate and tip after delivery is completed';
      return;
    }

    if (this.rating < 1) {
      this.errorMessage = 'Please select a rating';
      return;
    }

    if (!this.tipAmount || this.tipAmount <= 0) {
      this.errorMessage = 'Please select or enter a tip amount';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      rating: this.rating,
      amount: this.tipAmount,
      comment: this.comment.trim()
    };

    this.livraisonService.createTipPaymentSession(this.livraisonId, payload).subscribe({
      next: (res) => {
        window.location.href = res.checkoutUrl;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while creating Stripe tip payment';
      }
    });
  }

  loadTipHistory(): void {
    if (!this.livraisonId) return;

    this.livraisonService.getLivreurTipHistory(this.livraisonId).subscribe({
      next: (data) => {
        this.tipHistory = data || [];
      },
      error: () => {
        this.tipHistory = [];
      }
    });
  }
}