import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { CampingSite } from '../models/camping-site.model';
import { SiteBooking } from '../models/booking.model';
import { CampingService } from '../services/camping.service';

@Component({
  selector: 'app-booking-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-summary.component.html',
  styleUrl: './booking-summary.component.css'
})
export class BookingSummaryComponent implements OnInit {
  selectedSite?: CampingSite;
  bookingData?: SiteBooking;
  totalPrice = 0;
  nights = 0;

  constructor(
    private router: Router,
    private campingService: CampingService
  ) {}

  ngOnInit(): void {
    const state = history.state;

    if (state?.bookingData && state?.selectedSite) {
      this.bookingData = state.bookingData;
      this.selectedSite = state.selectedSite;
      this.totalPrice = state.totalPrice || 0;
      this.nights = state.nights || 0;
    } else {
      this.router.navigate(['/public/camping-sites']);
    }
  }

confirmPayment(): void {
  if (!this.bookingData) return;

  this.campingService.createBooking(this.bookingData).subscribe({
    next: (res) => {
      //  Stripe
      window.location.href = res.checkoutUrl;
    },
    error: (error) => {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Payment Failed',
        text: 'Something went wrong while starting the payment.',
        confirmButtonColor: '#96952f',
        background: '#f5f5f3',
        color: '#172b44'
      });
    }
  });
}

  goBack(): void {
    this.router.navigate(['/public/site-booking', this.selectedSite?.idSite]);
  }
}