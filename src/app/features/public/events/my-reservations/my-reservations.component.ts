import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastMessageHost } from '../../../../core/utils/toast-message-host';
import {
  ReservationFeedbackRequestDTO,
  ReservationResponseDTO,
  UserNotificationResponseDTO,
  UserReservationStatsDTO
} from '../models/event.model';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminIconComponent],
  templateUrl: './my-reservations.component.html',
  styleUrl: './my-reservations.component.css'
})
export class MyReservationsComponent extends ToastMessageHost implements OnInit {
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  reservations: ReservationResponseDTO[] = [];
  filteredReservations: ReservationResponseDTO[] = [];
  billingReservations: ReservationResponseDTO[] = [];
  notifications: UserNotificationResponseDTO[] = [];
  stats: UserReservationStatsDTO | null = null;

  isLoading = false;
  isLoadingStats = false;
  isLoadingNotifications = false;
  isLoggedIn = false;
  noReservationsMessage = '';

  selectedStatusFilter = 'all';
  sortBy = 'recent';
  processingPaymentReservationId: number | null = null;
  downloadingReceiptReservationId: number | null = null;
  downloadingCalendarReservationId: number | null = null;
  submittingFeedbackReservationId: number | null = null;
  markingNotificationId: number | null = null;
  focusReservationId: number | null = null;
  activeDashboardSection = 'dashboard-overview';
  unreadNotificationCount = 0;
  feedbackDrafts: Record<number, ReservationFeedbackRequestDTO> = {};

  readonly statusFilters = [
    { value: 'all', label: 'All reservations' },
    { value: 'PENDING', label: 'Pending / waitlist' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PAID', label: 'Paid' },
    { value: 'ATTENDED', label: 'Attended' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  readonly sortOptions = [
    { value: 'recent', label: 'Most recent first' },
    { value: 'upcoming', label: 'Upcoming event date' },
    { value: 'price-high', label: 'Highest total' },
    { value: 'price-low', label: 'Lowest total' }
  ];

  readonly dashboardSections = [
    {
      id: 'dashboard-overview',
      label: 'Summary',
      description: 'Live booking counts and the next actions that matter most',
      icon: 'dashboard',
      tone: 'tone-forest'
    },
    {
      id: 'notification-center',
      label: 'Notifications',
      description: 'Stay on top of confirmations, payments, waitlist changes, and refunds',
      icon: 'sparkles',
      tone: 'tone-sky'
    },
    {
      id: 'billing-center',
      label: 'Billing Center',
      description: 'View bill history, reopen Stripe invoices, and download receipts',
      icon: 'wallet',
      tone: 'tone-gold'
    },
    {
      id: 'reservation-history',
      label: 'History',
      description: 'Scan upcoming, past, cancelled, and paid reservations in one place',
      icon: 'clock',
      tone: 'tone-plum'
    }
  ];

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
    if (this.isLoggedIn) {
      this.handleReservationEntry();
    }
  }

  checkAuth(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (!this.isLoggedIn) {
      this.errorMessage = 'Please log in to view your reservations.';
    }
  }

  loadReservations(options: { preserveMessages?: boolean } = {}): void {
    this.loadStats();
    this.loadNotifications();
    this.isLoading = true;
    if (!options.preserveMessages) {
      this.errorMessage = '';
      this.successMessage = '';
    }
    this.noReservationsMessage = '';

    this.eventService.getMyReservations().subscribe({
      next: (data) => {
        this.reservations = data;
        this.initializeFeedbackDrafts();
        this.updateBillingReservations();
        this.applyFilters();
        this.isLoading = false;
        this.focusReservationCard();

        if (data.length === 0) {
          this.noReservationsMessage = 'You have not made any reservations yet.';
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to load reservations. Please try again.';
        console.error('Error loading reservations:', error);
        this.isLoading = false;
        this.feedbackDrafts = {};
      }
    });
  }

  refreshReservations(): void {
    if (this.isLoggedIn) {
      this.loadReservations();
    }
  }

  refreshNotifications(): void {
    if (this.isLoggedIn) {
      this.loadNotifications();
    }
  }

  loadStats(): void {
    this.isLoadingStats = true;

    this.eventService.getMyReservationStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.warn('Could not load reservation stats:', error);
        this.isLoadingStats = false;
      }
    });
  }

