import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CampingService } from '../services/camping.service';
import { UpdateSiteBooking } from '../models/booking.model';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.css'
})
export class MyBookingsComponent implements OnInit {
  bookings: UpdateSiteBooking[] = [];
  filteredBookings: UpdateSiteBooking[] = [];
  paginatedBookings: UpdateSiteBooking[] = [];

  isLoading = false;
  errorMessage = '';
  searchTerm = '';

  currentPage = 1;
  itemsPerPage = 4;

  constructor(private campingService: CampingService) {}

  ngOnInit(): void {
    this.loadMyBookings();
  }

  loadMyBookings(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.campingService.getMyBookings().subscribe({
      next: (data) => {
        this.bookings = [...data].filter((booking) => booking.statut !== 'PENDING')
        .sort(
            (a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime()
        ).reverse();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Failed to load your bookings.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredBookings = this.bookings.filter((booking) => {
      const siteName = booking.siteCamping?.nom?.toLowerCase() || '';
      const location = booking.siteCamping?.localisation?.toLowerCase() || '';
      const status = booking.statut?.toLowerCase() || '';

      return (
        !term ||
        siteName.includes(term) ||
        location.includes(term) ||
        status.includes(term)
      );
    });

    this.currentPage = 1;
    this.updatePaginatedBookings();
  }

  updatePaginatedBookings(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBookings = this.filteredBookings.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedBookings();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedBookings();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedBookings();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredBookings.length / this.itemsPerPage) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
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