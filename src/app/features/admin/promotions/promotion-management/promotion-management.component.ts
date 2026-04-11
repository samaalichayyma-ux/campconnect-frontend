import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { ToastMessageHost } from '../../../../core/utils/toast-message-host';
import {
  EventResponseDTO,
  PromotionOfferRequestDTO,
  PromotionOfferResponseDTO,
  PromotionScope,
  PromotionTargetEventSummaryDTO
} from '../../../public/events/models/event.model';
import { EventService } from '../../../public/events/services/event.service';

@Component({
  selector: 'app-promotion-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, AdminIconComponent],
  templateUrl: './promotion-management.component.html',
  styleUrl: './promotion-management.component.css'
})
export class PromotionManagementComponent extends ToastMessageHost implements OnInit {
  private readonly fieldLabels: Record<string, string> = {
    name: 'Promotion name',
    code: 'Promo code',
    discountType: 'Discount type',
    discountValue: 'Discount value',
    description: 'Description',
    startsAt: 'Start date',
    endsAt: 'End date'
  };

  promotionForm: FormGroup;
  events: EventResponseDTO[] = [];
  promotions: PromotionOfferResponseDTO[] = [];

  isLoading = false;
  isSaving = false;
  isLoadingPromotion = false;
  private _formErrorMessage = '';

  isFormOpen = false;
  editingPromotionId: number | null = null;
  deleteCandidate: PromotionOfferResponseDTO | null = null;
  selectedScopeFilter: 'all' | PromotionScope = 'all';
  selectedEventFilter = 'all';
  selectedTargetEventIds = new Set<number>();
  navigationSource: 'dashboard' | 'events' = 'events';

  constructor(
    private readonly fb: FormBuilder,
    private readonly eventService: EventService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    super();
    this.promotionForm = this.createForm();
  }

  get formErrorMessage(): string {
    return this._formErrorMessage;
  }

  set formErrorMessage(value: string) {
    const normalizedMessage = String(value || '').trim();
    this._formErrorMessage = normalizedMessage;

    if (normalizedMessage) {
      this.showWarningToast(normalizedMessage, 'Cannot save yet');
    }
  }

  ngOnInit(): void {
    this.navigationSource = this.route.snapshot.queryParamMap.get('from') === 'dashboard' ? 'dashboard' : 'events';

    const queryEventId = Number(this.route.snapshot.queryParamMap.get('eventId'));
    if (Number.isFinite(queryEventId) && queryEventId > 0) {
      this.selectedEventFilter = String(queryEventId);
    }

    this.syncCodeValidator(Boolean(this.promotionForm.get('autoApply')?.value));

    this.promotionForm.get('autoApply')?.valueChanges.subscribe((autoApply) => {
      this.syncCodeValidator(Boolean(autoApply));
    });

    this.promotionForm.get('scope')?.valueChanges.subscribe((scope) => {
      if (scope === 'GLOBAL') {
        this.selectedTargetEventIds.clear();
      }
    });

    this.loadEventsAndPromotions();
  }

  get backLink(): string {
    return this.navigationSource === 'dashboard' ? '/admin/dashboard' : '/admin/events';
  }

