import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { withAutoCloseAlert } from '../../../core/utils/auto-close-alert.util';
import { CampingService } from '../../public/services/camping.service';
import { UpdateSiteBooking } from '../../public/models/booking.model';
import { CampingNavbarComponent } from '../camping-sites/camping-navbar/camping-navbar.component';

@Component({
  selector: 'app-site-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, CampingNavbarComponent],
  templateUrl: './site-bookings.component.html',
  styleUrl: './site-bookings.component.css'
})
export class SiteBookingsComponent implements OnInit {
  bookings: UpdateSiteBooking[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private campingService: CampingService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.campingService.getAllBookings().subscribe({
      next: (res) => {
        this.bookings = res as UpdateSiteBooking[];
        this.isLoading = false;
      },
      error: (error: unknown) => {
        console.error(error);
        this.errorMessage = 'Failed to load bookings.';
        this.isLoading = false;
      }
    });
  }

  updateStatus(
    booking: UpdateSiteBooking,
    newStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  ): void {
    if (!booking.idInscription) {
      return;
    }

    const updatedBooking: UpdateSiteBooking = {
      ...booking,
      statut: newStatus
    };

    this.campingService.updateBooking(booking.idInscription, updatedBooking).subscribe({
      next: () => {
        booking.statut = newStatus;

        void Swal.fire(withAutoCloseAlert({
          icon: 'success',
          title: 'Updated',
          text: `Booking status changed to ${newStatus}.`,
          confirmButtonColor: '#96952f',
          background: '#f5f5f3',
          color: '#172b44',
          customClass: {
            popup: 'custom-swal-popup'
          }
        }));
      },
      error: (error: unknown) => {
        console.error(error);

        void Swal.fire(withAutoCloseAlert({
          icon: 'error',
          title: 'Update Failed',
          text: 'Could not update booking status.',
          confirmButtonColor: '#96952f',
          background: '#f5f5f3',
          color: '#172b44',
          customClass: {
            popup: 'custom-swal-popup'
          }
        }));
      }
    });
  }
}
