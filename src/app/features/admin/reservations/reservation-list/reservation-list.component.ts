import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  Event,
  PaymentStatus,
  ReservationResponseDTO,
  ReservationStatus
} from '../../../public/events/models/event.model';
import { EventService } from '../../../public/events/services/event.service';
import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { ToastMessageHost } from '../../../../core/utils/toast-message-host';
import { catchError, forkJoin, of } from 'rxjs';

type ReservationActionDialogType = 'cancel' | 'confirm' | 'no-show';
type ReservationWorkflowFilter = 'all' | 'needs-approval' | 'refunded' | 'waitlist' | 'paid' | 'cancelled';

interface ReservationActionDialog {
  id: number;
  type: ReservationActionDialogType;
}

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminIconComponent],
  templateUrl: './reservation-list.component.html',
  styleUrl: './reservation-list.component.css'
})
export class ReservationListComponent extends ToastMessageHost implements OnInit {
  readonly fallbackImageUrl = 'assets/images/default-image.jpg';
  reservations: ReservationResponseDTO[] = [];
  filteredReservations: ReservationResponseDTO[] = [];
  paginatedReservations: ReservationResponseDTO[] = [];
  eventById = new Map<number, Event>();
  isLoading = false;
  actionDialog: ReservationActionDialog | null = null;
  actionReservationId: number | null = null;
  eventFilter = '';
  userFilter = '';
  workflowFilter: ReservationWorkflowFilter = 'all';
  currentPage = 1;
  pageSize = 8;
  totalPages = 1;

