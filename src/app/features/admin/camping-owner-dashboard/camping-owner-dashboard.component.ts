import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CampingNavbarComponent } from '../camping-sites/camping-navbar/camping-navbar.component';
import { CampingService } from '../../public/services/camping.service';
import { CampingSite } from '../../public/models/camping-site.model';
import { UpdateSiteBooking } from '../../public/models/booking.model';
import { SiteCampingAvisService, Avis } from '../../public/services/site-camping-avis.service';

@Component({
  selector: 'app-camping-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CampingNavbarComponent],
  templateUrl: './camping-owner-dashboard.component.html',
  styleUrl: './camping-owner-dashboard.component.css'
})
export class CampingOwnerDashboardComponent implements OnInit {
  mySites: CampingSite[] = [];
  myBookings: UpdateSiteBooking[] = [];
  myReviews: Avis[] = [];

  isLoading = false;
  errorMessage = '';

  constructor(
    private campingService: CampingService,
    private avisService: SiteCampingAvisService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.campingService.getMyCampingSites().subscribe({
      next: (sites) => {
        this.mySites = sites;

        const siteIds = sites.map(site => site.idSite);

        this.loadBookingsForSites(siteIds);
        this.loadReviewsForSites(siteIds);
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Failed to load dashboard data.';
        this.isLoading = false;
      }
    });
  }

  loadBookingsForSites(siteIds: number[]): void {
  if (siteIds.length === 0) {
    this.myBookings = [];
    this.isLoading = false;
    return;
  }

  const bookingRequests = siteIds.map(id =>
    this.campingService.getDetailedBookingsBySite(id)
  );

  Promise.all(bookingRequests.map(req => req.toPromise()))
    .then(results => {
      this.myBookings = results
        .flat()
        .filter((booking): booking is UpdateSiteBooking => !!booking)
        .sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime());

      this.isLoading = false;
    })
    .catch(error => {
      console.error(error);
      this.errorMessage = 'Failed to load bookings.';
      this.isLoading = false;
    });
}

  loadReviewsForSites(siteIds: number[]): void {
    if (siteIds.length === 0) {
      this.myReviews = [];
      return;
    }

    const reviewRequests = siteIds.map(id => this.avisService.getAvisBySite(id));

    Promise.all(reviewRequests.map(req => req.toPromise()))
      .then(results => {
        this.myReviews = (results.flat().filter(Boolean) as Avis[])
          .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
      })
      .catch(error => {
        console.error(error);
      });
  }

  get totalSites(): number {
    return this.mySites.length;
  }

  get activeSites(): number {
    return this.mySites.filter(site => site.statutDispo === 'AVAILABLE').length;
  }

  get closedSites(): number {
    return this.mySites.filter(site => site.statutDispo === 'CLOSED').length;
  }

  get totalBookings(): number {
    return this.myBookings.length;
  }

  get pendingBookings(): number {
    return this.myBookings.filter(booking => booking.statut === 'PENDING').length;
  }

  get confirmedBookings(): number {
    return this.myBookings.filter(booking => booking.statut === 'CONFIRMED').length;
  }

  get recentSites(): CampingSite[] {
    return this.mySites.slice(0, 3);
  }

  get recentBookings(): UpdateSiteBooking[] {
    return this.myBookings.slice(0, 5);
  }

  get recentReviews(): Avis[] {
    return this.myReviews.slice(0, 5);
  }
}