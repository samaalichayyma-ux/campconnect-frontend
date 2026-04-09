import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastMessageHost } from '../../../../core/utils/toast-message-host';
import { EventLocationMapComponent } from '../components/event-location-map/event-location-map.component';
import { EventFeedbackDTO, EventResponseDTO } from '../models/event.model';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, AdminIconComponent, EventLocationMapComponent],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.css'
})
export class EventDetailsComponent extends ToastMessageHost implements OnInit, OnDestroy {
  readonly fallbackImageUrl = 'assets/images/default-image.jpg';
  readonly ratingStars = [1, 2, 3, 4, 5];
  private successMessageTimeoutId: ReturnType<typeof window.setTimeout> | null = null;

  event: EventResponseDTO | null = null;
  galleryImages: string[] = [];

  isLoading = false;
  isFavorite = false;
  isFavoriteLoading = false;
  isLoggedIn = false;

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();

    const rawEventId = this.route.snapshot.paramMap.get('id');
    const eventId = rawEventId ? Number.parseInt(rawEventId, 10) : Number.NaN;
    if (Number.isFinite(eventId) && eventId > 0) {
      this.loadEvent(eventId);
      return;
    }

    this.errorMessage = 'This event could not be found. Please go back and try again.';
  }

  ngOnDestroy(): void {
    this.clearSuccessMessageTimeout();
  }

  loadEvent(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    window.scrollTo(0, 0);

    this.eventService.getEventById(id).subscribe({
      next: (event) => {
        this.event = event;
        this.galleryImages = this.eventService.getEventGalleryImageUrls(event);
        if (this.isLoggedIn) {
          this.loadFavoriteState(id);
        } else {
          this.isFavorite = false;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = this.getBackendMessage(error) || 'Failed to load event details. Please try again.';
        console.error('Error loading event:', error);
        this.isLoading = false;
      }
    });
  }

  getAvailableSeats(): number {
    return this.event?.availableSeats || 0;
  }

  getSpotsTaken(): number {
    const capacity = this.event?.capaciteMax ?? 0;
    return Math.max(0, capacity - this.getAvailableSeats());
  }

  getAvailabilityFillPercentage(): number {
    const capacity = this.event?.capaciteMax ?? 0;
    if (capacity <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(0, (this.getSpotsTaken() / capacity) * 100));
  }

  isEventFull(): boolean {
    return this.getAvailableSeats() === 0;
  }

  isAlmostFull(): boolean {
    return Boolean(this.event?.isAlmostFull);
  }

  requiresReservationApproval(): boolean {
    return this.event?.reservationApprovalRequired !== false;
  }

  getCapacityHeadline(): string {
    if (this.isEventFull()) {
      return 'Fully booked right now';
    }

    if (this.isAlmostFull()) {
      return 'Almost full';
    }

    return 'Seats still open';
  }

  getCapacitySupportCopy(): string {
    if (!this.event) {
      return 'Live capacity details will appear here once the event finishes loading.';
    }

    if (this.isEventFull()) {
      return this.event.waitlistCount > 0
        ? `${this.event.waitlistCount} guest${this.event.waitlistCount === 1 ? '' : 's'} are already waiting for an opening.`
        : 'New reservations are likely to move straight to the waitlist until a seat opens.';
    }

    if (this.isAlmostFull()) {
      return `${this.getAvailableSeats()} seat${this.getAvailableSeats() === 1 ? '' : 's'} remain, so this event may flip to waitlist mode soon.`;
    }

    return `${this.getAvailableSeats()} seats are currently open, with ${this.event.waitlistCount || 0} guest${(this.event.waitlistCount || 0) === 1 ? '' : 's'} already waiting.`;
  }

  getCheckoutStateLabel(): string {
    if (this.isEventFull()) {
      return 'Waitlist flow';
    }

    return this.requiresReservationApproval() ? 'Admin review after checkout' : 'Instant confirmation';
  }

  getCheckoutCtaLabel(): string {
    return this.isEventFull() ? 'Continue to Waitlist' : 'Continue to Checkout';
  }

  hasFeedback(): boolean {
    return Number(this.event?.feedbackCount || 0) > 0;
  }

  getFeedbackEntries(): EventFeedbackDTO[] {
    return this.event?.feedbackEntries ?? [];
  }

  getAverageRatingLabel(): string {
    const averageRating = Number(this.event?.averageRating || 0);
    return averageRating > 0 ? averageRating.toFixed(1) : '0.0';
  }

  getRoundedAverageRating(): number {
    return Math.max(0, Math.min(5, Math.round(Number(this.event?.averageRating || 0))));
  }

  getFeedbackCountLabel(): string {
    const feedbackCount = Number(this.event?.feedbackCount || 0);
    return feedbackCount === 1 ? '1 review' : `${feedbackCount} reviews`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFeedbackDate(dateString?: string): string {
    if (!dateString) {
      return 'Recently';
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Recently';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  trackByGalleryImage(_index: number, imageUrl: string): string {
    return imageUrl;
  }

  getCategoryLabel(category: string): string {
    const categoryMap: Record<string, string> = {
      CAMPING_ACTIVITY: 'Camping',
      OUTDOOR: 'Outdoor',
      WATER_SPORTS: 'Water Sports',
      CULTURAL: 'Cultural',
      ADVENTURE: 'Adventure',
      WELLNESS: 'Wellness',
      SPORTS: 'Sports',
      EDUCATIONAL: 'Educational',
      NIGHT_LIFE: 'Night Life'
    };

    return categoryMap[category] || category;
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      SCHEDULED: 'Scheduled',
      ONGOING: 'Ongoing',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      POSTPONED: 'Postponed'
    };

    return statusMap[status] || status;
  }

  toggleFavorite(): void {
    if (!this.event) {
      return;
    }

    if (!this.isLoggedIn) {
      this.authService.setReturnUrl(this.router.url);
      this.router.navigate(['/login']);
      return;
    }

    if (this.isFavoriteLoading) {
      return;
    }

    this.isFavoriteLoading = true;
    const request$ = this.isFavorite
      ? this.eventService.removeFavorite(this.event.id)
      : this.eventService.addFavorite(this.event.id);

    request$.subscribe({
      next: () => {
        this.isFavorite = !this.isFavorite;
        if (this.event) {
          const currentCount = Number(this.event.favoriteCount || 0);
          this.event.favoriteCount = Math.max(0, currentCount + (this.isFavorite ? 1 : -1));
        }
        this.showSuccessMessage(
          this.isFavorite
            ? 'Event saved to your favorites.'
            : 'Event removed from your favorites.'
        );
        this.isFavoriteLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Could not update favorites right now.';
        this.isFavoriteLoading = false;
        console.error('Error updating favorite state:', error);
      }
    });
  }

  goBack(): void {
    const savedFilter = this.route.snapshot.queryParamMap.get('saved');
    this.router.navigate(['/public/events'], {
      queryParams: savedFilter ? { saved: savedFilter } : undefined
    });
  }

  goToMyReservations(): void {
    this.router.navigate(['/public/events/my-reservations']);
  }

  openBookingModal(): void {
    if (!this.event) {
      return;
    }

    const reservationPath = `/public/events/${this.event.id}/reservation`;
    if (!this.isLoggedIn) {
      this.authService.setReturnUrl(reservationPath);
      this.router.navigate(['/login']);
      return;
    }

    this.router.navigate(['/public/events', this.event.id, 'reservation']);
  }

  getErrorActionLabel(): string {
    return this.event ? 'Retry' : 'Back to Events';
  }

  handleErrorAction(): void {
    if (this.event) {
      this.loadEvent(this.event.id);
      return;
    }

    this.goBack();
  }

  getPrimaryImageUrl(): string {
    return this.eventService.getEventPrimaryImageUrl(this.event, this.fallbackImageUrl);
  }

  onImageError(event: globalThis.Event): void {
    const imageElement = event.target as HTMLImageElement | null;
    if (!imageElement || imageElement.dataset['fallbackApplied'] === 'true') {
      return;
    }

    imageElement.dataset['fallbackApplied'] = 'true';
    imageElement.src = this.fallbackImageUrl;
  }

  private loadFavoriteState(eventId: number): void {
    this.eventService.getFavoriteEvents().subscribe({
      next: (favorites) => {
        this.isFavorite = favorites.some((event) => event.id === eventId);
      },
      error: (error) => {
        console.error('Error loading favorite state:', error);
      }
    });
  }

  private showSuccessMessage(message: string): void {
    this.clearSuccessMessageTimeout();
    this.successMessage = message;
    this.successMessageTimeoutId = window.setTimeout(() => {
      this.successMessage = '';
      this.successMessageTimeoutId = null;
    }, 3200);
  }

  private clearSuccessMessageTimeout(): void {
    if (this.successMessageTimeoutId !== null) {
      window.clearTimeout(this.successMessageTimeoutId);
      this.successMessageTimeoutId = null;
    }
  }

  private getBackendMessage(error: unknown): string | null {
    const apiError = (error as { error?: unknown })?.error;
    if (!apiError) {
      return null;
    }

    if (typeof apiError === 'string') {
      const trimmedMessage = apiError.trim();
      return trimmedMessage || null;
    }

    const message = (apiError as { message?: string; error?: string; details?: string; title?: string })?.message
      || (apiError as { message?: string; error?: string; details?: string; title?: string })?.error
      || (apiError as { message?: string; error?: string; details?: string; title?: string })?.details
      || (apiError as { message?: string; error?: string; details?: string; title?: string })?.title;

    return typeof message === 'string' && message.trim() ? message.trim() : null;
  }
}