  loadNotifications(): void {
    this.isLoadingNotifications = true;

    this.eventService.getMyNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.unreadNotificationCount = notifications.filter((notification) => !notification.read).length;
        this.isLoadingNotifications = false;
      },
      error: (error) => {
        console.warn('Could not load reservation notifications:', error);
        this.notifications = [];
        this.unreadNotificationCount = 0;
        this.isLoadingNotifications = false;
      }
    });
  }

  startPayment(reservation: ReservationResponseDTO): void {
    if (!this.canPay(reservation) || this.processingPaymentReservationId === reservation.id) {
      return;
    }

    this.processingPaymentReservationId = reservation.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.createCheckoutSession(reservation.id).subscribe({
      next: (session) => {
        if (!session.checkoutUrl) {
          this.processingPaymentReservationId = null;
          this.errorMessage = 'Stripe checkout URL is missing from the backend response.';
          return;
        }

        window.location.assign(session.checkoutUrl);
      },
      error: (error) => {
        this.processingPaymentReservationId = null;
        this.errorMessage = this.getBackendMessage(error)
          || 'Failed to start Stripe checkout. Please try again.';
        console.error('Error creating Stripe checkout session:', error);
      }
    });
  }

  downloadReceipt(reservation: ReservationResponseDTO): void {
    if (!this.canDownloadReceipt(reservation) || this.downloadingReceiptReservationId === reservation.id) {
      return;
    }

    this.downloadingReceiptReservationId = reservation.id;
    this.errorMessage = '';

    this.eventService.downloadReservationReceipt(reservation.id).subscribe({
      next: (receiptBlob) => {
        const receiptUrl = window.URL.createObjectURL(receiptBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = receiptUrl;
        downloadLink.download = this.getReceiptFilename(reservation);
        downloadLink.click();
        window.URL.revokeObjectURL(receiptUrl);
        this.downloadingReceiptReservationId = null;
      },
      error: (error) => {
        this.downloadingReceiptReservationId = null;
        this.errorMessage = this.getBackendMessage(error)
          || 'We could not generate the reservation receipt right now. Please try again.';
        console.error('Error downloading reservation receipt:', error);
      }
    });
  }

  downloadCalendarInvite(reservation: ReservationResponseDTO): void {
    if (!this.hasCalendarInviteDownload(reservation)
      || this.downloadingCalendarReservationId === reservation.id) {
      return;
    }

    this.downloadingCalendarReservationId = reservation.id;
    this.errorMessage = '';

    this.eventService.downloadReservationCalendarInvite(reservation.id).subscribe({
      next: (calendarBlob) => {
        const calendarUrl = window.URL.createObjectURL(calendarBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = calendarUrl;
        downloadLink.download = this.getCalendarFilename(reservation);
        downloadLink.click();
        window.URL.revokeObjectURL(calendarUrl);
        this.downloadingCalendarReservationId = null;
      },
      error: (error) => {
        this.downloadingCalendarReservationId = null;
        this.errorMessage = this.getBackendMessage(error)
          || 'We could not prepare the calendar file right now. Please try again.';
        console.error('Error downloading reservation calendar invite:', error);
      }
    });
  }

  getFeedbackDraft(reservation: ReservationResponseDTO): ReservationFeedbackRequestDTO {
    const existingDraft = this.feedbackDrafts[reservation.id];
    if (existingDraft) {
      return existingDraft;
    }

    const draft: ReservationFeedbackRequestDTO = {
      rating: reservation.feedbackRating ?? 5,
      comment: reservation.feedbackComment ?? ''
    };
    this.feedbackDrafts[reservation.id] = draft;
    return draft;
  }

  canShowFeedbackComposer(reservation: ReservationResponseDTO): boolean {
    return Boolean(reservation.feedbackEligible) || Boolean(reservation.feedbackSubmittedAt);
  }

  hasSubmittedFeedback(reservation: ReservationResponseDTO): boolean {
    return Boolean(reservation.feedbackSubmittedAt && reservation.feedbackRating);
  }

  isSubmittingFeedback(reservationId: number): boolean {
    return this.submittingFeedbackReservationId === reservationId;
  }

  getFeedbackStars(reservation: ReservationResponseDTO): string {
    const rating = Number(reservation.feedbackRating || 0);
    if (!rating) {
      return '';
    }

    return `${rating}/5`;
  }

  submitFeedback(reservation: ReservationResponseDTO): void {
    if (!this.canShowFeedbackComposer(reservation) || this.isSubmittingFeedback(reservation.id)) {
      return;
    }

    const draft = this.getFeedbackDraft(reservation);
    if (!draft.rating || draft.rating < 1 || draft.rating > 5) {
      this.errorMessage = 'Choose a rating between 1 and 5 before sending your feedback.';
      return;
    }

    this.submittingFeedbackReservationId = reservation.id;
    this.errorMessage = '';

    this.eventService.submitReservationFeedback(reservation.id, draft).subscribe({
      next: (updatedReservation) => {
        this.replaceReservation(updatedReservation);
        this.feedbackDrafts[reservation.id] = {
          rating: updatedReservation.feedbackRating ?? draft.rating,
          comment: updatedReservation.feedbackComment ?? draft.comment ?? ''
        };
        this.successMessage = 'Your feedback was saved. Thanks for helping improve the event experience.';
        this.submittingFeedbackReservationId = null;
      },
      error: (error) => {
        this.submittingFeedbackReservationId = null;
        this.errorMessage = this.getBackendMessage(error)
          || 'We could not save your feedback right now. Please try again.';
        console.error('Error submitting reservation feedback:', error);
      }
    });
  }

  payNextReservation(): void {
    const nextReservation = this.getNextPayableReservation();
    if (nextReservation) {
      this.startPayment(nextReservation);
    }
  }

  resetFilters(): void {
    this.selectedStatusFilter = 'all';
    this.sortBy = 'recent';
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.reservations];

    if (this.selectedStatusFilter !== 'all') {
      filtered = filtered.filter((reservation) => reservation.statut === this.selectedStatusFilter);
    }

    this.sortReservations(filtered);
    this.filteredReservations = filtered;
  }

  sortReservations(reservations: ReservationResponseDTO[]): void {
    switch (this.sortBy) {
      case 'recent':
        reservations.sort((a, b) =>
          new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
        );
        break;
      case 'upcoming':
        reservations.sort((a, b) =>
          new Date(a.eventDateDebut).getTime() - new Date(b.eventDateDebut).getTime()
        );
        break;
      case 'price-high':
        reservations.sort((a, b) => b.prixTotal - a.prixTotal);
        break;
      case 'price-low':
        reservations.sort((a, b) => a.prixTotal - b.prixTotal);
        break;
    }
  }

  cancelReservation(reservation: ReservationResponseDTO): void {
    const confirmMessage = this.getCancellationConfirmationMessage(reservation);
    if (!confirm(confirmMessage)) {
      return;
    }

    this.isLoading = true;
    this.eventService.cancelReservation(reservation.id).subscribe({
      next: () => {
        this.successMessage = this.getCancellationSuccessMessage(reservation);
        this.loadReservations({ preserveMessages: true });
      },
      error: (error) => {
        this.errorMessage = this.getBackendMessage(error)
          || 'Failed to cancel reservation. Please try again.';
        console.error('Error cancelling reservation:', error);
        this.isLoading = false;
      }
    });
  }

  jumpToSection(sectionId: string): void {
    this.activeDashboardSection = sectionId;
  }

  viewEventDetails(eventId: number): void {
    this.router.navigate(['/public/events', eventId]);
  }

  openNotification(notification: UserNotificationResponseDTO): void {
    if (!notification.read) {
      this.markNotificationAsRead(notification, false);
    }

    if (notification.reservationId) {
      this.goToReservationCard(notification.reservationId);
      return;
    }

    if (notification.eventId) {
      this.viewEventDetails(notification.eventId);
    }
  }

  markNotificationAsRead(notification: UserNotificationResponseDTO, focusAfterRead = false): void {
    if (notification.read || this.markingNotificationId === notification.id) {
      return;
    }

    this.markingNotificationId = notification.id;
    this.eventService.markNotificationAsRead(notification.id).subscribe({
      next: (updatedNotification) => {
        this.notifications = this.notifications.map((currentNotification) =>
          currentNotification.id === updatedNotification.id ? updatedNotification : currentNotification
        );
        this.unreadNotificationCount = this.notifications.filter((currentNotification) => !currentNotification.read).length;
        this.markingNotificationId = null;

        if (focusAfterRead) {
          this.openNotification(updatedNotification);
        }
      },
      error: (error) => {
        this.markingNotificationId = null;
        console.error('Could not mark notification as read:', error);
      }
    });
  }

  markAllNotificationsAsRead(): void {
    if (this.unreadNotificationCount === 0) {
      return;
    }

    this.eventService.markAllNotificationsAsRead().subscribe({
      next: () => {
        const readAt = new Date().toISOString();
        this.notifications = this.notifications.map((notification) => ({
          ...notification,
          read: true,
          readAt
        }));
        this.unreadNotificationCount = 0;
      },
      error: (error) => {
        console.error('Could not mark all notifications as read:', error);
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'PAID':
        return 'status-paid';
      case 'ATTENDED':
        return 'status-confirmed';
      case 'CANCELLED':
        return 'status-cancelled';
      case 'NO_SHOW':
        return 'status-no-show';
      case 'REFUNDED':
        return 'status-refunded';
      default:
        return 'status-default';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'PAID':
        return 'payment-paid';
      case 'PENDING':
        return 'payment-pending';
      case 'FAILED':
        return 'payment-failed';
      case 'PARTIALLY_REFUNDED':
        return 'payment-partially-refunded';
      case 'REFUNDED':
        return 'payment-refunded';
      default:
        return 'payment-unpaid';
    }
  }

  getNotificationClass(notification: UserNotificationResponseDTO): string {
    switch (notification.type) {
      case 'BOOKING_CONFIRMED':
      case 'PAYMENT_CONFIRMED':
        return 'notification-confirmed';
      case 'WAITLIST_PROMOTED':
      case 'WAITLIST_OFFER_EXPIRED':
        return 'notification-promoted';
      case 'REFUND_PROCESSED':
        return 'notification-refund';
      case 'EVENT_REMINDER':
      case 'FEEDBACK_REQUESTED':
        return 'notification-default';
      default:
        return 'notification-default';
    }
  }

  getNotificationIcon(notification: UserNotificationResponseDTO): string {
    switch (notification.type) {
      case 'BOOKING_CONFIRMED':
        return 'check';
      case 'PAYMENT_CONFIRMED':
        return 'wallet';
      case 'WAITLIST_PROMOTED':
        return 'sparkles';
      case 'WAITLIST_OFFER_EXPIRED':
        return 'warning';
      case 'REFUND_PROCESSED':
        return 'refund';
      case 'EVENT_REMINDER':
        return 'calendar';
      case 'FEEDBACK_REQUESTED':
        return 'sparkles';
      default:
        return 'clock';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'clock';
      case 'CONFIRMED':
      case 'PAID':
      case 'ATTENDED':
        return 'check';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'close';
      case 'NO_SHOW':
        return 'warning';
      default:
        return 'reservations';
    }
  }

  formatStatusLabel(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return value
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  getPaymentStatusDisplay(status: string): string {
    switch (status) {
      case 'UNPAID':
        return 'Unpaid';
      case 'PENDING':
        return 'Payment pending';
      case 'PAID':
        return 'Paid';
      case 'PARTIALLY_REFUNDED':
        return 'Partially refunded';
      case 'FAILED':
        return 'Payment failed';
      case 'REFUNDED':
        return 'Refunded';
      default:
        return this.formatStatusLabel(status);
    }
  }

  formatDate(date: string | undefined): string {
    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(date: string | undefined): string {
    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number | null | undefined): string {
    return this.currencyFormatter.format(Number(amount || 0));
  }

  trackByDashboardSection(_index: number, section: { id: string }): string {
    return section.id;
  }

  trackByNotificationId(_index: number, notification: UserNotificationResponseDTO): number {
    return notification.id;
  }

  trackByReservationId(_index: number, reservation: ReservationResponseDTO): number {
    return reservation.id;
  }

  trackByOptionValue(_index: number, option: { value: string }): string {
    return option.value;
  }

  canCancel(reservation: ReservationResponseDTO): boolean {
    if (typeof reservation.cancellationPolicy?.canCancel === 'boolean') {
      return reservation.cancellationPolicy.canCancel;
    }

    const eventDate = new Date(reservation.eventDateDebut);
    return ['PENDING', 'CONFIRMED', 'PAID'].includes(reservation.statut) && eventDate.getTime() > Date.now();
  }

  canPay(reservation: ReservationResponseDTO): boolean {
    return (reservation.statut === 'CONFIRMED'
      || (reservation.estEnAttente && reservation.statut === 'PENDING'))
      && reservation.statutPaiement !== 'PAID'
      && reservation.statutPaiement !== 'PARTIALLY_REFUNDED'
      && reservation.statutPaiement !== 'REFUNDED';
  }

  canDownloadReceipt(reservation: ReservationResponseDTO): boolean {
    return Boolean(reservation.receiptAvailable)
      || ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(reservation.statutPaiement);
  }

  canExportCalendar(reservation: ReservationResponseDTO): boolean {
    return Boolean(reservation.calendarExportAvailable)
      && (this.hasGoogleCalendarLink(reservation) || this.hasCalendarInviteDownload(reservation));
  }

  hasGoogleCalendarLink(reservation: ReservationResponseDTO): boolean {
    return Boolean(reservation.googleCalendarUrl);
  }

  hasCalendarInviteDownload(reservation: ReservationResponseDTO): boolean {
    return Boolean(reservation.calendarIcsDownloadUrl || reservation.calendarExportAvailable);
  }

  getPayableReservationsCount(): number {
    return this.reservations.filter((reservation) => this.canPay(reservation)).length;
  }

  getNextPayableReservation(): ReservationResponseDTO | null {
    let nextPayableReservation: ReservationResponseDTO | null = null;

    for (const reservation of this.reservations) {
      if (!this.canPay(reservation)) {
        continue;
      }

      if (!nextPayableReservation) {
        nextPayableReservation = reservation;
        continue;
      }

      const reservationDate = new Date(reservation.eventDateDebut).getTime();
      const nextReservationDate = new Date(nextPayableReservation.eventDateDebut).getTime();
      if (reservationDate < nextReservationDate) {
        nextPayableReservation = reservation;
      }
    }

    return nextPayableReservation;
  }

  get activeDashboardSectionMeta() {
    return this.dashboardSections.find((section) => section.id === this.activeDashboardSection) ?? this.dashboardSections[0];
  }

  getDashboardSectionCount(sectionId: string): number {
    switch (sectionId) {
      case 'dashboard-overview':
        return this.getTotalReservationsCount();
      case 'notification-center':
        return this.getUnreadNotificationsCount();
      case 'billing-center':
        return this.getBillsReadyCount();
      case 'reservation-history':
        return this.reservations.length;
      default:
        return 0;
    }
  }

  goToReservationCard(reservationId: number): void {
    this.focusReservationId = reservationId;
    this.activeDashboardSection = 'reservation-history';
    this.focusReservationCard();
  }

  isHighlightedReservation(reservationId: number): boolean {
    return this.focusReservationId === reservationId;
  }

  getReservationCardId(reservationId: number): string {
    return `reservation-card-${reservationId}`;
  }

  hasInvoice(reservation: ReservationResponseDTO): boolean {
    return Boolean(reservation.invoiceHostedUrl || reservation.invoicePdfUrl);
  }

  hasInvoicePage(reservation: ReservationResponseDTO): boolean {
    return Boolean(reservation.invoiceHostedUrl);
  }

  hasInvoicePdf(reservation: ReservationResponseDTO): boolean {
    return Boolean(reservation.invoicePdfUrl);
  }

  getInvoiceFilename(reservation: ReservationResponseDTO): string {
    const normalizedTitle = reservation.eventTitre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      || `reservation-${reservation.id}`;
    const invoiceReference = reservation.invoiceNumber || `reservation-${reservation.id}`;

    return `${invoiceReference}-${normalizedTitle}.pdf`;
  }

  getReceiptFilename(reservation: ReservationResponseDTO): string {
    const normalizedTitle = reservation.eventTitre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      || `reservation-${reservation.id}`;

    return `campconnect-receipt-${reservation.id}-${normalizedTitle}.pdf`;
  }

  getCalendarFilename(reservation: ReservationResponseDTO): string {
    if (reservation.calendarIcsFileName?.trim()) {
      return reservation.calendarIcsFileName.trim();
    }

    const normalizedTitle = reservation.eventTitre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      || `reservation-${reservation.id}`;

    return `campconnect-calendar-${reservation.id}-${normalizedTitle}.ics`;
  }

  getPaymentHintClass(reservation: ReservationResponseDTO): string {
    if (this.canPay(reservation)) {
      return 'payment-ready';
    }

    if (this.isPaidWaitlistReservation(reservation)) {
      return 'payment-complete';
    }

    if (reservation.estEnAttente) {
      return reservation.statutPaiement === 'PENDING' ? 'payment-pending' : 'payment-neutral';
    }

    if (reservation.statut === 'PENDING') {
      return 'payment-locked';
    }

    if (reservation.statutPaiement === 'PAID') {
      return 'payment-complete';
    }

    if (reservation.statutPaiement === 'PARTIALLY_REFUNDED') {
      return 'payment-partial';
    }

    if (reservation.statutPaiement === 'REFUNDED' || reservation.statut === 'CANCELLED' || reservation.statut === 'REFUNDED') {
      return 'payment-closed';
    }

    return 'payment-neutral';
  }

  getPaymentHintIcon(reservation: ReservationResponseDTO): string {
    if (this.canPay(reservation)) {
      return 'wallet';
    }

    if (this.isPaidWaitlistReservation(reservation)) {
      return 'check';
    }

    if (reservation.estEnAttente || reservation.statut === 'PENDING') {
      return 'clock';
    }

    if (reservation.statutPaiement === 'PAID') {
      return 'check';
    }

    if (reservation.statutPaiement === 'PARTIALLY_REFUNDED') {
      return 'warning';
    }

    if (reservation.statutPaiement === 'REFUNDED' || reservation.statut === 'CANCELLED' || reservation.statut === 'REFUNDED') {
      return 'close';
    }

    return 'info';
  }

  getPaymentHintTitle(reservation: ReservationResponseDTO): string {
    if (this.canPay(reservation)) {
      return reservation.estEnAttente ? 'Waitlist payment is ready' : 'Stripe payment is ready';
    }

    if (this.isPaidWaitlistReservation(reservation)) {
      return 'Waitlist payment secured';
    }

    if (reservation.estEnAttente) {
      return 'Waitlist payment is still pending';
    }

    if (reservation.statut === 'PENDING') {
      return 'Payment unlocks after confirmation';
    }

    if (reservation.statutPaiement === 'PAID') {
      return this.hasInvoice(reservation) ? 'Payment received and billed' : 'Payment received';
    }

    if (reservation.statutPaiement === 'PARTIALLY_REFUNDED') {
      return 'Partial refund completed';
    }

    if (reservation.statutPaiement === 'REFUNDED') {
      return 'Payment refunded';
    }

    if (reservation.statut === 'CANCELLED' || reservation.statut === 'REFUNDED') {
      return 'Payment is closed';
    }

    return 'Payment status';
  }

  getPaymentHintCopy(reservation: ReservationResponseDTO): string {
    if (this.canPay(reservation)) {
      if (reservation.estEnAttente) {
        return 'This booking is on the waitlist, and Stripe payment is required now to keep your place in line. If a seat opens, CampConnect moves it straight to paid. If not, the full payment is refunded automatically when the event starts.';
      }

      return 'This reservation is confirmed and ready for Stripe checkout. Use the payment button below whenever you are ready.';
    }

    if (this.isPaidWaitlistReservation(reservation)) {
      return 'Stripe already captured this waitlist payment. If a seat opens, CampConnect will move the booking straight to paid automatically. If not, the full amount is refunded when the event starts.';
    }

    if (reservation.estEnAttente) {
      return 'This reservation is still on the waitlist. Finish the Stripe payment to secure your place in line before the event starts.';
    }

    if (reservation.statut === 'PENDING') {
      return 'The admin team still needs to review and confirm this reservation. The Stripe payment button appears here immediately after confirmation.';
    }

    if (reservation.statutPaiement === 'PAID') {
      if (this.hasInvoice(reservation)) {
        const invoiceReference = reservation.invoiceNumber
          ? `Invoice ${reservation.invoiceNumber}`
          : 'Your Stripe bill';
        return `${invoiceReference} is ready below, and you can reopen it online, download the Stripe PDF, or save the CampConnect receipt.`;
      }

      return reservation.datePaiement
        ? `Stripe confirmed this payment on ${this.formatDate(reservation.datePaiement)} at ${this.formatTime(reservation.datePaiement)}. The receipt is available even if Stripe is still finalizing the invoice links.`
        : 'Stripe confirmed this reservation payment successfully. The receipt is ready now, and the Stripe bill will appear once invoice generation finishes.';
    }

    if (reservation.statutPaiement === 'PARTIALLY_REFUNDED') {
      return `This reservation was cancelled with a ${reservation.refundPercentage || 50}% refund. The billing center below keeps both the invoice trail and the final receipt available.`;
    }

    if (reservation.statutPaiement === 'REFUNDED') {
      return 'This payment has already been fully refunded. You can still reopen the billing record or download the receipt for your records.';
    }

    if (reservation.statut === 'CANCELLED' || reservation.statut === 'REFUNDED') {
      return 'This reservation is closed, so payment is no longer available.';
    }

    return 'Refresh the page if you are waiting for the latest payment update from Stripe.';
  }

  getCancellationPolicyClass(reservation: ReservationResponseDTO): string {
    if (reservation.statut === 'REFUNDED') {
      return 'policy-refunded';
    }

    if (reservation.statutPaiement === 'PARTIALLY_REFUNDED') {
      return 'policy-partial';
    }

    if (reservation.statut === 'CANCELLED' && reservation.statutPaiement === 'PAID') {
      return 'policy-no-refund';
    }

    switch (reservation.cancellationPolicy?.tier) {
      case 'FREE_CANCEL':
        return 'policy-free';
      case 'FULL_REFUND':
        return 'policy-full';
      case 'PARTIAL_REFUND':
        return 'policy-partial';
      case 'NO_REFUND':
        return 'policy-no-refund';
      default:
        return 'policy-closed';
    }
  }

  getCancellationPolicyIcon(reservation: ReservationResponseDTO): string {
    if (reservation.statut === 'REFUNDED') {
      return 'check';
    }

    if (reservation.statutPaiement === 'PARTIALLY_REFUNDED') {
      return 'warning';
    }

    if (reservation.cancellationPolicy?.tier === 'FULL_REFUND' || reservation.cancellationPolicy?.tier === 'FREE_CANCEL') {
      return 'check';
    }

    if (reservation.cancellationPolicy?.tier === 'PARTIAL_REFUND' || reservation.cancellationPolicy?.tier === 'NO_REFUND') {
      return 'warning';
    }

    return 'info';
  }

  getCancellationPolicyTitle(reservation: ReservationResponseDTO): string {
    if (reservation.statut === 'REFUNDED') {
      return 'Full refund completed';
    }

    if (reservation.statutPaiement === 'PARTIALLY_REFUNDED') {
      return 'Partial refund completed';
    }

    if (reservation.statut === 'CANCELLED' && reservation.statutPaiement === 'PAID') {
      return 'Cancelled after the refund window';
    }

    return reservation.cancellationPolicy?.title || 'Cancellation policy';
  }

  getCancellationPolicyCopy(reservation: ReservationResponseDTO): string {
    if (reservation.statut === 'REFUNDED') {
      return `Stripe returned ${this.formatCurrency(reservation.refundAmount ?? reservation.prixTotal)} for this cancelled reservation. The invoice trail and receipt remain available in the billing center.`;
    }

    if (reservation.statutPaiement === 'PARTIALLY_REFUNDED') {
      return `CampConnect processed a ${reservation.refundPercentage || 50}% refund worth ${this.formatCurrency(reservation.refundAmount)}. Your final receipt reflects the adjusted net paid amount of ${this.formatCurrency(reservation.netPaidAmount)}.`;
    }

    if (reservation.statut === 'CANCELLED' && reservation.statutPaiement === 'PAID') {
      return 'This reservation was cancelled inside the final 24-hour window, so the seat was released without a Stripe refund.';
    }

    if (!reservation.cancellationPolicy) {
      return 'Cancellation timing and refund eligibility will appear here once reservation details finish loading.';
    }

    const policy = reservation.cancellationPolicy;
    if (policy.tier === 'FULL_REFUND') {
      return `${policy.description} Eligible refund: ${this.formatCurrency(policy.eligibleRefundAmount)} until ${this.formatDate(policy.fullRefundDeadline)}.`;
    }

    if (policy.tier === 'PARTIAL_REFUND') {
      return `${policy.description} Eligible refund: ${this.formatCurrency(policy.eligibleRefundAmount)} until ${this.formatDate(policy.partialRefundDeadline)}.`;
    }

    return policy.description;
  }

  isUpcomingReservation(reservation: ReservationResponseDTO): boolean {
    return new Date(reservation.eventDateDebut).getTime() >= Date.now();
  }

  getReservationTone(reservation: ReservationResponseDTO): string {
    if (this.isPaidWaitlistReservation(reservation)) {
      return 'Paid waitlist hold';
    }

    if (reservation.estEnAttente) {
      return 'Waitlist payment due';
    }

    if (reservation.statut === 'ATTENDED') {
      return 'Attended event';
    }

    return this.isUpcomingReservation(reservation) ? 'Upcoming event' : 'Reservation history';
  }

  getTotalReservationsCount(): number {
    return this.stats?.totalReservations ?? this.reservations.length;
  }

  getUpcomingReservationsCount(): number {
    return this.stats?.upcomingBookings ?? this.reservations.filter((reservation) =>
      this.isUpcomingReservation(reservation) && reservation.statut !== 'CANCELLED' && reservation.statut !== 'REFUNDED'
    ).length;
  }

  getPendingReservationsCount(): number {
    return this.reservations.filter((reservation) => reservation.statut === 'PENDING').length;
  }

  getWaitlistReservationsCount(): number {
    return this.stats?.waitlistReservations ?? this.reservations.filter((reservation) => reservation.estEnAttente).length;
  }

  getUnreadNotificationsCount(): number {
    return this.unreadNotificationCount;
  }

  getEventsAttendedCount(): number {
    return this.stats?.eventsAttended ?? 0;
  }

  getBillsReadyCount(): number {
    return this.stats?.billedReservations ?? this.billingReservations.length;
  }

  getTotalSpentAmount(): number {
    return this.stats?.totalSpent ?? this.billingReservations.reduce(
      (total, reservation) => total + Number(reservation.netPaidAmount || 0),
      0
    );
  }

  getBillingTotalNetPaid(): number {
    return this.billingReservations.reduce(
      (total, reservation) => total + Number(reservation.netPaidAmount || 0),
      0
    );
  }

  hasReservationDiscount(reservation: ReservationResponseDTO): boolean {
    return Number(reservation.discountAmount || 0) > 0;
  }

  getReservationDiscountCopy(reservation: ReservationResponseDTO): string {
    const discountLabel = reservation.discountLabel || 'Promotion applied';
    const discountSource = reservation.discountAutoApplied
      ? 'This offer was applied automatically.'
      : reservation.promoCode
        ? `Promo code ${reservation.promoCode} was used.`
        : 'A booking discount was applied.';

    return `${discountLabel}. You saved ${this.formatCurrency(reservation.discountAmount)} off a base subtotal of ${this.formatCurrency(reservation.basePriceTotal)}. ${discountSource}`;
  }

  getLifecycleNoteClass(reservation: ReservationResponseDTO): string {
    switch (reservation.statut) {
      case 'ATTENDED':
        return 'payment-complete';
      case 'NO_SHOW':
      case 'CANCELLED':
      case 'REFUNDED':
        return 'payment-closed';
      case 'PENDING':
        return 'payment-locked';
      default:
        return 'payment-neutral';
    }
  }

  getLifecycleNoteIcon(reservation: ReservationResponseDTO): string {
    switch (reservation.statut) {
      case 'ATTENDED':
        return 'check';
      case 'NO_SHOW':
        return 'warning';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'close';
      case 'PENDING':
        return 'clock';
      default:
        return 'info';
    }
  }

  getLifecycleNoteTitle(reservation: ReservationResponseDTO): string {
    if (reservation.statusDescription?.trim()) {
      return reservation.statusDescription.trim();
    }

    switch (reservation.statut) {
      case 'ATTENDED':
        return 'Attendance recorded';
      case 'NO_SHOW':
        return 'Marked as no-show';
      case 'CANCELLED':
        return 'Reservation cancelled';
      case 'REFUNDED':
        return 'Reservation refunded';
      case 'PAID':
        return 'Reservation paid and ready';
      case 'CONFIRMED':
        return 'Reservation confirmed';
      default:
        return 'Reservation update';
    }
  }

  getLifecycleNoteCopy(reservation: ReservationResponseDTO): string {
    if (reservation.nextStepMessage?.trim()) {
      return reservation.nextStepMessage.trim();
    }

    switch (reservation.statut) {
      case 'ATTENDED':
        return 'This event has already finished, and CampConnect archived the reservation as attended for your history.';
      case 'NO_SHOW':
        return 'The event has already finished and this reservation was closed as a no-show.';
      case 'PAID':
        return 'Payment is complete, and the organizer will record attended or no-show during event check-in.';
      case 'CONFIRMED':
        return 'Your seat is reserved, but payment still needs to be completed before the event starts.';
      case 'PENDING':
        return reservation.estEnAttente
          ? 'This request is still waiting for a seat to open before it can move forward.'
          : 'The organizer still needs to review and confirm this reservation.';
      case 'CANCELLED':
        return 'This reservation is no longer active.';
      case 'REFUNDED':
        return 'Your refund has been completed for this reservation.';
      default:
        return 'CampConnect keeps the latest reservation state here so you can follow what happens next.';
    }
  }

  goToLogin(): void {
    this.authService.setReturnUrl('/public/events/my-reservations');
    this.router.navigate(['/login']);
  }

  goToEvents(): void {
    this.router.navigate(['/public/events']);
  }

  private updateBillingReservations(): void {
    this.billingReservations = [...this.reservations]
      .filter((reservation) => this.isBilledReservation(reservation))
      .sort((firstReservation, secondReservation) => {
        const firstDate = this.getBillingTimestamp(firstReservation);
        const secondDate = this.getBillingTimestamp(secondReservation);
        return secondDate - firstDate;
      });
  }

  private initializeFeedbackDrafts(): void {
    this.feedbackDrafts = this.reservations.reduce<Record<number, ReservationFeedbackRequestDTO>>((drafts, reservation) => {
      drafts[reservation.id] = {
        rating: reservation.feedbackRating ?? 5,
        comment: reservation.feedbackComment ?? ''
      };
      return drafts;
    }, {});
  }

  private replaceReservation(updatedReservation: ReservationResponseDTO): void {
    this.reservations = this.reservations.map((reservation) =>
      reservation.id === updatedReservation.id ? updatedReservation : reservation
    );
    this.updateBillingReservations();
    this.applyFilters();
  }

  private isBilledReservation(reservation: ReservationResponseDTO): boolean {
    return Boolean(reservation.receiptAvailable)
      || Boolean(reservation.invoiceHostedUrl || reservation.invoicePdfUrl)
      || ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(reservation.statutPaiement);
  }

  private getBillingTimestamp(reservation: ReservationResponseDTO): number {
    return new Date(
      reservation.refundedAt
      || reservation.datePaiement
      || reservation.dateModification
      || reservation.dateCreation
    ).getTime();
  }

  private handleReservationEntry(): void {
    const paymentStatus = this.route.snapshot.queryParamMap.get('payment');
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    const createdState = this.route.snapshot.queryParamMap.get('created');
    const focusReservationId = this.parseReservationId(
      this.route.snapshot.queryParamMap.get('focusReservation')
        || this.route.snapshot.queryParamMap.get('reservationId')
    );

    this.focusReservationId = focusReservationId;

    if (paymentStatus === 'success' && sessionId) {
      this.successMessage = 'Finalizing your Stripe payment...';
      this.normalizeHandledQueryParams();
      this.syncStripeCheckoutSession(sessionId);
      return;
    }

    if (paymentStatus === 'cancel') {
      this.errorMessage = 'Payment was cancelled. Your reservation is still unpaid and ready whenever you want to retry.';
      this.normalizeHandledQueryParams();
      this.loadReservations({ preserveMessages: true });
      return;
    }

    if (createdState === 'pending') {
      this.successMessage = 'Reservation created successfully. It is now waiting for admin confirmation.';
      this.normalizeHandledQueryParams();
      this.loadReservations({ preserveMessages: true });
      return;
    }

    if (createdState === 'confirmed') {
      this.successMessage = 'Reservation confirmed immediately. Stripe payment is ready now from this page.';
      this.normalizeHandledQueryParams();
      this.loadReservations({ preserveMessages: true });
      return;
    }

    if (createdState === 'waitlist') {
      this.successMessage = 'Your reservation joined the waitlist. Stripe payment is ready now to hold your place in line.';
      this.normalizeHandledQueryParams();
      this.loadReservations({ preserveMessages: true });
      return;
    }

    this.loadReservations({ preserveMessages: true });
  }

  private syncStripeCheckoutSession(sessionId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.eventService.syncCheckoutSession(sessionId).subscribe({
      next: (reservation) => {
        this.focusReservationId = reservation.id;
        this.activeDashboardSection = reservation.invoicePdfUrl || reservation.invoiceHostedUrl
          ? 'billing-center'
          : 'dashboard-overview';
        this.successMessage = reservation.statutPaiement === 'PAID'
          ? reservation.estEnAttente
            ? `Waitlist payment secured for ${reservation.eventTitre}. If a seat opens, CampConnect will move the booking straight to paid automatically. If not, the full payment is refunded when the event starts.`
            : reservation.invoicePdfUrl || reservation.invoiceHostedUrl
              ? `Payment confirmed for ${reservation.eventTitre}. Your bill and receipt are ready below.`
              : `Payment confirmed for ${reservation.eventTitre}. The receipt is ready now and Stripe is still finalizing the bill.`
          : 'Stripe returned successfully. The payment status is still updating, so refresh in a moment if needed.';

        this.processingPaymentReservationId = null;
        this.loadReservations({ preserveMessages: true });
      },
      error: (error) => {
        this.processingPaymentReservationId = null;
        this.errorMessage = this.getBackendMessage(error)
          || 'Stripe returned, but we could not refresh the payment status yet. Please use Refresh in a moment.';
        console.error('Error syncing Stripe checkout session:', error);
        this.loadReservations({ preserveMessages: true });
      }
    });
  }

  private normalizeHandledQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.focusReservationId ? { focusReservation: this.focusReservationId } : {},
      replaceUrl: true
    });
  }

  private focusReservationCard(): void {
    if (!this.focusReservationId) {
      return;
    }

    window.setTimeout(() => {
      const reservationCard = document.getElementById(this.getReservationCardId(this.focusReservationId!));
      reservationCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  }

  private parseReservationId(rawReservationId: string | null): number | null {
    const parsedReservationId = rawReservationId ? Number.parseInt(rawReservationId, 10) : Number.NaN;
    return Number.isFinite(parsedReservationId) && parsedReservationId > 0 ? parsedReservationId : null;
  }

  isPaidWaitlistReservation(reservation: ReservationResponseDTO): boolean {
    return Boolean(reservation.estEnAttente) && reservation.statutPaiement === 'PAID';
  }

  getWaitlistBannerTitle(reservation: ReservationResponseDTO): string {
    return this.isPaidWaitlistReservation(reservation)
      ? 'This reservation is holding a paid waitlist spot.'
      : 'This reservation is on the waitlist.';
  }

  getWaitlistBannerCopy(reservation: ReservationResponseDTO): string {
    if (this.isPaidWaitlistReservation(reservation)) {
      return 'A seat has not opened yet. If one opens before the event starts, CampConnect promotes this booking automatically. If not, the full payment is refunded when the event begins.';
    }

    return 'Pay this waitlist reservation from the action row below to keep your place in line. If no seat opens by the event start, CampConnect refunds the payment in full automatically.';
  }

  private getCancellationConfirmationMessage(reservation: ReservationResponseDTO): string {
    if (reservation.cancellationPolicy?.tier === 'FULL_REFUND') {
      return `Cancel this reservation and receive a full refund of ${this.formatCurrency(reservation.cancellationPolicy.eligibleRefundAmount)}?`;
    }

    if (reservation.cancellationPolicy?.tier === 'PARTIAL_REFUND') {
      return `Cancel this reservation and receive a ${reservation.cancellationPolicy.eligibleRefundPercentage}% refund of ${this.formatCurrency(reservation.cancellationPolicy.eligibleRefundAmount)}?`;
    }

    if (reservation.cancellationPolicy?.tier === 'NO_REFUND') {
      return 'Cancel this reservation? The seat will be released, but the refund window has already closed.';
    }

    return 'Are you sure you want to cancel this reservation?';
  }

  private getCancellationSuccessMessage(reservation: ReservationResponseDTO): string {
    if (reservation.cancellationPolicy?.tier === 'FULL_REFUND') {
      return `Reservation cancelled. Stripe will return the full ${this.formatCurrency(reservation.cancellationPolicy.eligibleRefundAmount)}.`;
    }

    if (reservation.cancellationPolicy?.tier === 'PARTIAL_REFUND') {
      return `Reservation cancelled. Stripe is processing the ${reservation.cancellationPolicy.eligibleRefundPercentage}% refund.`;
    }

    if (reservation.cancellationPolicy?.tier === 'NO_REFUND') {
      return 'Reservation cancelled. The seat was released, but the refund deadline had already passed.';
    }

    return 'Reservation cancelled successfully.';
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

