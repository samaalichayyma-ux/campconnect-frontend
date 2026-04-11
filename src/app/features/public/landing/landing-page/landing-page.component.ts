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
  readonly landingPriorityLiveSlots = 4;

  latestSites: CampingSite[] = [];
  landingEvents: EventResponseDTO[] = [];
  isLoading = false;
  isLandingEventsLoading = false;
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
    this.loadLandingEvents();
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

  loadLandingEvents(): void {
    this.isLandingEventsLoading = true;

    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        this.landingEvents = this.extractLandingEvents(events);
        this.isLandingEventsLoading = false;
      },
      error: (error) => {
        console.error('Error loading landing events', error);
        this.landingEvents = [];
        this.isLandingEventsLoading = false;
      }
    });
  }

  get visibleEventSkeletons(): number[] {
    return Array.from({ length: this.landingEventsLimit }, (_, index) => index);
  }

  get visibleLandingEvents(): EventResponseDTO[] {
    return this.landingEvents.slice(0, this.landingEventsLimit);
  }

  get pagedLandingEvents(): EventResponseDTO[][] {
    return this.visibleLandingEvents.length ? [this.visibleLandingEvents] : [];
  }

  get totalEventsPages(): number {
    return this.pagedLandingEvents.length;
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

  onLandingImageError(event: globalThis.Event): void {
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

  getEventStatusLabel(event: EventResponseDTO): string {
    const statusLabels: Record<string, string> = {
      SCHEDULED: 'Scheduled',
      ONGOING: 'Ongoing',
      COMPLETED: 'Completed',
      POSTPONED: 'Postponed',
      CANCELLED: 'Cancelled'
    };

    const normalizedStatus = this.getNormalizedEventStatus(event);
    return statusLabels[normalizedStatus] || 'Scheduled';
  }

  getEventStatusClass(event: EventResponseDTO): string {
    switch (this.getNormalizedEventStatus(event)) {
      case 'ONGOING':
        return 'is-ongoing';
      case 'COMPLETED':
        return 'is-completed';
      case 'POSTPONED':
        return 'is-postponed';
      case 'CANCELLED':
        return 'is-cancelled';
      default:
        return 'is-scheduled';
    }
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

  private extractLandingEvents(events: EventResponseDTO[]): EventResponseDTO[] {
    const referenceDate = new Date();
    const visibleEvents = events.filter((event) => this.canDisplayLandingEvent(event, referenceDate));
    const liveAndScheduledEvents = visibleEvents
      .filter((event) => !this.isCompletedLandingEvent(event, referenceDate))
      .sort((firstEvent, secondEvent) =>
        this.compareLiveAndScheduledLandingEvents(firstEvent, secondEvent)
      );
    const completedEvents = visibleEvents
      .filter((event) => this.isCompletedLandingEvent(event, referenceDate))
      .sort((firstEvent, secondEvent) =>
        this.compareCompletedLandingEvents(firstEvent, secondEvent)
      );

    // Keep upcoming visibility on the landing page while still surfacing finished events
    // so visitors can browse ratings and reviews without leaving the homepage.
    const featuredLandingEvents: EventResponseDTO[] = [];
    const addUniqueEvents = (items: EventResponseDTO[], limit: number): void => {
      for (const event of items) {
        if (featuredLandingEvents.length >= limit) {
          return;
        }

        if (!featuredLandingEvents.some((featuredEvent) => featuredEvent.id === event.id)) {
          featuredLandingEvents.push(event);
        }
      }
    };

    addUniqueEvents(
      liveAndScheduledEvents,
      Math.min(this.landingPriorityLiveSlots, this.landingEventsLimit)
    );
    addUniqueEvents(completedEvents, this.landingEventsLimit);
    addUniqueEvents(liveAndScheduledEvents, this.landingEventsLimit);

    return featuredLandingEvents;
  }

  private canDisplayLandingEvent(event: EventResponseDTO, referenceDate: Date): boolean {
    const startDate = this.getSafeEventDate(event.dateDebut);
    const endDate = this.getEventEndDate(event);
    const status = this.getNormalizedEventStatus(event);

    if (!startDate || !endDate) {
      return false;
    }

    if (event.published === false) {
      return false;
    }

    if (['CANCELLED', 'DRAFT'].includes(status)) {
      return false;
    }

    return status === 'COMPLETED' || endDate.getTime() >= referenceDate.getTime();
  }

  private isCompletedLandingEvent(event: EventResponseDTO, referenceDate: Date): boolean {
    const status = this.getNormalizedEventStatus(event);
    if (status === 'COMPLETED') {
      return true;
    }

    const endDate = this.getEventEndDate(event);
    return Boolean(endDate && endDate.getTime() < referenceDate.getTime());
  }

  private compareLiveAndScheduledLandingEvents(
    firstEvent: EventResponseDTO,
    secondEvent: EventResponseDTO
  ): number {
    const statusOrder = (status: string): number => {
      switch (status) {
        case 'ONGOING':
          return 0;
        case 'SCHEDULED':
          return 1;
        case 'POSTPONED':
          return 2;
        default:
          return 3;
      }
    };

    const statusDifference =
      statusOrder(this.getNormalizedEventStatus(firstEvent))
      - statusOrder(this.getNormalizedEventStatus(secondEvent));

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return this.getEventTimestamp(firstEvent.dateDebut) - this.getEventTimestamp(secondEvent.dateDebut);
  }

  private compareCompletedLandingEvents(
    firstEvent: EventResponseDTO,
    secondEvent: EventResponseDTO
  ): number {
    const feedbackDifference =
      Number(secondEvent.feedbackCount || 0) - Number(firstEvent.feedbackCount || 0);

    if (feedbackDifference !== 0) {
      return feedbackDifference;
    }

    const ratingDifference =
      Number(secondEvent.averageRating || 0) - Number(firstEvent.averageRating || 0);

    if (ratingDifference !== 0) {
      return ratingDifference;
    }

    return this.getEventTimestamp(secondEvent.dateFin || secondEvent.dateDebut)
      - this.getEventTimestamp(firstEvent.dateFin || firstEvent.dateDebut);
  }

  private getNormalizedEventStatus(event: EventResponseDTO): string {
    return String(event.statut || '').toUpperCase();
  }

  private getEventEndDate(event: EventResponseDTO): Date | null {
    return this.getSafeEventDate(event.dateFin || event.dateDebut);
  }

  private getSafeEventDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private getEventTimestamp(value?: string | null): number {
    return this.getSafeEventDate(value)?.getTime() ?? Number.MAX_SAFE_INTEGER;
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
