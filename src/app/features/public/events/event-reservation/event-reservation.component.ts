import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastMessageHost } from '../../../../core/utils/toast-message-host';
import {
  EventResponseDTO,
  PromotionPreviewDTO,
  ReservationRequestDTO,
  ReservationResponseDTO
} from '../models/event.model';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-event-reservation',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminIconComponent],
  templateUrl: './event-reservation.component.html',
  styleUrl: './event-reservation.component.css'
})
export class EventReservationComponent extends ToastMessageHost implements OnInit {
  readonly fallbackImageUrl = 'assets/images/default-image.jpg';
  readonly activeReservationStatuses = new Set(['PENDING', 'CONFIRMED', 'PAID']);
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  event: EventResponseDTO | null = null;

  isLoading = false;
  isSubmitting = false;
  hasReservationConflict = false;
  existingReservationConflict: ReservationResponseDTO | null = null;

  numberOfParticipants = 1;
  remarks = '';
  remarksExpanded = false;
  totalPrice = 0;
  promoCodeInput = '';
  promoFeedbackMessage = '';
  pricingPreview: PromotionPreviewDTO | null = null;
  isLoadingPricing = false;

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
    this.checkAuth();
    const eventId = this.route.snapshot.paramMap.get('id');
    const parsedEventId = eventId ? Number.parseInt(eventId, 10) : Number.NaN;
    const preferredParticipants = this.getInitialParticipants();
    this.promoCodeInput = (this.route.snapshot.queryParamMap.get('promoCode') || '').trim().toUpperCase();

    if (!Number.isFinite(parsedEventId) || parsedEventId <= 0) {
      this.errorMessage = 'This reservation page could not find a valid event. Please go back and try again.';
      return;
    }

