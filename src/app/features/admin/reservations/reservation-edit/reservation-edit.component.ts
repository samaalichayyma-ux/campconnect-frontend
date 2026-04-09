import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { AdminUserService } from '../../../../core/services/admin-user.service';
import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { ToastMessageHost } from '../../../../core/utils/toast-message-host';
import { AdminUser } from '../../users/models/user.model';
import {
  Event,
  PaymentStatus,
  PromotionPreviewDTO,
  ReservationRequestDTO,
  ReservationResponseDTO,
  ReservationStatus
} from '../../../public/events/models/event.model';
import { EventService } from '../../../public/events/services/event.service';

@Component({
  selector: 'app-reservation-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AdminIconComponent],
  templateUrl: './reservation-edit.component.html',
  styleUrl: './reservation-edit.component.css'
})
export class ReservationEditComponent extends ToastMessageHost implements OnInit, OnDestroy {
  private readonly fieldLabels: Record<string, string> = {
    utilisateurId: 'User',
    eventId: 'Event',
    nombreParticipants: 'Participants',
    promoCode: 'Promo code',
    remarques: 'Remarks'
  };

  reservationForm: FormGroup;
  users: AdminUser[] = [];
  events: Event[] = [];
  reservationId: number | null = null;
  reservation: ReservationResponseDTO | null = null;
  isLoading = false;
  isSubmitting = false;
  isLoadingPricing = false;
  promoFeedbackMessage = '';
  pricingPreview: PromotionPreviewDTO | null = null;
  private readonly subscriptions = new Subscription();
  private pricingPreviewTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private pricingPreviewRequest: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private adminUserService: AdminUserService,
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    super();
    this.reservationForm = this.createForm();
  }

  ngOnInit(): void {
    this.setupPricingPreviewWatcher();
    this.reservationId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.reservationId) {
      this.loadReservationData(this.reservationId);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.clearPricingPreviewTimeout();
    this.cancelPricingPreviewRequest();
  }

  createForm(): FormGroup {
    return this.fb.group({
      utilisateurId: ['', Validators.required],
      eventId: ['', Validators.required],
      nombreParticipants: [1, [Validators.required, Validators.min(1), Validators.max(100), Validators.pattern(/^\d+$/)]],
      promoCode: ['', [Validators.maxLength(64)]],
      remarques: ['', [Validators.maxLength(500)]]
    });
  }

  loadReservationData(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      reservation: this.eventService.getReservationById(id),
      users: this.adminUserService.getAllUsers(),
      events: this.eventService.getAllEvents()
    }).subscribe({
      next: ({ reservation, users, events }) => {
        this.reservation = reservation;
        this.users = [...users].sort((a, b) => a.nom.localeCompare(b.nom));
        this.events = [...events].sort((a, b) =>
          new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()
        );
        this.reservationForm.patchValue({
          utilisateurId: reservation.utilisateurId,
          eventId: reservation.eventId,
          nombreParticipants: reservation.nombreParticipants,
          promoCode: reservation.promoCode || '',
          remarques: reservation.remarques || ''
        }, { emitEvent: false });
        this.refreshPricingPreview();
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = this.extractErrorMessage(error) || 'Failed to load reservation details.';
        console.error('Error loading reservation:', error);
      }
    });
  }

  submitForm(): void {
    if (!this.reservationId || !this.reservationForm.valid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    if (!this.canEditReservation) {
      this.errorMessage = 'This reservation can no longer be edited.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.updateReservation(this.reservationId, this.buildPayload()).subscribe({
      next: (reservation: ReservationResponseDTO) => {
        this.reservation = reservation;
        this.reservationForm.patchValue({
          utilisateurId: reservation.utilisateurId,
          eventId: reservation.eventId,
          nombreParticipants: reservation.nombreParticipants,
          promoCode: reservation.promoCode || '',
          remarques: reservation.remarques || ''
        }, { emitEvent: false });
        this.refreshPricingPreview();
        this.successMessage = 'Reservation updated successfully!';
        this.isSubmitting = false;
        setTimeout(() => {
          this.router.navigate(['/admin/reservations']);
        }, 1200);
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.errorMessage = this.extractErrorMessage(error) || 'Failed to update reservation.';
        console.error('Error updating reservation:', error);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/reservations']);
  }

  get canEditReservation(): boolean {
    return this.reservation?.statut === 'PENDING' || this.reservation?.statut === 'CONFIRMED';
  }

  get selectedEvent(): Event | null {
    const eventId = Number(this.reservationForm.get('eventId')?.value);
    return this.events.find((event) => event.id === eventId) || null;
  }

  get effectiveAvailableSeats(): number {
    const selectedEvent = this.selectedEvent;
    if (!selectedEvent) {
      return 0;
    }

    let availableSeats = selectedEvent.availableSeats ?? Math.max(0, selectedEvent.capaciteMax - (selectedEvent.participantsCount || 0));
    if (this.reservation
      && this.reservation.eventId === selectedEvent.id
      && (this.reservation.statut === 'CONFIRMED' || this.reservation.statut === 'PAID')) {
      availableSeats += this.reservation.nombreParticipants;
    }

    return Math.max(0, availableSeats);
  }

  get selectedUser(): AdminUser | null {
    const userId = Number(this.reservationForm.get('utilisateurId')?.value);
    return this.users.find((user) => user.id === userId) || null;
  }

  get estimatedTotal(): number {
    if (typeof this.pricingPreview?.totalPrice === 'number') {
      return this.pricingPreview.totalPrice;
    }

    const selectedEvent = this.selectedEvent;
    const participants = Number(this.reservationForm.get('nombreParticipants')?.value || 0);
    if (!selectedEvent || !participants) {
      return 0;
    }

    return Number(selectedEvent.prix || 0) * participants;
  }

  get willBeWaitlisted(): boolean {
    const participants = Number(this.reservationForm.get('nombreParticipants')?.value || 0);
    return !!this.selectedEvent && participants > this.effectiveAvailableSeats;
  }

  get remarksLength(): number {
    return String(this.reservationForm.get('remarques')?.value || '').length;
  }

  get baseSubtotal(): number {
    return this.pricingPreview?.basePriceTotal ?? this.estimatedBaseTotal;
  }

  get estimatedBaseTotal(): number {
    const selectedEvent = this.selectedEvent;
    const participants = Number(this.reservationForm.get('nombreParticipants')?.value || 0);
    if (!selectedEvent || !participants) {
      return 0;
    }

    return Number(selectedEvent.prix || 0) * participants;
  }

  get discountAmount(): number {
    return this.pricingPreview?.discountAmount ?? 0;
  }

  get hasDiscountApplied(): boolean {
    return this.discountAmount > 0;
  }

  get promoFeedbackClass(): string {
    return this.pricingPreview?.invalidPromoCode ? 'summary-note warning' : 'summary-note success';
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

  getErrorMessage(fieldName: string): string {
    const control = this.reservationForm.get(fieldName);
    if (!control || !control.errors) {
      return '';
    }

    const label = this.fieldLabels[fieldName] || fieldName;

    if (control.errors['required']) return `${label} is required.`;
    if (control.errors['min']) return `${label} must be at least 1.`;
    if (control.errors['max']) return `${label} must not exceed 100.`;
    if (control.errors['maxlength']) return `${label} must not exceed 500 characters.`;
    if (control.errors['pattern']) return `${label} format is invalid.`;

    return 'Invalid field';
  }

  private buildPayload(): ReservationRequestDTO {
    const remarks = String(this.reservationForm.value.remarques || '').trim();
    const promoCode = String(this.reservationForm.value.promoCode || '').trim().toUpperCase();

    return {
      utilisateurId: Number(this.reservationForm.value.utilisateurId),
      eventId: Number(this.reservationForm.value.eventId),
      nombreParticipants: Number(this.reservationForm.value.nombreParticipants),
      promoCode: promoCode || undefined,
      remarques: remarks || undefined
    };
  }

  private setupPricingPreviewWatcher(): void {
    ['eventId', 'nombreParticipants', 'promoCode'].forEach((controlName) => {
      const control = this.reservationForm.get(controlName);
      if (!control) {
        return;
      }

      this.subscriptions.add(control.valueChanges.subscribe(() => this.schedulePricingPreviewRefresh()));
    });
  }

  private schedulePricingPreviewRefresh(): void {
    this.clearPricingPreviewTimeout();
    this.pricingPreviewTimeoutId = setTimeout(() => {
      this.pricingPreviewTimeoutId = null;
      this.refreshPricingPreview();
    }, 250);
  }

  private refreshPricingPreview(): void {
    this.cancelPricingPreviewRequest();

    const eventId = Number(this.reservationForm.get('eventId')?.value);
    const participants = Number(this.reservationForm.get('nombreParticipants')?.value);
    const promoCode = String(this.reservationForm.get('promoCode')?.value || '').trim().toUpperCase();

    if (!Number.isFinite(eventId) || eventId <= 0 || !Number.isFinite(participants) || participants <= 0) {
      this.pricingPreview = null;
      this.promoFeedbackMessage = '';
      this.isLoadingPricing = false;
      return;
    }

    this.isLoadingPricing = true;

    this.pricingPreviewRequest = this.eventService.previewReservationPricing(eventId, participants, promoCode || undefined).subscribe({
      next: (preview) => {
        this.pricingPreview = preview;
        this.promoFeedbackMessage = preview.validationMessage || '';
        this.isLoadingPricing = false;
        this.pricingPreviewRequest = null;
      },
      error: (error) => {
        this.pricingPreview = null;
        this.promoFeedbackMessage = promoCode
          ? this.extractErrorMessage(error) || 'We could not validate that promo code right now.'
          : '';
        this.isLoadingPricing = false;
        this.pricingPreviewRequest = null;
      }
    });
  }

  private clearPricingPreviewTimeout(): void {
    if (this.pricingPreviewTimeoutId !== null) {
      clearTimeout(this.pricingPreviewTimeoutId);
      this.pricingPreviewTimeoutId = null;
    }
  }

  private cancelPricingPreviewRequest(): void {
    this.pricingPreviewRequest?.unsubscribe();
    this.pricingPreviewRequest = null;
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
}
