import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { CampingService } from '../../services/camping.service';

@Component({
  selector: 'app-booking-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './booking-payment-success.component.html',
  styleUrl: './booking-payment-success.component.css'
})
export class BookingPaymentSuccessComponent implements OnInit {
  inscriptionId: number | null = null;
  sessionId = '';
  isConfirming = true;
  confirmationSuccess = false;

  constructor(
    private router: Router,
    private campingService: CampingService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe({
      next: (params) => {
        const paymentStatus = params['payment'];
        const inscriptionIdParam = params['inscriptionId'];
        const sessionIdParam = params['session_id'];

        this.sessionId = sessionIdParam || '';
        this.inscriptionId = inscriptionIdParam ? Number(inscriptionIdParam) : null;

        if (paymentStatus === 'success' && this.inscriptionId) {
          this.confirmBookingPayment(this.inscriptionId);
        } else {
          this.isConfirming = false;
          this.confirmationSuccess = false;

          Swal.fire({
            icon: 'error',
            title: 'Invalid Payment Return',
            text: 'Missing payment information. Please check your bookings.',
            confirmButtonColor: '#96952f',
            background: '#f5f5f3',
            color: '#172b44'
          });
        }
      },
      error: () => {
        this.isConfirming = false;
        this.confirmationSuccess = false;
      }
    });
  }

  confirmBookingPayment(id: number): void {
    this.isConfirming = true;

    this.campingService.confirmPayment(id).subscribe({
      next: () => {
        this.isConfirming = false;
        this.confirmationSuccess = true;

        Swal.fire({
          icon: 'success',
          title: 'Payment Successful',
          text: 'Your booking is now confirmed.',
          confirmButtonColor: '#96952f',
          background: '#f5f5f3',
          color: '#172b44'
        });
      },
      error: () => {
        this.isConfirming = false;
        this.confirmationSuccess = false;

        Swal.fire({
          icon: 'error',
          title: 'Confirmation Failed',
          text: 'Payment succeeded but booking confirmation failed.',
          confirmButtonColor: '#96952f',
          background: '#f5f5f3',
          color: '#172b44'
        });
      }
    });
  }

  downloadInvoice(): void {
    if (!this.inscriptionId) return;

    this.campingService.downloadInvoice(this.inscriptionId).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `invoice-${this.inscriptionId}.pdf`);
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Invoice Download Failed',
          text: 'Could not download the invoice.',
          confirmButtonColor: '#96952f',
          background: '#f5f5f3',
          color: '#172b44'
        });
      }
    });
  }

  downloadTicket(): void {
    if (!this.inscriptionId) return;

    this.campingService.downloadTicket(this.inscriptionId).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `ticket-${this.inscriptionId}.pdf`);
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Ticket Download Failed',
          text: 'Could not download the ticket.',
          confirmButtonColor: '#96952f',
          background: '#f5f5f3',
          color: '#172b44'
        });
      }
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  goToMyBookings(): void {
    this.router.navigate(['/public/my-bookings']);
  }
}