  get backLabel(): string {
    return this.navigationSource === 'dashboard' ? 'Back to Dashboard' : 'Back to Events';
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      code: ['', [Validators.maxLength(64)]],
      description: ['', [Validators.maxLength(500)]],
      discountType: ['PERCENTAGE', Validators.required],
      discountValue: [10, [Validators.required, Validators.min(0.01)]],
      startsAt: [''],
      endsAt: [''],
      autoApply: [false],
      discoverable: [true],
      active: [true],
      scope: ['GLOBAL', Validators.required]
    });
  }

  loadEventsAndPromotions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        this.events = [...events].sort((a, b) =>
          new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()
        );
        this.loadPromotions();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.extractErrorMessage(error) || 'Could not load events for promo targeting.';
        console.error('Error loading events for promotions:', error);
      }
    });
  }

  loadPromotions(): void {
    const eventId = this.getSelectedEventFilterId();

    this.eventService.getAdminPromotions(eventId ?? undefined).subscribe({
      next: (promotions) => {
        this.promotions = promotions.sort((a, b) =>
          new Date(b.dateModification || b.dateCreation || 0).getTime()
          - new Date(a.dateModification || a.dateCreation || 0).getTime()
        );
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.extractErrorMessage(error) || 'Could not load promotions.';
        console.error('Error loading promotions:', error);
      }
    });
  }

  onEventFilterChange(): void {
    this.syncQueryParams();
    this.loadPromotions();
  }

  openCreateForm(): void {
    this.editingPromotionId = null;
    this.formErrorMessage = '';
    this.isLoadingPromotion = false;
    this.promotionForm.reset({
      name: '',
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startsAt: '',
      endsAt: '',
      autoApply: false,
      discoverable: true,
      active: true,
      scope: this.getSelectedEventFilterId() ? 'EVENTS' : 'GLOBAL'
    });
    this.selectedTargetEventIds = new Set(this.getSelectedEventFilterId() ? [this.getSelectedEventFilterId()!] : []);
    this.isFormOpen = true;
  }

  openEditForm(promotionId: number): void {
    this.isFormOpen = true;
    this.isLoadingPromotion = true;
    this.editingPromotionId = promotionId;
    this.formErrorMessage = '';

    this.eventService.getAdminPromotionById(promotionId).subscribe({
      next: (promotion) => {
        this.selectedTargetEventIds = new Set(promotion.eventIds ?? []);
        this.promotionForm.reset({
          name: promotion.name,
          code: promotion.code || '',
          description: promotion.description || '',
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          startsAt: this.toDateTimeLocalValue(promotion.startsAt),
          endsAt: this.toDateTimeLocalValue(promotion.endsAt),
          autoApply: promotion.autoApply,
          discoverable: promotion.discoverable,
          active: promotion.active,
          scope: this.isGlobalPromotion(promotion) ? 'GLOBAL' : 'EVENTS'
        });
        this.isLoadingPromotion = false;
      },
      error: (error) => {
        this.isLoadingPromotion = false;
        this.formErrorMessage = this.extractErrorMessage(error) || 'Could not load the selected promotion.';
        console.error('Error loading promotion details:', error);
      }
    });
  }

  closeForm(): void {
    if (this.isSaving) {
      return;
    }

    this.isFormOpen = false;
    this.isLoadingPromotion = false;
    this.editingPromotionId = null;
    this.formErrorMessage = '';
  }

  submitForm(): void {
    if (!this.promotionForm.valid) {
      this.promotionForm.markAllAsTouched();
      this.formErrorMessage = 'Please complete the required promo fields before saving.';
      return;
    }

    if (this.promotionForm.get('scope')?.value === 'EVENTS' && this.selectedTargetEventIds.size === 0) {
      this.formErrorMessage = 'Choose at least one event when the promo is not global.';
      return;
    }

    if (this.hasInvalidScheduleRange()) {
      this.formErrorMessage = 'The end date must be after the start date.';
      return;
    }

    this.isSaving = true;
    this.formErrorMessage = '';
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.buildPayload();
    const request$ = this.editingPromotionId
      ? this.eventService.updateAdminPromotion(this.editingPromotionId, payload)
      : this.eventService.createAdminPromotion(payload);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = this.editingPromotionId
          ? 'Promotion updated successfully.'
          : 'Promotion created successfully.';
        this.closeForm();
        this.loadPromotions();
      },
      error: (error) => {
        this.isSaving = false;
        this.formErrorMessage = this.extractErrorMessage(error) || 'Could not save this promotion.';
        console.error('Error saving promotion:', error);
      }
    });
  }

  confirmDelete(promotion: PromotionOfferResponseDTO): void {
    this.deleteCandidate = promotion;
  }

  cancelDelete(): void {
    this.deleteCandidate = null;
  }

  deletePromotion(): void {
    if (!this.deleteCandidate?.id) {
      return;
    }

    const promotionId = this.deleteCandidate.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.deleteAdminPromotion(promotionId).subscribe({
      next: () => {
        this.deleteCandidate = null;
        this.promotions = this.promotions.filter((promotion) => promotion.id !== promotionId);
        this.successMessage = 'Promotion deleted successfully.';
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error) || 'Could not delete this promotion.';
        console.error('Error deleting promotion:', error);
      }
    });
  }

  get visiblePromotions(): PromotionOfferResponseDTO[] {
    if (this.selectedScopeFilter === 'all') {
      return this.promotions;
    }

    return this.promotions.filter((promotion) =>
      this.selectedScopeFilter === 'GLOBAL'
        ? this.isGlobalPromotion(promotion)
        : !this.isGlobalPromotion(promotion)
    );
  }

  get currentFilterEvent(): EventResponseDTO | null {
    const eventId = this.getSelectedEventFilterId();
    return eventId ? this.findEventById(eventId) : null;
  }

  get selectedTargetEvents(): EventResponseDTO[] {
    return this.events.filter((event) => this.selectedTargetEventIds.has(event.id));
  }

  getFieldError(fieldName: string): string {
    const control = this.promotionForm.get(fieldName);
    if (!control || !control.errors) {
      return '';
    }

    const label = this.fieldLabels[fieldName] || fieldName;

    if (control.errors['required']) return `${label} is required.`;
    if (control.errors['maxlength']) return `${label} is too long.`;
    if (control.errors['min']) return `${label} must be greater than 0.`;

    return 'This field is invalid.';
  }

  isTargetEventSelected(eventId: number): boolean {
    return this.selectedTargetEventIds.has(eventId);
  }

  toggleTargetEvent(eventId: number, isChecked: boolean): void {
    if (isChecked) {
      this.selectedTargetEventIds.add(eventId);
      return;
    }

    this.selectedTargetEventIds.delete(eventId);
  }

  isGlobalPromotion(promotion: PromotionOfferResponseDTO): boolean {
    return promotion.appliesToAllEvents !== false && !(promotion.eventIds?.length);
  }

  getPromotionDiscountLabel(promotion: PromotionOfferResponseDTO): string {
    return promotion.discountType === 'PERCENTAGE'
      ? `${promotion.discountValue}% off`
      : `${this.formatCurrency(promotion.discountValue)} off`;
  }

  getPromotionCodeLabel(promotion: PromotionOfferResponseDTO): string {
    if (promotion.autoApply) {
      return 'Auto-applied';
    }

    return promotion.code || 'Manual code';
  }

  getPromotionScopeLabel(promotion: PromotionOfferResponseDTO): string {
    if (this.isGlobalPromotion(promotion)) {
      return 'Global';
    }

    const targetCount = this.getPromotionTargetEvents(promotion).length || promotion.eventIds?.length || 0;
    return `${targetCount} ${targetCount === 1 ? 'event' : 'events'}`;
  }

  getPromotionAvailabilityLabel(promotion: PromotionOfferResponseDTO): string {
    if (!promotion.active) {
      return 'Inactive';
    }

    return promotion.currentlyAvailable ? 'Live now' : 'Scheduled';
  }

  getPromotionTargetEvents(promotion: PromotionOfferResponseDTO): PromotionTargetEventSummaryDTO[] {
    if (promotion.targetedEvents?.length) {
      return promotion.targetedEvents;
    }

    return (promotion.eventIds ?? []).reduce<PromotionTargetEventSummaryDTO[]>((targetEvents, eventId) => {
        const event = this.findEventById(eventId);
        if (!event) {
          return targetEvents;
        }

        targetEvents.push({
          id: event.id,
          titre: event.titre,
          dateDebut: event.dateDebut,
          dateFin: event.dateFin,
          lieu: event.lieu
        });

        return targetEvents;
      }, []);
  }

  getPromotionWindowLabel(promotion: PromotionOfferResponseDTO): string {
    if (promotion.startsAt && promotion.endsAt) {
      return `${this.formatDateTime(promotion.startsAt)} to ${this.formatDateTime(promotion.endsAt)}`;
    }

    if (promotion.startsAt) {
      return `Starts ${this.formatDateTime(promotion.startsAt)}`;
    }

    if (promotion.endsAt) {
      return `Ends ${this.formatDateTime(promotion.endsAt)}`;
    }

    return 'Always available when active';
  }

  formatDateTime(value?: string): string {
    if (!value) {
      return '-';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount?: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Number(amount || 0));
  }

  private buildPayload(): PromotionOfferRequestDTO {
    const formValue = this.promotionForm.getRawValue();
    const appliesToAllEvents = formValue.scope === 'GLOBAL';

    return {
      name: String(formValue.name || '').trim(),
      code: String(formValue.code || '').trim().toUpperCase() || undefined,
      description: String(formValue.description || '').trim() || undefined,
      discountType: formValue.discountType,
      discountValue: Number(formValue.discountValue),
      autoApply: Boolean(formValue.autoApply),
      discoverable: Boolean(formValue.discoverable),
      active: Boolean(formValue.active),
      startsAt: this.toOptionalDateTime(formValue.startsAt),
      endsAt: this.toOptionalDateTime(formValue.endsAt),
      appliesToAllEvents,
      scope: formValue.scope,
      eventIds: appliesToAllEvents ? [] : Array.from(this.selectedTargetEventIds)
    };
  }

  private getSelectedEventFilterId(): number | null {
    const eventId = Number(this.selectedEventFilter);
    return Number.isFinite(eventId) && eventId > 0 ? eventId : null;
  }

  private syncQueryParams(): void {
    const eventId = this.getSelectedEventFilterId();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        eventId: eventId || null,
        from: this.navigationSource
      },
      queryParamsHandling: 'merge'
    });
  }

  private findEventById(eventId: number): EventResponseDTO | null {
    return this.events.find((event) => event.id === eventId) || null;
  }

  private syncCodeValidator(autoApply: boolean): void {
    const codeControl = this.promotionForm.get('code');
    if (!codeControl) {
      return;
    }

    if (autoApply) {
      codeControl.setValidators([Validators.maxLength(64)]);
    } else {
      codeControl.setValidators([Validators.required, Validators.maxLength(64)]);
    }

    codeControl.updateValueAndValidity({ emitEvent: false });
  }

  private hasInvalidScheduleRange(): boolean {
    const startsAt = this.toOptionalDateTime(this.promotionForm.get('startsAt')?.value);
    const endsAt = this.toOptionalDateTime(this.promotionForm.get('endsAt')?.value);
    return Boolean(startsAt && endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime());
  }

  private toOptionalDateTime(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmedValue = value.trim();
    return trimmedValue || undefined;
  }

  private toDateTimeLocalValue(value?: string): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value.slice(0, 16);
    }

    const timezoneOffsetMs = parsed.getTimezoneOffset() * 60_000;
    return new Date(parsed.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
  }

  private extractErrorMessage(error: unknown): string | null {
    const apiError = (error as { error?: unknown })?.error;
    if (!apiError) {
      return null;
    }

    if (typeof apiError === 'string') {
      const trimmed = apiError.trim();
      return trimmed || null;
    }

    const message = (apiError as { message?: string; error?: string; details?: string })?.message
      || (apiError as { message?: string; error?: string; details?: string })?.error
      || (apiError as { message?: string; error?: string; details?: string })?.details;

    return typeof message === 'string' && message.trim() ? message.trim() : null;
  }
}