    this.loadEvent(parsedEventId, preferredParticipants);
  }

  checkAuth(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (!this.isLoggedIn) {
      const currentUrl = this.router.url;
      this.authService.setReturnUrl(currentUrl);
      this.router.navigate(['/login']);
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
        const maxParticipants = Math.max(1, Math.min(data.capaciteMax ?? 1, 100));
        this.numberOfParticipants = Math.max(1, Math.min(preferredParticipants, maxParticipants));
        this.totalPrice = data.prix * this.numberOfParticipants;
        this.pricingPreview = null;
        this.promoFeedbackMessage = '';

        if (!this.isReservationClosed()) {
          this.calculatePrice();
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

  calculatePrice(): void {
    if (!this.event) {
      return;
    }

    this.isLoadingPricing = true;

    this.eventService.previewReservationPricing(
      this.event.id,
      this.numberOfParticipants,
      this.getNormalizedPromoCode() || undefined
    ).subscribe({
      next: (preview) => {
        const hasManualPromoCode = Boolean(this.getNormalizedPromoCode());
        this.pricingPreview = preview;
        this.totalPrice = preview.totalPrice;
        this.promoFeedbackMessage = hasManualPromoCode ? (preview.validationMessage || '') : '';
        this.isLoadingPricing = false;
      },
      error: (error) => {
        console.error('Error calculating price:', error);
        this.pricingPreview = null;
        this.totalPrice = this.event!.prix * this.numberOfParticipants;
        this.promoFeedbackMessage = this.getNormalizedPromoCode()
          ? this.getBackendMessage(error) || 'We could not validate that promo code right now.'
          : '';
        this.isLoadingPricing = false;
      }
    });
  }

  increaseParticipants(): void {
    if (this.isReservationClosed()) {
      return;
    }

    const maxParticipants = this.getParticipantLimit();
    if (this.numberOfParticipants < maxParticipants) {
      this.numberOfParticipants++;
      this.calculatePrice();
    }
  }

  decreaseParticipants(): void {
    if (this.isReservationClosed()) {
      return;
    }

    if (this.numberOfParticipants > 1) {
      this.numberOfParticipants--;
      this.calculatePrice();
    }
  }

  applyPromoCode(): void {
    if (this.isReservationClosed()) {
      return;
    }

    this.promoCodeInput = this.getNormalizedPromoCode();
    this.calculatePrice();
  }

  clearPromoCode(): void {
    if (this.isReservationClosed()) {
      return;
    }

    this.promoCodeInput = '';
    this.promoFeedbackMessage = '';
    this.calculatePrice();
  }

  toggleRemarks(): void {
    if (this.isReservationClosed()) {
      return;
    }

    this.remarksExpanded = !this.remarksExpanded;
  }

  submitReservation(): void {
    if (this.isReservationClosed()) {
      this.errorMessage = this.getReservationClosedMessage();
      this.hasReservationConflict = false;
      this.existingReservationConflict = null;
      return;
    }

    if (!this.event || this.numberOfParticipants <= 0) {
      console.error('Invalid reservation data:', {
        event: this.event?.id || 'missing',
        participants: this.numberOfParticipants || 'missing'
      });
      this.errorMessage = 'Invalid reservation data. Please check the selected event and participant count.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.hasReservationConflict = false;
    this.existingReservationConflict = null;
    this.checkExistingReservationConflictBeforeSubmit();
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

  isWaitlistLikely(): boolean {
    return !this.isReservationClosed() && this.numberOfParticipants > this.getAvailableSeats();
  }

  isEventFull(): boolean {
    return (this.event?.availableSeats || 0) === 0;
  }

  isReservationClosed(): boolean {
    const status = this.getNormalizedEventStatus();
    return status === 'COMPLETED' || status === 'CANCELLED';
  }

  isAlmostFull(): boolean {
    return Boolean(this.event?.isAlmostFull);
  }

  getCapacitySupportCopy(): string {
    if (!this.event) {
      return 'Capacity details will appear here once the event loads.';
    }

    if (this.isReservationClosed()) {
      return this.getReservationClosedMessage();
    }

    if (this.isEventFull()) {
      return this.event.waitlistCount > 0
        ? `${this.event.waitlistCount} guest${this.event.waitlistCount === 1 ? '' : 's'} are already waiting for a seat, so new requests are very likely to stay on the waitlist.`
        : 'The event is fully booked right now, so new reservations are very likely to stay on the waitlist.';
    }

    if (this.isAlmostFull()) {
      return `${this.getAvailableSeats()} seat${this.getAvailableSeats() === 1 ? '' : 's'} remain. This event is close to capacity and may switch to waitlist mode soon.`;
    }

    return `${this.getAvailableSeats()} seats are still available right now, with ${this.event.waitlistCount || 0} guests already waiting behind the live capacity.`;
  }

  requiresReservationApproval(): boolean {
    return this.event?.reservationApprovalRequired !== false;
  }

  getReservationNextStateLabel(): string {
    if (this.isReservationClosed()) {
      return 'Reservations closed';
    }

    if (this.isWaitlistLikely()) {
      return 'Waitlist + payment required';
    }

    return this.requiresReservationApproval() ? 'Pending approval' : 'Confirmed right away';
  }

  getReservationReviewCopy(): string {
    if (this.isReservationClosed()) {
      return this.getReservationClosedMessage();
    }

    return this.requiresReservationApproval()
      ? 'Your reservation will be created as pending and confirmed by the admin team.'
      : 'Your reservation will be confirmed immediately while seats are still available.';
  }

  getUrgencyBadgeLabel(): string {
    if (this.isReservationClosed()) {
      return 'Reservations closed';
    }

    const availableSeats = this.getAvailableSeats();

    if (availableSeats <= 0) {
      return 'Waitlist only';
    }

    if (availableSeats <= 10) {
      return `Only ${availableSeats} spot${availableSeats === 1 ? '' : 's'} left`;
    }

    return `${availableSeats} spots open`;
  }

  getGuestCountLabel(): string {
    return `${this.numberOfParticipants} guest${this.numberOfParticipants === 1 ? '' : 's'}`;
  }

  getHeroSupportLabel(): string {
    if (this.isReservationClosed()) {
      return this.getStatusLabel(this.event?.statut || 'COMPLETED');
    }

    if ((this.event?.favoriteCount ?? 0) >= 10) {
      return 'Popular pick';
    }

    if (this.isAlmostFull()) {
      return 'Trending now';
    }

    return 'Live booking';
  }

  getHeroSupportMeta(): string {
    if (this.isReservationClosed()) {
      return this.getNormalizedEventStatus() === 'COMPLETED'
        ? 'Finished experience'
        : 'Booking unavailable';
    }

    if ((this.event?.favoriteCount ?? 0) > 0) {
      return `Saved by ${this.event?.favoriteCount} guest${this.event?.favoriteCount === 1 ? '' : 's'}`;
    }

    return `${this.event?.organizerNom || 'CampConnect'} host`;
  }

  getDurationLabel(): string {
    const minutes = this.event?.dureeMinutes ?? 0;

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainder = minutes % 60;
      return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
    }

    return `${minutes} min`;
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

  getCategoryLabel(category: string): string {
    const categoryMap: Record<string, string> = {
      GUIDED_TOUR: 'Guided Tour',
      CAMPING_ACTIVITY: 'Camping Activity',
      WORKSHOP: 'Workshop',
      WELLNESS: 'Wellness',
      RESTORATION: 'Restoration',
      SOCIAL_EVENT: 'Social Event',
      ADVENTURE: 'Adventure',
      EDUCATIONAL: 'Educational'
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

  getEventImageUrl(): string {
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

  goBack(): void {
    this.router.navigate(['/public/events']);
  }

  goToEventDetails(): void {
    if (!this.event) {
      this.goBack();
      return;
    }

    const normalizedPromoCode = this.getNormalizedPromoCode();
    this.router.navigate(['/public/events', this.event.id], {
      queryParams: {
        participants: this.numberOfParticipants,
        ...(normalizedPromoCode ? { promoCode: normalizedPromoCode } : {})
      }
    });
  }

  goToMyReservations(reservationId?: number | null): void {
    this.router.navigate(['/public/events/my-reservations'], {
      queryParams: reservationId ? { focusReservation: reservationId } : undefined
    });
  }

  getBasePriceTotal(): number {
    return this.pricingPreview?.basePriceTotal ?? this.getTotalPrice();
  }

  getDiscountAmount(): number {
    return this.pricingPreview?.discountAmount ?? 0;
  }

  getFinalTotal(): number {
    const previewTotal = this.pricingPreview?.totalPrice;
    return typeof previewTotal === 'number' ? previewTotal : (this.totalPrice || this.getTotalPrice());
  }

  hasDiscountApplied(): boolean {
    return this.getDiscountAmount() > 0;
  }

  hasPromoCodeValue(): boolean {
    return Boolean(this.getNormalizedPromoCode());
  }

  getPromoFeedbackClass(): string {
    if (this.pricingPreview?.invalidPromoCode) {
      return 'promo-feedback warning';
    }

    if (this.hasDiscountApplied()) {
      return 'promo-feedback success';
    }

    return 'promo-feedback';
  }

  getPromoFeedbackText(): string {
    if (!this.hasPromoCodeValue()) {
      return '';
    }

    if (this.pricingPreview?.invalidPromoCode) {
      return this.promoFeedbackMessage || 'That code is not available for this reservation.';
    }

    if (this.hasDiscountApplied()) {
      const promoCode = this.getNormalizedPromoCode();
      return promoCode
        ? `${promoCode} applied: -${this.formatCurrency(this.getDiscountAmount())}`
        : `Discount applied: -${this.formatCurrency(this.getDiscountAmount())}`;
    }

    if (this.promoFeedbackMessage) {
      return this.promoFeedbackMessage;
    }

    if (this.pricingPreview?.discountLabel) {
      return this.pricingPreview.discountLabel;
    }

    return 'Promo code checked.';
  }

  shouldShowPromoFeedback(): boolean {
    return Boolean(this.getPromoFeedbackText());
  }

  getErrorTitle(): string {
    return this.hasReservationConflict ? 'Reservation already exists' : 'Something went wrong';
  }

  getErrorActionLabel(): string {
    if (!this.hasReservationConflict) {
      return 'Back to Events';
    }

    if (this.existingReservationConflict?.statutPaiement !== 'PAID'
      && (this.existingReservationConflict?.statut === 'CONFIRMED'
        || this.existingReservationConflict?.estEnAttente)) {
      return 'Go to Payment';
    }

    return 'View My Reservations';
  }

  handleErrorAction(): void {
    if (this.hasReservationConflict) {
      this.goToMyReservations(this.existingReservationConflict?.id);
      return;
    }

    this.goBack();
  }

  private getNormalizedPromoCode(): string {
    return this.promoCodeInput.trim().toUpperCase();
  }

  getSummaryTotalLabel(): string {
    if (this.isReservationClosed()) {
      return 'Reference price';
    }

    return this.isImmediatePaymentFlow() ? 'Total due today' : 'Estimated total';
  }

  getSummaryLineItemLabel(): string {
    return `${this.formatCurrency(this.event?.prix || 0)} x ${this.getGuestCountLabel()}`;
  }

  getPromoLineItemLabel(): string {
    const promoCode = this.getNormalizedPromoCode();
    return promoCode ? `${promoCode} discount` : 'Discount';
  }

  getPrimaryActionLabel(): string {
    if (this.isReservationClosed()) {
      return this.getNormalizedEventStatus() === 'COMPLETED'
        ? 'Event Completed - Reservations Closed'
        : 'Reservations Closed';
    }

    return this.isImmediatePaymentFlow() ? 'Proceed to Secure Payment' : 'Submit Reservation Request';
  }

  getPrimaryActionHelperCopy(): string {
    if (this.isReservationClosed()) {
      return this.getReservationClosedMessage();
    }

    if (this.isWaitlistLikely()) {
      return 'You will be taken to Stripe next to secure your waitlist position.';
    }

    return this.requiresReservationApproval()
      ? 'You will not be charged yet. Payment opens only after the organizer confirms the reservation.'
      : 'You will review the final payment securely on Stripe in the next step.';
  }

  isImmediatePaymentFlow(): boolean {
    return !this.isReservationClosed() && (this.isWaitlistLikely() || !this.requiresReservationApproval());
  }

  getReservationFlowTitle(): string {
    if (this.isReservationClosed()) {
      return 'Reservations are closed';
    }

    return this.isWaitlistLikely()
      ? 'Waitlist place protected'
      : this.requiresReservationApproval()
        ? 'Approval happens first'
        : 'Instant confirmation available';
  }

  getReservationFlowCopy(): string {
    if (this.isReservationClosed()) {
      return this.getNormalizedEventStatus() === 'COMPLETED'
        ? 'This event is completed, so we no longer accept reservations or waitlist entries.'
        : 'This event is not accepting new reservations or waitlist entries.';
    }

    return this.isWaitlistLikely()
      ? 'Your payment holds your place in line.'
      : this.requiresReservationApproval()
        ? 'You pay only after the organizer confirms.'
        : 'You can continue straight to Stripe after this step.';
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

  private getReservationClosedMessage(): string {
    return this.getNormalizedEventStatus() === 'COMPLETED'
      ? 'This event is completed, so we do not accept reservations or waitlist entries anymore.'
      : 'This event is not open for new reservations or waitlist entries anymore.';
  }

  private getNormalizedEventStatus(): string {
    return String(this.event?.statut || '').toUpperCase();
  }

  private getForbiddenReservationMessage(): string {
    const role = this.authService.getRole();
    if (role && role !== 'CLIENT' && role !== 'ADMINISTRATEUR') {
      return `Reservations are currently blocked for the ${role} role. Please log in with a client account.`;
    }

    return 'You already have another active reservation for this event. Cancel it from My Reservations, or finish the existing one first, before creating a new reservation.';
  }

  private createReservationRequest(): void {
    if (!this.event) {
      this.isSubmitting = false;
      this.errorMessage = 'Event details are unavailable. Please reload the page.';
      return;
    }

    const remarks = this.remarks.trim();
    const promoCode = this.getNormalizedPromoCode();
    const reservationRequest: ReservationRequestDTO = {
      eventId: this.event.id,
      nombreParticipants: this.numberOfParticipants,
      ...(remarks ? { remarques: remarks } : {}),
      ...(promoCode ? { promoCode } : {})
    };

    this.eventService.createReservation(reservationRequest).subscribe({
      next: (response: ReservationResponseDTO) => {
        if (this.canContinueToStripe(response)) {
          this.successMessage = response.estEnAttente
            ? 'Waitlist reservation created. Opening secure Stripe payment...'
            : 'Reservation confirmed. Opening secure Stripe payment...';
          this.startCheckoutForReservation(response);
          return;
        }

        this.isSubmitting = false;
        this.successMessage = `Reservation request received. Total: ${this.formatCurrency(response.prixTotal)}. It is now pending admin confirmation.`;
        this.navigateToReservationState(response);
      },
      error: (error: unknown) => {
        this.isSubmitting = false;

        console.error('Reservation error:', {
          status: (error as { status?: number })?.status,
          message: (error as { error?: { message?: string } })?.error?.message,
          fullError: error
        });

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

  private checkExistingReservationConflictBeforeSubmit(): void {
    if (!this.event) {
      this.isSubmitting = false;
      this.errorMessage = 'Event details are unavailable. Please reload the page.';
      this.hasReservationConflict = false;
      return;
    }

    this.eventService.getMyReservations().subscribe({
      next: (reservations) => {
        const existingReservation = this.findActiveReservationForCurrentEvent(reservations);
        if (!existingReservation) {
          this.createReservationRequest();
          return;
        }

        this.isSubmitting = false;
        this.hasReservationConflict = true;
        this.existingReservationConflict = existingReservation;
        this.errorMessage = this.getExistingReservationConflictMessage(existingReservation);
      },
      error: (lookupError: unknown) => {
        console.warn('Could not pre-check existing reservations before submit:', lookupError);
        this.createReservationRequest();
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

  private formatCurrency(amount: number): string {
    return this.currencyFormatter.format(Number(amount || 0));
  }

  private canContinueToStripe(reservation: ReservationResponseDTO): boolean {
    return reservation.statut === 'CONFIRMED'
      || (reservation.estEnAttente && reservation.statut === 'PENDING');
  }

  private startCheckoutForReservation(reservation: ReservationResponseDTO): void {
    this.eventService.createCheckoutSession(reservation.id).subscribe({
      next: (session) => {
        if (!session.checkoutUrl) {
          this.isSubmitting = false;
          this.successMessage = 'Reservation created. Continue from My Reservations to finish payment.';
          this.navigateToReservationState(reservation);
          return;
        }

        window.location.assign(session.checkoutUrl);
      },
      error: (error) => {
        console.error('Error creating Stripe checkout session:', error);
        this.isSubmitting = false;
        this.successMessage = 'Reservation created. We could not open Stripe automatically, so we are taking you to My Reservations.';
        this.navigateToReservationState(reservation);
      }
    });
  }

  private navigateToReservationState(response: ReservationResponseDTO): void {
    setTimeout(() => {
      this.router.navigate(['/public/events/my-reservations'], {
        queryParams: {
          focusReservation: response.id,
          created: response.estEnAttente
            ? 'waitlist'
            : response.statut === 'CONFIRMED'
              ? 'confirmed'
              : 'pending'
        }
      });
    }, 1800);
  }
}
