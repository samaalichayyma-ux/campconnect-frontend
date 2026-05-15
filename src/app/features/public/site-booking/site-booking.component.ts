import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { CampingSite } from '../models/camping-site.model';
import { SiteBooking } from '../models/booking.model';
import { SiteAvailability } from '../models/site-availability.model';
import { CampingService } from '../services/camping.service';

import { AvisListComponent } from '../avis/avis-list/avis-list.component';
import { AddAvisComponent } from '../avis/add-avis/add-avis.component';

@Component({
  selector: 'app-site-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, AvisListComponent, AddAvisComponent],
  templateUrl: './site-booking.component.html',
  styleUrl: './site-booking.component.css'
})
export class SiteBookingComponent implements OnInit {
  selectedSite?: CampingSite;
  hoverRating = 0;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  todayString = '';
  availability?: SiteAvailability;
  availabilityLoading = false;

  bookingForm: SiteBooking = {
    dateDebut: '',
    dateFin: '',
    numberOfGuests: 1,
    siteId: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campingService: CampingService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.todayString = today.toISOString().split('T')[0];

    const siteId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSelectedSite(siteId);
  }

  loadSelectedSite(siteId: number): void {
    this.isLoading = true;

    this.campingService.getCampingSiteById(siteId).subscribe({
      next: (site) => {
        this.selectedSite = site;
        this.bookingForm.siteId = site.idSite;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Failed to load camping site.';
        this.isLoading = false;
      }
    });
  }

  onBookingFieldChange(): void {
    this.errorMessage = '';

    if (!this.selectedSite || !this.bookingForm.dateDebut || !this.bookingForm.dateFin) {
      this.availability = undefined;
      return;
    }

    const start = new Date(this.bookingForm.dateDebut);
    const end = new Date(this.bookingForm.dateFin);

    if (end <= start) {
      this.availability = undefined;
      return;
    }

    this.checkAvailability();
  }

  checkAvailability(): void {
    if (!this.selectedSite || !this.bookingForm.dateDebut || !this.bookingForm.dateFin) {
      return;
    }

    this.availabilityLoading = true;

    this.campingService.getSiteAvailability(
      this.selectedSite.idSite,
      this.bookingForm.dateDebut,
      this.bookingForm.dateFin
    ).subscribe({
      next: (data) => {
        this.availability = data;
        this.availabilityLoading = false;

        if (this.bookingForm.numberOfGuests > data.remainingCapacity) {
          this.errorMessage = `Only ${data.remainingCapacity} guest(s) available for these dates.`;
        }
      },
      error: (error) => {
        console.error(error);
        this.availability = undefined;
        this.availabilityLoading = false;
        this.errorMessage = 'Failed to check availability for selected dates.';
      }
    });
  }

  getNumberOfNights(): number {
    if (!this.bookingForm.dateDebut || !this.bookingForm.dateFin) return 0;

    const start = new Date(this.bookingForm.dateDebut);
    const end = new Date(this.bookingForm.dateFin);

    const diff = end.getTime() - start.getTime();
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  }

  getTotalPrice(): number {
    if (!this.selectedSite) return 0;

    return this.getNumberOfNights()
      * this.bookingForm.numberOfGuests
      * this.selectedSite.prixParNuit;
  }

  getRemainingCapacity(): number {
    return this.availability?.remainingCapacity ?? this.selectedSite?.remainingCapacity ?? 0;
  }

  onSubmit(): void {
    if (!this.selectedSite) {
      this.showError('Site not found');
      return;
    }

    if (!this.bookingForm.dateDebut || !this.bookingForm.dateFin) {
      this.showError('Please select both dates.');
      return;
    }

    const start = new Date(this.bookingForm.dateDebut);
    const end = new Date(this.bookingForm.dateFin);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      this.showError('Start date cannot be in the past.');
      return;
    }

    if (end <= start) {
      this.showError('End date must be after start date.');
      return;
    }

    if (this.bookingForm.numberOfGuests < 1) {
      this.showError('Guests must be at least 1.');
      return;
    }

    if (!this.availability) {
      this.showError('Please select valid dates to check availability first.');
      return;
    }

    if (this.availability.remainingCapacity <= 0) {
      this.showError('No remaining spots are available for these dates.');
      return;
    }

    if (this.bookingForm.numberOfGuests > this.availability.remainingCapacity) {
      this.showError(`Max allowed for these dates is ${this.availability.remainingCapacity} guest(s).`);
      return;
    }

    this.router.navigate(['/public/booking-summary'], {
      state: {
        bookingData: {
          ...this.bookingForm,
          siteId: this.selectedSite.idSite
        },
        selectedSite: this.selectedSite,
        totalPrice: this.getTotalPrice(),
        nights: this.getNumberOfNights(),
        availability: this.availability
      }
    });
  }

  private showError(msg: string): void {
    this.errorMessage = msg;

    Swal.fire({
      icon: 'warning',
      title: 'Error',
      text: msg,
      confirmButtonColor: '#96952f',
      background: '#f5f5f3',
      color: '#172b44'
    });
  }
}