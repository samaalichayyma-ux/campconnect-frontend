import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
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

  
getUserRole(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || payload.authorities?.[0]?.replace('ROLE_', '');
  } catch {
    return null;
  }
}

loadBookings(): void {
  const role = this.getUserRole();

  if (role === 'GUIDE') {
    this.campingService.getMyCampBookingList().subscribe({
      next: (data) => {
        this.bookings = data;
      },
      error: (error) => {
        console.error(error);
      }
    });
  } else {
    this.campingService.getAllBookings().subscribe({
      next: (data) => {
        this.bookings = data;
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
}
isCancelable(booking: any): boolean {
  return booking.statut === 'PENDING';
}

updateStatus(
  booking: UpdateSiteBooking,
  newStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
): void {
  if (!booking.idInscription) {
    return;
  }

  if (newStatus !== 'CANCELLED') {
    Swal.fire({
      icon: 'warning',
      title: 'Not Allowed',
      text: 'Only cancellation is supported here.',
      confirmButtonColor: '#96952f',
      background: '#f5f5f3',
      color: '#172b44',
      customClass: {
        popup: 'custom-swal-popup'
      }
    });
    return;
  }

  Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to cancel this booking?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, cancel it',
    cancelButtonText: 'No, keep it',
    confirmButtonColor: '#96952f',
    cancelButtonColor: '#9ca3af',
    background: '#f5f5f3',
    color: '#172b44',
    customClass: {
      popup: 'custom-swal-popup'
    }
  }).then((result) => {
    if (!result.isConfirmed) {
      return;
    }

    this.campingService.cancelBooking(booking.idInscription).subscribe({
      next: (updatedBooking: UpdateSiteBooking) => {
        booking.statut = updatedBooking.statut;

        Swal.fire({
          icon: 'success',
          title: 'Cancelled',
          text: 'Booking status changed to CANCELLED.',
          confirmButtonColor: '#96952f',
          background: '#f5f5f3',
          color: '#172b44',
          customClass: {
            popup: 'custom-swal-popup'
          }
        });
      },
      error: (error: unknown) => {
        console.error(error);

        Swal.fire({
          icon: 'error',
          title: 'Cancellation Failed',
          text: 'Could not cancel booking.',
          confirmButtonColor: '#96952f',
          background: '#f5f5f3',
          color: '#172b44',
          customClass: {
            popup: 'custom-swal-popup'
          }
        });
      }
    });
  });
}
}