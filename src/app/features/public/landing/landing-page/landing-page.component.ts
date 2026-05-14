import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { TestApiService } from '../../../../core/services/test-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CampingService } from '../../services/camping.service';
import { CampingSite } from '../../models/camping-site.model';
import { EventResponseDTO } from '../../events/models/event.model';
import { EventService } from '../../events/services/event.service';

@Component({
  selector: 'app-landing-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LandingPageComponent implements OnInit {
  readonly fallbackEventImageUrl = 'assets/images/default-image.jpg';

  latestSites: CampingSite[] = [];
  upcomingEvents: EventResponseDTO[] = [];
  isLoading = false;
  isUpcomingEventsLoading = false;
  selectedSection = '';
  cardsPerView = 3;
  currentEventsPage = 0;

  constructor(
    private testApi: TestApiService,
    public authService: AuthService,
    private campingService: CampingService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.syncEventsCarouselLayout();
    this.loadLatestSites();
    this.loadUpcomingEvents();

    this.testApi.testDocs().subscribe({
      next: (response) => console.log('Backend OK', response),
      error: (error) => console.log('Backend KO', error)
    });
  }

  showSection(section: string): void {
    this.selectedSection = section;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncEventsCarouselLayout();
  }

  loadLatestSites(): void {
    this.isLoading = true;

    this.campingService.getAllCampingSites().subscribe({
      next: (sites) => {
        this.latestSites = sites.slice(-3).reverse();
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

    this.eventService.getUpcomingEvents().subscribe({
      next: (events) => {
        this.upcomingEvents = [...events].sort(
          (firstEvent, secondEvent) =>
            new Date(firstEvent.dateDebut).getTime() - new Date(secondEvent.dateDebut).getTime()
        );
        this.currentEventsPage = 0;
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
    return Array.from({ length: this.cardsPerView }, (_, index) => index);
  }

  get pagedUpcomingEvents(): EventResponseDTO[][] {
    const pages: EventResponseDTO[][] = [];

    for (let index = 0; index < this.upcomingEvents.length; index += this.cardsPerView) {
      pages.push(this.upcomingEvents.slice(index, index + this.cardsPerView));
    }

    return pages;
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

  private syncEventsCarouselLayout(): void {
    const viewportWidth = typeof window === 'undefined' ? 1280 : window.innerWidth;

    if (viewportWidth >= 1180) {
      this.cardsPerView = 3;
    } else if (viewportWidth >= 700) {
      this.cardsPerView = 2;
    } else {
      this.cardsPerView = 1;
    }

    const maxPageIndex = Math.max(this.totalEventsPages - 1, 0);
    this.currentEventsPage = Math.min(this.currentEventsPage, maxPageIndex);
  }
}
