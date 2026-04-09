import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { EventResponseDTO } from '../../events/models/event.model';
import { EventService } from '../../events/services/event.service';
import { CampingSite } from '../../models/camping-site.model';
import { CampingService } from '../../services/camping.service';

@Component({
  selector: 'app-landing-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LandingPageComponent implements OnInit {
  readonly fallbackEventImageUrl = 'assets/images/default-image.jpg';
  readonly ratingStars = [1, 2, 3, 4, 5];
  readonly landingEventsLimit = 6;

  latestSites: CampingSite[] = [];
  upcomingEvents: EventResponseDTO[] = [];
  isLoading = false;
  isUpcomingEventsLoading = false;
  selectedSection = '';
  cardsPerView = 3;
  currentEventsPage = 0;

  recommendedSites: any[] = [];
  isRecommendedLoading = false;

  constructor(
    public authService: AuthService,
    private campingService: CampingService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.syncEventsGridLayout();
    this.loadLatestSites();
    this.loadUpcomingEvents();
    this.loadRecommendedSites();
  }

  getSiteImage(site: any): string {
    return site?.imageUrl || 'assets/images/default-camp.jpg';
  }

  hasTags(site: any): boolean {
    return Array.isArray(site?.smartTags) && site.smartTags.length > 0;
  }

  getSiteLink(siteId: number): string[] | null {
    if (this.isAdmin()) {
      return null;
    }

    return this.isLoggedIn()
      ? ['/public/site-booking', String(siteId)]
      : ['/login'];
  }

  getSiteButtonLabel(): string {
    if (this.isAdmin()) {
      return 'ADMIN ACCESS';
    }

    return this.isLoggedIn()
      ? 'LEARN MORE'
      : 'LOGIN TO BOOK';
  }

  loadRecommendedSites(): void {
    this.isRecommendedLoading = true;

    this.campingService.getRecommendedSites().subscribe({
      next: (data) => {
        this.recommendedSites = data || [];
        this.isRecommendedLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.isRecommendedLoading = false;
      }
    });
  }

  isAdmin(): boolean {
    return this.authService.getRole() === 'ADMINISTRATEUR';
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  showSection(section: string): void {
    this.selectedSection = section;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncEventsGridLayout();
  }

  loadLatestSites(): void {
    this.isLoading = true;

    this.campingService.getAllCampingSites().subscribe({
      next: (sites) => {
        const availableSites = sites.filter((site) => site.statutDispo !== 'CLOSED');
        this.latestSites = availableSites.slice(-3).reverse();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading latest sites', error);
        this.isLoading = false;
      }
    });
  }

  loadUpcomingEvents(): void {
    this.isUpcomingEventsLoading = true;

    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        this.upcomingEvents = this.extractUpcomingEvents(events);
        this.isUpcomingEventsLoading = false;
      },
      error: (error) => {
        console.error('Error loading upcoming events', error);
        this.upcomingEvents = [];
        this.isUpcomingEventsLoading = false;
      }
    });
  }

  get visibleEventSkeletons(): number[] {
    return Array.from({ length: this.landingEventsLimit }, (_, index) => index);
  }

  get visibleLandingEvents(): EventResponseDTO[] {
    return this.upcomingEvents.slice(0, this.landingEventsLimit);
  }

  get pagedUpcomingEvents(): EventResponseDTO[][] {
    return this.visibleLandingEvents.length ? [this.visibleLandingEvents] : [];
  }

  get totalEventsPages(): number {
    return this.pagedUpcomingEvents.length;
  }

  get hasMultipleEventPages(): boolean {
    return this.totalEventsPages > 1;
  }

  previousEventsPage(): void {
    if (!this.totalEventsPages) {
      return;
    }

    this.currentEventsPage =
      this.currentEventsPage === 0
        ? this.totalEventsPages - 1
        : this.currentEventsPage - 1;
  }

  nextEventsPage(): void {
    if (!this.totalEventsPages) {
      return;
    }

    this.currentEventsPage =
      this.currentEventsPage === this.totalEventsPages - 1
        ? 0
        : this.currentEventsPage + 1;
  }

  goToEventsPage(pageIndex: number): void {
    if (pageIndex < 0 || pageIndex >= this.totalEventsPages) {
      return;
    }

    this.currentEventsPage = pageIndex;
  }

  formatEventDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  formatEventTimeRange(startDate: string, endDate?: string): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;

    if (Number.isNaN(start.getTime())) {
      return 'Schedule to be confirmed';
    }

    const startTime = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
    const endTime = Number.isNaN(end.getTime())
      ? ''
      : end.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        });

    return endTime ? `${startTime} - ${endTime}` : startTime;
  }

  formatPrice(price?: number | null): string {
    if (!price || price <= 0) {
      return 'Free';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TND',
      maximumFractionDigits: 0
    }).format(price);
  }

  getEventDay(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit' });
  }

  getEventMonth(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  }

  getEventImageUrl(event?: EventResponseDTO | null): string {
    return this.eventService.getEventPrimaryImageUrl(event, this.fallbackEventImageUrl);
  }

  onUpcomingImageError(event: globalThis.Event): void {
    const imageElement = event.target as HTMLImageElement | null;

    if (!imageElement || imageElement.dataset['fallbackApplied'] === 'true') {
      return;
    }

    imageElement.dataset['fallbackApplied'] = 'true';
    imageElement.src = this.fallbackEventImageUrl;
  }

  getCategoryLabel(category?: string): string {
    const categoryLabels: Record<string, string> = {
      GUIDED_TOUR: 'Guided Tour',
      CAMPING_ACTIVITY: 'Camping Activity',
      WORKSHOP: 'Workshop',
      WELLNESS: 'Wellness',
      RESTORATION: 'Restoration',
      SOCIAL_EVENT: 'Social Event',
      ADVENTURE: 'Adventure',
      EDUCATIONAL: 'Educational'
    };

    return categoryLabels[category ?? ''] || 'Outdoor Experience';
  }

  getAvailabilityLabel(event: EventResponseDTO): string {
    if (event.isFullyBooked || (event.availableSeats ?? 0) <= 0) {
      return 'Waitlist available';
    }

    if ((event.availableSeats ?? 0) <= 5) {
      return `${event.availableSeats} spots left`;
    }

    return `${event.availableSeats} spots open`;
  }

  hasFeedback(event: EventResponseDTO): boolean {
    return Number(event.feedbackCount || 0) > 0;
  }

  getRoundedAverageRating(event: EventResponseDTO): number {
    return Math.max(0, Math.min(5, Math.round(Number(event.averageRating || 0))));
  }

  getAverageRatingLabel(event: EventResponseDTO): string {
    const averageRating = Number(event.averageRating || 0);
    return averageRating > 0 ? averageRating.toFixed(1) : '0.0';
  }

  getFeedbackCountLabel(event: EventResponseDTO): string {
    const feedbackCount = Number(event.feedbackCount || 0);
    return feedbackCount === 1 ? '1 review' : `${feedbackCount} reviews`;
  }

  getShortDescription(description?: string | null, limit = 120): string {
    if (!description?.trim()) {
      return 'Fresh-air moments, practical skills, and good company are waiting in this CampConnect experience.';
    }

    const normalizedDescription = description.replace(/\s+/g, ' ').trim();
    if (normalizedDescription.length <= limit) {
      return normalizedDescription;
    }

    return `${normalizedDescription.slice(0, limit).trimEnd()}...`;
  }

  private extractUpcomingEvents(events: EventResponseDTO[]): EventResponseDTO[] {
    const today = new Date();

    return [...events]
      .filter((event) => this.isUpcomingEvent(event, today))
      .sort(
        (firstEvent, secondEvent) =>
          new Date(firstEvent.dateDebut).getTime() - new Date(secondEvent.dateDebut).getTime()
      );
  }

  private isUpcomingEvent(event: EventResponseDTO, referenceDate: Date): boolean {
    const startDate = new Date(event.dateDebut);
    const endDate = event.dateFin ? new Date(event.dateFin) : startDate;
    const status = (event.statut || '').toUpperCase();

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return false;
    }

    if (['CANCELLED', 'COMPLETED', 'DRAFT'].includes(status)) {
      return false;
    }

    return endDate.getTime() >= referenceDate.getTime();
  }

  private syncEventsGridLayout(): void {
    const viewportWidth = typeof window === 'undefined' ? 1280 : window.innerWidth;

    if (viewportWidth >= 1180) {
      this.cardsPerView = 3;
    } else if (viewportWidth >= 700) {
      this.cardsPerView = 2;
    } else {
      this.cardsPerView = 1;
    }

    this.currentEventsPage = 0;
  }
}
