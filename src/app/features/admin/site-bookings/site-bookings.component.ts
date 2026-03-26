import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampingService } from '../../public/services/camping.service';
import Swal from 'sweetalert2';
import { CampingNavbarComponent } from '../camping-sites/camping-navbar/camping-navbar.component';
import { SiteBooking } from '../../public/models/booking.model';


@Component({
  selector: 'app-site-bookings',
  standalone: true,
  imports: [CommonModule, CampingNavbarComponent],
  templateUrl: './site-bookings.component.html',
  styleUrl: './site-bookings.component.css'
})
export class SiteBookingsComponent implements OnInit {
  bookings: SiteBooking[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private campingService: CampingService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;

    this.campingService.getAllBookings().subscribe({
      next: (data) => {
        this.bookings = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Failed to load bookings.';
        this.isLoading = false;
      }
    });
  }

  updateStatus(booking: SiteBooking, status: string) {
    booking.statut = status as any;

    this.campingService.updateBooking(booking.idInscription!, booking).subscribe({
      next: () => {
        Swal.fire('Updated!', 'Booking status updated.', 'success');
      },
      error: () => {
        Swal.fire('Error', 'Failed to update booking.', 'error');
      }
    });
  }
}