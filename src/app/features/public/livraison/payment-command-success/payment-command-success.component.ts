import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LivraisonService } from '../../../../core/services/livraison.service';

@Component({
  selector: 'app-payment-command-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-command-success.component.html',
  styleUrl: './payment-command-success.component.css'
})
export class PaymentCommandSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private livraisonService = inject(LivraisonService);

  loading = true;
  successMessage = '';
  errorMessage = '';

  livraisonId: number | null = null;

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (!sessionId) {
      this.loading = false;
      this.errorMessage = 'Missing payment session.';
      return;
    }

    this.livraisonService.confirmStripePayment(sessionId).subscribe({
      next: (livraison) => {
        this.livraisonId = livraison.idLivraison;
        this.successMessage = 'Payment confirmed. Your delivery has been created successfully.';
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Payment was successful, but delivery confirmation failed.';
        this.loading = false;
      }
    });
  }
}