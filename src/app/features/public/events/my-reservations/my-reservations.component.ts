import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { AuthService } from '../../../../core/services/auth.service';
import {
  ReservationResponseDTO,
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
export class MyReservationsComponent implements OnInit {
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  reservations: ReservationResponseDTO[] = [];
  filteredReservations: ReservationResponseDTO[] = [];
  billingReservations: ReservationResponseDTO[] = [];
  stats: UserReservationStatsDTO | null = null;

  isLoading = false;
  isLoadingStats = false;
  isLoggedIn = false;
  errorMessage = '';
  successMessage = '';
  noReservationsMessage = '';

  selectedStatusFilter = 'all';
  sortBy = 'recent';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  processingPaymentReservationId: number | null = null;
  downloadingReceiptReservationId: number | null = null;
  focusReservationId: number | null = null;
  activeDashboardSection = 'dashboard-overview';

  readonly statusFilters = [
    { value: 'all', label: 'All reservations' },
    { value: 'PENDING', label: 'Pending / waitlist' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PAID', label: 'Paid' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  readonly sortOptions = [
    { value: 'recent', label: 'Most recent first' },
    { value: 'upcoming', label: 'Upcoming event date' },
    { value: 'price-high', label: 'Highest total' },
    { value: 'price-low', label: 'Lowest total' }
  ];

  readonly dashboardSections = [
    { id: 'dashboard-overview', label: 'Summary', description: 'Live booking counts and the next actions that matter most' },
    { id: 'billing-center', label: 'Billing Center', description: 'View bill history, reopen Stripe invoices, and download receipts' },
    { id: 'reservation-history', label: 'History', description: 'Scan upcoming, past, cancelled, and paid reservations in one place' }
  ];

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

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
    const userId = this.authService.getUserId();
    if (!userId) {
      this.errorMessage = 'User ID not found. Please log in again.';
      return;
    }

    this.loadStats();
    this.isLoading = true;
    if (!options.preserveMessages) {
      this.errorMessage = '';
      this.successMessage = '';
    }
    this.noReservationsMessage = '';

    this.eventService.getUserReservations(userId).subscribe({
      next: (data) => {
        this.reservations = data;
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
      }
    });
  }

  refreshReservations(): void {
    if (this.isLoggedIn) {
      this.loadReservations();
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
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    this.currentPage = 1;
    this.updatePaginatedReservations();
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

  updatePaginatedReservations(): void {
    this.filteredReservations = [...this.filteredReservations];
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'PAID':
        return 'status-paid';
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

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'clock';
      case 'CONFIRMED':
      case 'PAID':
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

  getPayableReservationsCount(): number {
    return this.reservations.filter((reservation) => this.canPay(reservation)).length;
  }

  getNextPayableReservation(): ReservationResponseDTO | null {
    return [...this.reservations]
      .filter((reservation) => this.canPay(reservation))
      .sort((firstReservation, secondReservation) =>
        new Date(firstReservation.eventDateDebut).getTime() - new Date(secondReservation.eventDateDebut).getTime()
      )[0] ?? null;
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
      this.successMessage = 'Reservation created successfully. It is now waiting for admin confirmation, and the Stripe payment button will appear here as soon as it is confirmed.';
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
      this.successMessage = 'Your reservation joined the waitlist. Stripe payment is ready now to hold your place in line, and CampConnect will refund it in full automatically if no seat opens by the event start.';
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
