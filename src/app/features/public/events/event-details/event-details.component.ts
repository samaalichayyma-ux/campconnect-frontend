import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { AuthService } from '../../../../core/services/auth.service';
import { EventLocationMapComponent } from '../components/event-location-map/event-location-map.component';
import { EventResponseDTO, ReservationRequestDTO, ReservationResponseDTO } from '../models/event.model';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AdminIconComponent, EventLocationMapComponent],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.css'
})
export class EventDetailsComponent implements OnInit {
  readonly fallbackImageUrl = 'assets/images/default-image.jpg';
  readonly activeReservationStatuses = new Set(['PENDING', 'CONFIRMED', 'PAID']);
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  event: EventResponseDTO | null = null;
  galleryImages: string[] = [];

  isLoading = false;
  isSubmitting = false;
  isBookingModalOpen = false;
  bookingSuccess = false;
  errorMessage = '';
  successMessage = '';
  hasReservationConflict = false;
  existingReservationConflict: ReservationResponseDTO | null = null;

  numberOfParticipants = 1;
  remarks = '';
  totalPrice = 0;

  isOnWaitlist = false;
  availableSeats = 0;

  isLoggedIn = false;
  currentUserId: number | null = null;

  searchQuery = '';
  searchSuggestions: EventResponseDTO[] = [];
  showSuggestions = false;
  isSearching = false;
  searchTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkAuth();
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.loadEvent(Number.parseInt(eventId, 10), this.getInitialParticipants());
    }
  }

  checkAuth(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.currentUserId = this.authService.getUserId();
    }
  }

  loadEvent(id: number, preferredParticipants = 1): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.hasReservationConflict = false;
    this.existingReservationConflict = null;
    window.scrollTo(0, 0);

    this.eventService.getEventById(id).subscribe({
      next: (data) => {
        this.event = data;
        this.galleryImages = this.eventService.getEventGalleryImageUrls(data);
        this.numberOfParticipants = Math.max(1, Math.min(preferredParticipants, this.getParticipantLimit()));
        this.availableSeats = data.availableSeats;
        this.calculatePrice();

        if (this.isLoggedIn && this.currentUserId) {
          this.checkWaitlistStatus(id);
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load event details. Please try again.';
        console.error('Error loading event:', error);
        this.isLoading = false;
      }
    });
  }

  checkWaitlistStatus(eventId: number): void {
    if (!this.currentUserId) {
      return;
    }

    this.eventService.isUserOnWaitlist(this.currentUserId, eventId).subscribe({
      next: (isOnWaitlist) => {
        this.isOnWaitlist = isOnWaitlist;
      },
      error: (error) => {
        console.error('Error checking waitlist status:', error);
      }
    });
  }

  calculatePrice(): void {
    if (!this.event) {
      return;
    }

    this.eventService.calculateReservationPrice(this.event.id, this.numberOfParticipants).subscribe({
      next: (price) => {
        this.totalPrice = price;
      },
      error: (error) => {
        console.error('Error calculating price:', error);
        this.totalPrice = this.event!.prix * this.numberOfParticipants;
      }
    });
  }

  increaseParticipants(): void {
    const maxParticipants = this.getParticipantLimit();
    if (this.numberOfParticipants < maxParticipants) {
      this.numberOfParticipants++;
      this.calculatePrice();
    }
  }

  decreaseParticipants(): void {
    if (this.numberOfParticipants > 1) {
      this.numberOfParticipants--;
      this.calculatePrice();
    }
  }

  openBookingModal(): void {
    const reservationQueryParams = { participants: this.numberOfParticipants };

    if (!this.isLoggedIn) {
      if (this.event) {
        this.authService.setReturnUrl(`/public/events/${this.event.id}/reservation?participants=${this.numberOfParticipants}`);
      }
      this.router.navigate(['/login']);
      return;
    }

    if (this.event) {
      this.router.navigate(['/public/events', this.event.id, 'reservation'], {
        queryParams: reservationQueryParams
      });
    }
  }

  closeBookingModal(): void {
    this.isBookingModalOpen = false;
    this.bookingSuccess = false;
    this.numberOfParticipants = 1;
    this.remarks = '';
    this.errorMessage = '';
    this.hasReservationConflict = false;
    this.existingReservationConflict = null;
  }

  submitBooking(): void {
    if (!this.event || !this.numberOfParticipants) {
      this.errorMessage = 'Invalid reservation data.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.hasReservationConflict = false;
    this.existingReservationConflict = null;

    this.authService.fetchCurrentUser().subscribe({
      next: (userInfo: unknown) => {
        const resolvedUserId = this.extractUserId(userInfo) || this.currentUserId;
        if (!resolvedUserId) {
          this.isSubmitting = false;
          this.errorMessage = 'Session issue: user ID not found. Please log in again.';
          return;
        }

        this.currentUserId = resolvedUserId;
        this.authService.saveUserId(resolvedUserId);
        this.checkExistingReservationConflictBeforeSubmit(resolvedUserId);
      },
      error: (userError: unknown) => {
        console.warn('Could not refresh current user before booking submit:', userError);

        if (!this.currentUserId) {
          this.isSubmitting = false;
          this.errorMessage = 'Session issue: user ID not found. Please log in again.';
          return;
        }

        this.checkExistingReservationConflictBeforeSubmit(this.currentUserId);
      }
    });
  }

  getTotalPrice(): number {
    return (this.event?.prix || 0) * this.numberOfParticipants;
  }

  getAvailableSeats(): number {
    return this.event?.availableSeats || 0;
  }

  getParticipantLimit(): number {
    const capacity = this.event?.capaciteMax ?? 1;
    return Math.max(1, Math.min(capacity, 100));
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

  isWaitlistLikely(): boolean {
    return this.numberOfParticipants > this.getAvailableSeats();
  }

  isEventFull(): boolean {
    return (this.event?.availableSeats || 0) === 0;
  }

  isAlmostFull(): boolean {
    return Boolean(this.event?.isAlmostFull);
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
      return `${this.getAvailableSeats()} seat${this.getAvailableSeats() === 1 ? '' : 's'} remain, so demand is high and this event may flip to waitlist mode soon.`;
    }

    return `${this.getAvailableSeats()} seats are currently open, with ${this.event.waitlistCount || 0} guest${(this.event.waitlistCount || 0) === 1 ? '' : 's'} already waiting.`;
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

  getDurationLabel(): string {
    const durationInMinutes = this.event?.dureeMinutes ?? 0;
    if (durationInMinutes >= 60) {
      const hours = Math.floor(durationInMinutes / 60);
      const minutes = durationInMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    return `${durationInMinutes} min`;
  }

  getReservationCtaLabel(): string {
    return this.isWaitlistLikely() ? 'Continue to Waitlist' : 'Continue to Reservation';
  }

  getReservationHelperText(): string {
    if (this.isOnWaitlist) {
      return 'You are already on this event waitlist. You can review that request anytime from My Reservations.';
    }

    if (this.isWaitlistLikely()) {
      const availableSeats = this.getAvailableSeats();
      return `Only ${availableSeats} seat${availableSeats === 1 ? '' : 's'} are open for the group size you selected, so the request will likely stay on the waitlist. Stripe payment is required right away to hold your place in line, and CampConnect refunds it in full automatically if no seat opens before the event starts.`;
    }

    if (this.requiresReservationApproval()) {
      return 'The next page lets you confirm notes and submit the reservation using the same public booking flow.';
    }

    return 'Seats are open for your group. This event confirms reservations immediately, and Stripe payment becomes available right after booking.';
  }

  requiresReservationApproval(): boolean {
    return this.event?.reservationApprovalRequired !== false;
  }

  getReservationNextStateLabel(): string {
    if (this.isWaitlistLikely()) {
      return 'Waitlist + payment required';
    }

    return this.requiresReservationApproval() ? 'Pending admin review' : 'Confirmed right away';
  }

  getReservationReviewSupportCopy(): string {
    if (this.isWaitlistLikely()) {
      return 'If your group lands on the waitlist, CampConnect keeps the booking pending until a seat opens.';
    }

    return this.requiresReservationApproval()
      ? 'Your request is created in the public reservation flow and reviewed by the admin team.'
      : 'If seats are still open for your group, the reservation is confirmed immediately after you submit it.';
  }

  getReservationWaitlistSupportCopy(): string {
    return 'Waitlist bookings are paid immediately to hold a place in line. If a seat opens, CampConnect promotes the booking automatically. If not, the full payment is refunded when the event starts.';
  }

  getReservationPaymentSupportCopy(): string {
    if (this.isWaitlistLikely()) {
      return 'As soon as the waitlist reservation is created, Stripe payment is available from My Reservations so you can secure the booking.';
    }

    return this.requiresReservationApproval()
      ? 'After a reservation is confirmed, you can finish the payment with Stripe directly from the My Reservations page.'
      : 'Because this event confirms reservations instantly, Stripe payment is available from My Reservations right after booking.';
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

  getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      SCHEDULED: 'calendar',
      ONGOING: 'clock',
      COMPLETED: 'check',
      CANCELLED: 'close',
      POSTPONED: 'warning'
    };

    return iconMap[status] || 'events';
  }

  getLocationCoordinatesLabel(): string {
    if (typeof this.event?.latitude !== 'number' || typeof this.event?.longitude !== 'number') {
      return 'Coordinates will appear here once an exact map pin is saved for this event.';
    }

    return `${this.event.latitude.toFixed(6)}, ${this.event.longitude.toFixed(6)}`;
  }

  goBack(): void {
    this.router.navigate(['/public/events']);
  }

  goToMyReservations(reservationId?: number | null): void {
    this.router.navigate(['/public/events/my-reservations'], {
      queryParams: reservationId ? { focusReservation: reservationId } : undefined
    });
  }

  getErrorTitle(): string {
    return this.hasReservationConflict ? 'Reservation already exists' : 'Something went wrong';
  }

  getErrorActionLabel(): string {
    if (this.hasReservationConflict) {
      if (this.existingReservationConflict?.statutPaiement !== 'PAID'
        && (this.existingReservationConflict?.statut === 'CONFIRMED'
          || this.existingReservationConflict?.estEnAttente)) {
        return 'Go to Payment';
      }

      return 'View My Reservations';
    }

    return 'Retry';
  }

  handleErrorAction(): void {
    if (this.hasReservationConflict) {
      this.goToMyReservations(this.existingReservationConflict?.id);
      return;
    }

    if (this.event) {
      this.loadEvent(this.event.id);
    }
  }

  onSearchInput(query: string): void {
    this.searchQuery = query;

    if (this.searchTimeoutId) {
      clearTimeout(this.searchTimeoutId);
    }

    if (!query.trim()) {
      this.showSuggestions = false;
      this.searchSuggestions = [];
      return;
    }

    this.isSearching = true;
    this.searchTimeoutId = setTimeout(() => {
      this.fetchSearchSuggestions(query);
    }, 300);
  }

  fetchSearchSuggestions(keyword: string): void {
    this.eventService.searchEvents(keyword).subscribe({
      next: (events) => {
        this.searchSuggestions = events.slice(0, 5);
        this.showSuggestions = this.searchSuggestions.length > 0;
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error searching events:', error);
        this.searchSuggestions = [];
        this.showSuggestions = false;
        this.isSearching = false;
      }
    });
  }

  selectSuggestion(eventId: number): void {
    this.searchQuery = '';
    this.showSuggestions = false;
    this.searchSuggestions = [];
    this.router.navigate(['/public/events', eventId]);
  }

  performSearch(): void {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.showSuggestions = false;
    this.router.navigate(['/public/events'], { queryParams: { search: this.searchQuery } });
  }

  closeSuggestions(): void {
    this.showSuggestions = false;
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

  private getInitialParticipants(): number {
    const rawParticipants = this.route.snapshot.queryParamMap.get('participants');
    const parsedParticipants = rawParticipants ? Number.parseInt(rawParticipants, 10) : 1;
    return Number.isFinite(parsedParticipants) && parsedParticipants > 0 ? parsedParticipants : 1;
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

  private getForbiddenReservationMessage(): string {
    const role = this.authService.getRole();
    if (role && role !== 'CLIENT' && role !== 'ADMINISTRATEUR') {
      return `Reservations are currently blocked for the ${role} role. Please log in with a client account.`;
    }

    return 'You already have another active reservation for this event. Cancel it from My Reservations, or finish the existing one first, before creating a new reservation.';
  }

  private createReservationRequest(userId: number): void {
    if (!this.event) {
      this.isSubmitting = false;
      this.errorMessage = 'Event details are unavailable. Please reload the page.';
      return;
    }

    const remarks = this.remarks.trim();
    const reservationRequest: ReservationRequestDTO = {
      utilisateurId: userId,
      eventId: this.event.id,
      nombreParticipants: this.numberOfParticipants,
      ...(remarks ? { remarques: remarks } : {})
    };

    this.eventService.createReservation(reservationRequest).subscribe({
      next: (response: ReservationResponseDTO) => {
        this.isSubmitting = false;
        this.bookingSuccess = true;
        this.existingReservationConflict = null;
        this.successMessage = response.estEnAttente
          ? 'Your reservation was added to the waitlist. Finish the Stripe payment from My Reservations to hold your place in line.'
          : response.statut === 'CONFIRMED'
            ? `Reservation confirmed. Total: ${this.formatCurrency(response.prixTotal)}. You can now pay from My Reservations.`
            : `Reservation request received. Total: ${this.formatCurrency(response.prixTotal)}. It is now pending admin confirmation.`;

        setTimeout(() => {
          if (this.event) {
            this.closeBookingModal();
            this.loadEvent(this.event.id);
          }
        }, 2000);
      },
      error: (error: unknown) => {
        this.isSubmitting = false;

        const backendMessage = this.getBackendMessage(error);
        if (this.isDuplicateReservationMessage(backendMessage)) {
          this.hasReservationConflict = true;
          this.errorMessage = this.getExistingReservationConflictMessage();
        } else if (backendMessage) {
          this.hasReservationConflict = false;
          this.existingReservationConflict = null;
          this.errorMessage = backendMessage;
        } else if ((error as { status?: number })?.status === 403) {
          this.hasReservationConflict = true;
          this.errorMessage = this.getForbiddenReservationMessage();
        } else if ((error as { status?: number })?.status === 409) {
          this.hasReservationConflict = true;
          this.errorMessage = this.getExistingReservationConflictMessage();
        } else if ((error as { status?: number })?.status === 400) {
          this.hasReservationConflict = false;
          this.existingReservationConflict = null;
          this.errorMessage = 'Invalid reservation request. Please check your input.';
        } else {
          this.hasReservationConflict = false;
          this.existingReservationConflict = null;
          this.errorMessage = 'Failed to create reservation. Please try again.';
        }

        console.error('Error creating reservation:', error);
      }
    });
  }

  private checkExistingReservationConflictBeforeSubmit(userId: number): void {
    if (!this.event) {
      this.isSubmitting = false;
      this.errorMessage = 'Event details are unavailable. Please reload the page.';
      this.hasReservationConflict = false;
      this.existingReservationConflict = null;
      return;
    }

    this.eventService.getUserReservations(userId).subscribe({
      next: (reservations) => {
        const existingReservation = this.findActiveReservationForCurrentEvent(reservations);
        if (!existingReservation) {
          this.createReservationRequest(userId);
          return;
        }

        this.isSubmitting = false;
        this.hasReservationConflict = true;
        this.existingReservationConflict = existingReservation;
        this.errorMessage = this.getExistingReservationConflictMessage(existingReservation);
      },
      error: (lookupError: unknown) => {
        console.warn('Could not pre-check existing reservations before submit:', lookupError);
        this.createReservationRequest(userId);
      }
    });
  }

  private findActiveReservationForCurrentEvent(
    reservations: ReservationResponseDTO[]
  ): ReservationResponseDTO | null {
    if (!this.event) {
      return null;
    }

    return reservations.find((reservation) =>
      reservation.eventId === this.event?.id && this.activeReservationStatuses.has(reservation.statut)
    ) ?? null;
  }

  private getExistingReservationConflictMessage(existingReservation?: ReservationResponseDTO | null): string {
    if (!existingReservation) {
      return 'You already have another reservation for this event. Cancel it from My Reservations, or finish the existing one first, before making a new reservation.';
    }

    if (existingReservation.statut === 'PENDING') {
      return existingReservation.estEnAttente
        ? existingReservation.statutPaiement === 'PAID'
          ? 'You already have a paid waitlist reservation for this event. Wait for a seat to open, or cancel it from My Reservations before creating another one.'
          : 'You already have a waitlist reservation for this event. Complete the Stripe payment from My Reservations to hold your place in line, or cancel it before creating another one.'
        : 'You already have a pending reservation for this event. Cancel it from My Reservations, or wait for the admin review before trying to create another one.';
    }

    if (existingReservation.statut === 'CONFIRMED' && existingReservation.statutPaiement !== 'PAID') {
      return 'You already have a confirmed reservation for this event. Cancel it from My Reservations, or complete the payment first before making another one.';
    }

    if (existingReservation.statut === 'PAID' || existingReservation.statutPaiement === 'PAID') {
      return 'You already have a paid reservation for this event. If you need a different booking, cancel the current reservation from My Reservations before creating another one.';
    }

    return 'You already have another active reservation for this event. Cancel it from My Reservations, or finish it first, before creating a new reservation.';
  }

  private isDuplicateReservationMessage(message: string | null): boolean {
    if (!message) {
      return false;
    }

    const normalizedMessage = message.toLowerCase();
    return normalizedMessage.includes('active reservation')
      || (normalizedMessage.includes('already have') && normalizedMessage.includes('event'))
      || normalizedMessage.includes('waitlist entry');
  }

  private extractUserId(userInfo: unknown): number | null {
    const candidate = (userInfo as { id?: unknown; utilisateurId?: unknown; userId?: unknown } | null);
    const rawUserId = candidate?.id ?? candidate?.utilisateurId ?? candidate?.userId;
    const resolvedUserId = typeof rawUserId === 'string' ? Number(rawUserId) : rawUserId;
    return typeof resolvedUserId === 'number' && Number.isFinite(resolvedUserId) && resolvedUserId > 0
      ? resolvedUserId
      : null;
  }

  private formatCurrency(amount: number): string {
    return this.currencyFormatter.format(Number(amount || 0));
  }
}