  constructor(private eventService: EventService) {
    super();
  }

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(resetPage = true): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      reservations: this.eventService.getAllReservations(),
      events: this.eventService.getAllEvents().pipe(catchError(() => of([] as Event[])))
    }).subscribe({
      next: ({ reservations, events }) => {
        this.eventById = new Map(events.map((event) => [event.id, event]));
        this.reservations = reservations.sort((a, b) =>
          new Date(b.dateCreation || 0).getTime() - new Date(a.dateCreation || 0).getTime()
        );
        this.applyFilters(resetPage);
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = this.extractErrorMessage(error) || 'Failed to load reservations.';
        console.error('Error loading reservations:', error);
      }
    });
  }

  openActionDialog(id: number, type: ReservationActionDialogType): void {
    this.actionDialog = { id, type };
  }

  closeActionDialog(): void {
    this.actionDialog = null;
  }

  cancelReservation(id: number): void {
    this.actionReservationId = id;
    this.errorMessage = '';

    this.eventService.cancelReservation(id, 'Cancelled by administrator from the admin panel').subscribe({
      next: () => {
        this.actionDialog = null;
        this.actionReservationId = null;
        this.showSuccessToast('Reservation cancelled successfully.', 'Reservation updated');
        this.loadReservations(false);
      },
      error: (error: any) => {
        this.handleActionError('cancel reservation', error);
      }
    });
  }

  confirmReservation(id: number): void {
    this.actionReservationId = id;
    this.errorMessage = '';

    this.eventService.confirmReservation(id).subscribe({
      next: (reservation: ReservationResponseDTO) => {
        this.replaceReservation(reservation);
        this.actionDialog = null;
        this.actionReservationId = null;
        this.showSuccessToast('Reservation confirmed successfully.', 'Reservation updated');
      },
      error: (error: any) => {
        this.handleActionError('confirm reservation', error);
      }
    });
  }

  markReservationAsNoShow(id: number): void {
    this.actionReservationId = id;
    this.errorMessage = '';

    this.eventService.markAsNoShow(id).subscribe({
      next: (reservation: ReservationResponseDTO) => {
        this.replaceReservation(reservation);
        this.actionDialog = null;
        this.actionReservationId = null;
        this.showSuccessToast('Reservation marked as no-show.', 'Reservation updated');
      },
      error: (error: any) => {
        this.handleActionError('mark reservation as no-show', error);
      }
    });
  }

  refundReservation(id: number): void {
    this.actionReservationId = id;
    this.errorMessage = '';

    this.eventService.refundReservation(id, 'Refund processed by administrator').subscribe({
      next: () => {
        this.actionReservationId = null;
        this.showSuccessToast('Refund processed successfully.', 'Reservation updated');
        this.loadReservations(false);
      },
      error: (error: any) => {
        this.handleActionError('refund reservation', error);
      }
    });
  }

  formatDateTime(dateTime: string | null | undefined): string {
    if (!dateTime) {
      return '-';
    }

    const parsedDate = new Date(dateTime);
    if (Number.isNaN(parsedDate.getTime())) {
      return '-';
    }

    return parsedDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getEventImageUrl(reservation: ReservationResponseDTO): string {
    return this.eventService.getEventPrimaryImageUrl(this.eventById.get(reservation.eventId), this.fallbackImageUrl);
  }

  trackByReservationId(_index: number, reservation: ReservationResponseDTO): number {
    return reservation.id;
  }

  trackByPageNumber(_index: number, page: number): number {
    return page;
  }

  onImageError(event: globalThis.Event): void {
    const imageElement = event.target as HTMLImageElement | null;
    if (!imageElement || imageElement.dataset['fallbackApplied'] === 'true') {
      return;
    }

    imageElement.dataset['fallbackApplied'] = 'true';
    imageElement.src = this.fallbackImageUrl;
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

  getStatusClass(status: ReservationStatus): string {
    const classes: Record<ReservationStatus, string> = {
      PENDING: 'status-pending',
      CONFIRMED: 'status-confirmed',
      PAID: 'status-paid',
      ATTENDED: 'status-confirmed',
      NO_SHOW: 'status-no-show',
      CANCELLED: 'status-cancelled',
      REFUNDED: 'status-refunded'
    };

    return classes[status] || 'status-default';
  }

  getPaymentStatusClass(status: PaymentStatus): string {
    const classes: Record<PaymentStatus, string> = {
      UNPAID: 'payment-unpaid',
      PENDING: 'payment-pending',
      PAID: 'payment-paid',
      PARTIALLY_REFUNDED: 'payment-refunded',
      FAILED: 'payment-failed',
      REFUNDED: 'payment-refunded'
    };

    return classes[status] || 'payment-default';
  }

  canConfirm(reservation: ReservationResponseDTO): boolean {
    return reservation.statut === 'PENDING';
  }

  canMarkNoShow(reservation: ReservationResponseDTO): boolean {
    return reservation.statut === 'CONFIRMED' || reservation.statut === 'PAID';
  }

  canRefund(reservation: ReservationResponseDTO): boolean {
    return reservation.statutPaiement === 'PAID'
      && (reservation.statut === 'CANCELLED' || reservation.statut === 'NO_SHOW');
  }

  canCancel(reservation: ReservationResponseDTO): boolean {
    return reservation.statut !== 'CANCELLED'
      && reservation.statut !== 'REFUNDED'
      && reservation.statut !== 'NO_SHOW'
      && reservation.statut !== 'ATTENDED';
  }

  isActionPending(id: number): boolean {
    return this.actionReservationId === id;
  }

  get dialogTitle(): string {
    switch (this.actionDialog?.type) {
      case 'confirm':
        return 'Confirm this reservation?';
      case 'no-show':
        return 'Mark this reservation as no-show?';
      default:
        return 'Cancel this reservation?';
    }
  }

  get dialogMessage(): string {
    switch (this.actionDialog?.type) {
      case 'confirm':
        return 'This will confirm the booking and re-check capacity before the status is updated.';
      case 'no-show':
        return 'This will mark the guest as absent and update the reservation history for admins.';
      default:
        return 'This will mark the booking as cancelled and may free seats for other guests.';
    }
  }

  get dialogConfirmLabel(): string {
    switch (this.actionDialog?.type) {
      case 'confirm':
        return 'Confirm reservation';
      case 'no-show':
        return 'Mark no-show';
      default:
        return 'Cancel reservation';
    }
  }

  get dialogKeepLabel(): string {
    switch (this.actionDialog?.type) {
      case 'confirm':
        return 'Review first';
      case 'no-show':
        return 'Keep confirmed';
      default:
        return 'Keep reservation';
    }
  }

  get dialogIconName(): 'warning' | 'check' | 'close' {
    switch (this.actionDialog?.type) {
      case 'confirm':
        return 'check';
      case 'no-show':
        return 'close';
      default:
        return 'warning';
    }
  }

  get dialogVariantClass(): string {
    switch (this.actionDialog?.type) {
      case 'confirm':
        return 'confirm-variant';
      case 'no-show':
        return 'warning-variant';
      default:
        return 'danger-variant';
    }
  }

  submitActionDialog(): void {
    if (!this.actionDialog) {
      return;
    }

    const { id, type } = this.actionDialog;

    if (type === 'confirm') {
      this.confirmReservation(id);
      return;
    }

    if (type === 'no-show') {
      this.markReservationAsNoShow(id);
      return;
    }

    this.cancelReservation(id);
  }

  get paginationStart(): number {
    if (this.filteredReservations.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredReservations.length);
  }

  get visiblePageNumbers(): number[] {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    startPage = Math.max(1, endPage - maxVisiblePages + 1);

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  }

  previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage--;
    this.updatePagination();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage++;
    this.updatePagination();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.updatePagination();
  }

  applyFilters(resetPage = true): void {
    const normalizedEventFilter = this.normalizeFilter(this.eventFilter);
    const normalizedUserFilter = this.normalizeFilter(this.userFilter);

    this.filteredReservations = this.reservations.filter((reservation) => {
      const matchesEvent = !normalizedEventFilter || this.matchesEventFilter(reservation, normalizedEventFilter);
      const matchesUser = !normalizedUserFilter || this.matchesUserFilter(reservation, normalizedUserFilter);
      const matchesWorkflow = this.matchesWorkflowFilter(reservation);

      return matchesEvent && matchesUser && matchesWorkflow;
    });

    this.updatePagination(resetPage);
  }

  clearFilters(): void {
    this.eventFilter = '';
    this.userFilter = '';
    this.workflowFilter = 'all';
    this.applyFilters();
  }

  setWorkflowFilter(filter: ReservationWorkflowFilter): void {
    this.workflowFilter = this.workflowFilter === filter ? 'all' : filter;
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return Boolean(
      this.normalizeFilter(this.eventFilter)
      || this.normalizeFilter(this.userFilter)
      || this.workflowFilter !== 'all'
    );
  }

  get pendingApprovalsCount(): number {
    return this.reservations.filter((reservation) => this.canConfirm(reservation)).length;
  }

  get refundableCount(): number {
    return this.reservations.filter((reservation) => this.isRefundedReservation(reservation)).length;
  }

  get waitlistCount(): number {
    return this.reservations.filter((reservation) => reservation.estEnAttente).length;
  }

  get filteredCount(): number {
    return this.filteredReservations.length;
  }

  private replaceReservation(updatedReservation: ReservationResponseDTO): void {
    this.reservations = this.reservations.map((reservation) =>
      reservation.id === updatedReservation.id ? updatedReservation : reservation
    );
    this.applyFilters(false);
  }

  private handleActionError(actionLabel: string, error: any): void {
    this.actionReservationId = null;
    this.errorMessage = this.extractErrorMessage(error) || `Failed to ${actionLabel}.`;
    console.error(`Error trying to ${actionLabel}:`, error);
  }

  private extractErrorMessage(error: any): string | null {
    const apiError = error?.error;
    if (!apiError) {
      return null;
    }

    if (typeof apiError === 'string') {
      const trimmedMessage = apiError.trim();
      return trimmedMessage || null;
    }

    if (typeof apiError.message === 'string' && apiError.message.trim()) {
      return apiError.message.trim();
    }

    return null;
  }

  private normalizeFilter(value: string | null | undefined): string {
    return (value || '').trim().toLowerCase();
  }

  private matchesEventFilter(reservation: ReservationResponseDTO, normalizedFilter: string): boolean {
    return [
      reservation.eventTitre,
      reservation.eventLieu,
      reservation.eventDateDebut
    ].some((value) => (value || '').toLowerCase().includes(normalizedFilter));
  }

  private matchesUserFilter(reservation: ReservationResponseDTO, normalizedFilter: string): boolean {
    return [
      reservation.utilisateurNom,
      reservation.utilisateurEmail
    ].some((value) => (value || '').toLowerCase().includes(normalizedFilter));
  }

  private matchesWorkflowFilter(reservation: ReservationResponseDTO): boolean {
    switch (this.workflowFilter) {
      case 'needs-approval':
        return this.canConfirm(reservation);
      case 'refunded':
        return this.isRefundedReservation(reservation);
      case 'waitlist':
        return reservation.estEnAttente;
      case 'paid':
        return reservation.statutPaiement === 'PAID';
      case 'cancelled':
        return reservation.statut === 'CANCELLED';
      default:
        return true;
    }
  }

  private isRefundedReservation(reservation: ReservationResponseDTO): boolean {
    return reservation.statut === 'REFUNDED'
      || reservation.statutPaiement === 'REFUNDED'
      || reservation.statutPaiement === 'PARTIALLY_REFUNDED';
  }

  private updatePagination(resetPage = false): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredReservations.length / this.pageSize));

    if (resetPage) {
      this.currentPage = 1;
    } else if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedReservations = this.filteredReservations.slice(start, end);
  }

  get paginationSummaryLabel(): string {
    if (!this.hasActiveFilters()) {
      return `Showing ${this.paginationStart}-${this.paginationEnd} of ${this.reservations.length} reservations`;
    }

    return `Showing ${this.paginationStart}-${this.paginationEnd} of ${this.filteredReservations.length} matching reservations`;
  }
}
