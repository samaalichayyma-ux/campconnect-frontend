import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CampingSite } from '../models/camping-site.model';
import { SiteBooking } from '../models/booking.model';
import { CampingService } from '../services/camping.service';

@Component({
  selector: 'app-site-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './site-booking.component.html',
  styleUrl: './site-booking.component.css'
})
export class SiteBookingComponent implements OnInit {
  selectedSite?: CampingSite;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  bookingForm: SiteBooking = {
    dateDebut: '',
    dateFin: '',
    numberOfGuests: 1,
    statut: 'PENDING',
    siteCamping: {} as CampingSite
  };

  constructor(
    private route: ActivatedRoute,
    private campingService: CampingService
  ) {}

  ngOnInit(): void {
    const siteId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSelectedSite(siteId);
  }

  loadSelectedSite(siteId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.campingService.getCampingSiteById(siteId).subscribe({
      next: (site) => {
        this.selectedSite = site;
        this.bookingForm.siteCamping = site;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load camping site.';
        this.isLoading = false;
        console.error(error);
      }
    });
  }

  onSubmit(): void {
    if (!this.selectedSite) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.campingService.createBooking(this.bookingForm).subscribe({
      next: (response) => {
        this.successMessage = 'Booking created successfully.';
        console.log('Booking created:', response);

        this.bookingForm = {
          dateDebut: '',
          dateFin: '',
          numberOfGuests: 1,
          statut: 'PENDING',
          siteCamping: this.selectedSite as CampingSite
        };
      },
      error: (error) => {
        this.errorMessage = 'Failed to create booking.';
        console.error('Booking error:', error);
      }
    });
  }
}