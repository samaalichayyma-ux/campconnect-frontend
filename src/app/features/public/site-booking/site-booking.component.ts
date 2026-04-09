import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { withAutoCloseAlert } from '../../../core/utils/auto-close-alert.util';
import { CampingSite } from '../models/camping-site.model';
import { SiteBooking } from '../models/booking.model';
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

 onSubmit(): void {
  if (!this.selectedSite) {
    this.showError('Site not found');
    return;
  }

  const remaining = this.selectedSite.remainingCapacity ?? 0;

  if (remaining === 0) {
    this.showError('This camping site is fully booked.');
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

  if (this.bookingForm.numberOfGuests > remaining) {
    this.showError(`Max allowed is ${remaining} guests.`);
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
      nights: this.getNumberOfNights()
    }
  });
}

  private showError(msg: string) {
    this.errorMessage = msg;

    void Swal.fire(withAutoCloseAlert({
      icon: 'warning',
      title: 'Error',
      text: msg,
      confirmButtonColor: '#96952f',
      background: '#f5f5f3',
      color: '#172b44'
    }));
  }
}
