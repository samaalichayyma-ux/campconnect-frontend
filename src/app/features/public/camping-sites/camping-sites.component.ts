import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CampingSite } from '../models/camping-site.model';
import { CampingService } from '../services/camping.service';
import { AuthService } from '../../../core/services/auth.service';
import { SiteCampingAvisService, SiteRating } from '../services/site-camping-avis.service';


@Component({
  selector: 'app-camping-sites',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './camping-sites.component.html',
  styleUrl: './camping-sites.component.css'
})
export class CampingSitesComponent implements OnInit {
  sites: CampingSite[] = [];
  filteredSites: CampingSite[] = [];
  paginatedSites: CampingSite[] = [];

  isLoading = false;
  errorMessage = '';
  searchTerm = '';

  currentPage = 1;
  itemsPerPage = 6;
  adminRole = '';

  siteRatings: Record<number, SiteRating> = {};

  constructor(
    private campingService: CampingService,
    private siteCampingAvisService: SiteCampingAvisService,
    public authService: AuthService
  ) {
    this.adminRole = this.authService.getRole() || '';
  }

  isAdmin(): boolean {
    return this.adminRole === 'ADMINISTRATEUR';
  }

  isLoggedIn(): boolean {
  return this.authService.isLoggedIn();
}

  ngOnInit(): void {
    this.loadCampingSites();
  }

  loadCampingSites(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.campingService.getAllCampingSites().subscribe({
      next: (data) => {
        this.sites = data.filter(site => site.statutDispo !== 'CLOSED').reverse();
        this.loadRatingsForSites();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load camping sites.';
        this.isLoading = false;
        console.error('Error loading camping sites:', error);
      }
    });
  }

  loadRatingsForSites(): void {
    if (!this.sites.length) return;

    const ratingRequests = this.sites.map(site =>
      this.siteCampingAvisService.getSiteRating(site.idSite).pipe(
        catchError(() =>
          of({
            siteId: site.idSite,
            averageRating: 0,
            totalRatings: 0
          })
        )
      )
    );

    forkJoin(ratingRequests).subscribe({
      next: (ratings) => {
        this.siteRatings = {};
        ratings.forEach(rating => {
          this.siteRatings[rating.siteId] = rating;
        });
      },
      error: (error) => {
        console.error('Error loading ratings:', error);
      }
    });
  }

  getSiteRating(siteId: number): SiteRating {
    return this.siteRatings[siteId] || {
      siteId,
      averageRating: 0,
      totalRatings: 0
    };
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredSites = this.sites.filter(site => {
      const matchesSearch =
        !term ||
        site.nom.toLowerCase().includes(term) ||
        site.localisation.toLowerCase().includes(term);

      return matchesSearch;
    });

    this.currentPage = 1;
    this.updatePaginatedSites();
  }

  updatePaginatedSites(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedSites = this.filteredSites.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedSites();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedSites();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedSites();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSites.length / this.itemsPerPage) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}