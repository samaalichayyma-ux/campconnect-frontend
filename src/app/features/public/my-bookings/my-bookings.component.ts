import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CampingService } from '../services/camping.service';
import { UpdateSiteBooking } from '../models/booking.model';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.css'
})
export class MyBookingsComponent implements OnInit {
  bookings: UpdateSiteBooking[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private campingService: CampingService) {}

  ngOnInit(): void {
    this.loadMyBookings();
  }

  loadMyBookings(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.campingService.getMyBookings().subscribe({
      next: (data) => {
        this.bookings = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Failed to load your bookings.';
        this.isLoading = false;
      }
    });
  }

  getNumberOfNights(dateDebut: string, dateFin: string): number {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);

    const diff = end.getTime() - start.getTime();
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  }

  getTotalPrice(booking: UpdateSiteBooking): number {
    const nights = this.getNumberOfNights(booking.dateDebut, booking.dateFin);
    const pricePerNight = booking.siteCamping?.prixParNuit ?? 0;
    return nights * booking.numberOfGuests * pricePerNight;
  }
}