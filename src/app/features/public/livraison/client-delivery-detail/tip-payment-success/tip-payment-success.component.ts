import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { LivraisonService } from '../../../../../core/services/livraison.service';

@Component({
  selector: 'app-tip-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tip-payment-success.component.html',
  styleUrl: './tip-payment-success.component.css'
})
export class TipPaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private livraisonService = inject(LivraisonService);

  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (!sessionId) {
      this.loading = false;
      this.errorMessage = 'Missing Stripe session ID.';
      return;
    }

    this.livraisonService.confirmTipPayment(sessionId).subscribe({
      next: () => {
        this.loading = false;

        Swal.fire({
          icon: 'success',
          title: 'Thank you!',
          text: 'Your tip and rating were saved successfully.',
          timer: 2200,
          showConfirmButton: false
        });

        setTimeout(() => {
          this.router.navigate(['/public/my-deliveries']);
        }, 2200);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Payment succeeded, but saving the tip failed.';

        Swal.fire({
          icon: 'error',
          title: 'Confirmation failed',
          text: this.errorMessage
        });
      }
    });
  }
}