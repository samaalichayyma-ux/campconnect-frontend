import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastMessageHost } from '../../../../core/utils/toast-message-host';
import { EventLocationMapComponent } from '../../../public/events/components/event-location-map/event-location-map.component';
import { EventCategory, EventLocationSelection, EventRequestDTO, EventResponseDTO } from '../../../public/events/models/event.model';
import { EventService } from '../../../public/events/services/event.service';
import {
  calculateEventDurationMinutes,
  eventScheduleValidator,
  formatEventDurationLabel,
  getEventScheduleValidationMessage,
  rewriteScheduleSaveErrorMessage
} from '../event-schedule.util';

interface PendingImagePreview {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminIconComponent, EventLocationMapComponent],
  templateUrl: './event-create.component.html',
  styleUrl: './event-create.component.css'
})
export class EventCreateComponent extends ToastMessageHost implements OnInit, OnDestroy {
  private readonly allowedFileExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  private readonly allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  private readonly directImageHosts = [
    'images.unsplash.com',
    'plus.unsplash.com',
    'images.pexels.com',
    'cdn.pixabay.com',
    'i.imgur.com',
    'res.cloudinary.com'
  ];
  private readonly directImageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg'];
  private readonly maxImageSize = 10 * 1024 * 1024;

  eventForm: FormGroup;
  isSubmitting = false;
  currentRole = '';
  selectedLatitude: number | null = null;
  selectedLongitude: number | null = null;
  selectedPlaceId: string | null = null;
  selectedMappedAddress = '';

  categories: { value: EventCategory; label: string }[] = [
    { value: 'GUIDED_TOUR', label: 'Guided Tour' },
    { value: 'CAMPING_ACTIVITY', label: 'Camping Activity' },
    { value: 'WORKSHOP', label: 'Workshop' },
    { value: 'WELLNESS', label: 'Wellness' },
    { value: 'RESTORATION', label: 'Restoration' },
    { value: 'SOCIAL_EVENT', label: 'Social Event' },
    { value: 'ADVENTURE', label: 'Adventure' },
    { value: 'EDUCATIONAL', label: 'Educational' }
  ];

  pendingImages: PendingImagePreview[] = [];
  primaryPendingImageIndex: number | null = null;

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private authService: AuthService,
    private router: Router
  ) {
    super();
    this.eventForm = this.createForm();
  }

  ngOnInit(): void {
    this.resolvePermissionContext();
  }

  ngOnDestroy(): void {
    this.revokePendingImagePreviews();
  }

  get canCreateEvents(): boolean {
    return this.authService.canManageEvents(this.currentRole);
  }

  get hasPendingImages(): boolean {
    return this.pendingImages.length > 0;
  }

  get queuedImageCount(): number {
    return this.pendingImages.length;
  }

  get primaryPendingImage(): PendingImagePreview | null {
    if (this.primaryPendingImageIndex === null) {
      return null;
    }

    return this.pendingImages[this.primaryPendingImageIndex] ?? null;
  }

  get directImagePreviewUrl(): string | null {
    return this.getDirectImageUrl() ?? null;
  }

  get leadPreviewUrl(): string | null {
    return this.primaryPendingImage?.previewUrl ?? this.directImagePreviewUrl;
  }

  get coverSourceLabel(): string {
    if (this.primaryPendingImage) {
      return this.primaryPendingImage.file.name;
    }

    if (this.directImagePreviewUrl) {
      return 'Direct image URL';
    }

    return 'No image selected';
  }

  get hasMappedLocation(): boolean {
    return this.selectedLatitude !== null && this.selectedLongitude !== null;
  }

  get mappedLocationSummary(): string {
    if (!this.hasMappedLocation) {
      return 'Address only';
    }

    return `${this.selectedLatitude?.toFixed(5)}, ${this.selectedLongitude?.toFixed(5)}`;
  }

  get reservationApprovalSummary(): string {
    return this.eventForm.get('reservationApprovalRequired')?.value === false
      ? 'Auto-confirm when seats are open'
      : 'Pending review first';
  }

  get publicationSummary(): string {
    return this.eventForm.get('published')?.value === true
      ? 'Published to the public events page'
      : 'Saved as draft';
  }

  get durationMinutes(): number | null {
    return calculateEventDurationMinutes(
      this.eventForm.get('startTime')?.value,
      this.eventForm.get('endTime')?.value
    );
  }

  get durationSummary(): string {
    return formatEventDurationLabel(this.durationMinutes);
  }

  get hasScheduleError(): boolean {
    return this.eventForm.hasError('invalidTimeRange') || this.eventForm.hasError('tooShortSchedule');
  }

  get showScheduleFeedback(): boolean {
    return !!this.eventForm.get('startTime')?.value && !!this.eventForm.get('endTime')?.value;
  }

  get scheduleFeedbackMessage(): string {
    const scheduleErrorMessage = getEventScheduleValidationMessage(this.durationMinutes);
    if (scheduleErrorMessage) {
      return scheduleErrorMessage;
    }

    return this.showScheduleFeedback
      ? `Current duration: ${this.durationSummary}.`
      : '';
  }

  get displayErrorMessage(): string {
    return this.errorMessage || (this.hasScheduleError ? this.scheduleFeedbackMessage : '');
  }

  get errorBannerTitle(): string {
    return this.errorMessage ? 'Creation blocked' : 'Schedule needs attention';
  }

  createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      location: ['', [Validators.required, Validators.minLength(3)]],
      capacity: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      category: ['', Validators.required],
      reservationApprovalRequired: [true],
      published: [false],
      price: ['', [Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      imageUrl: ['', [Validators.maxLength(500)]]
    }, {
      validators: eventScheduleValidator()
    });
  }

  onFileSelected(event: globalThis.Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      return;
    }

    const acceptedFiles: File[] = [];
    const validationMessages: string[] = [];

    files.forEach((file) => {
      const validationMessage = this.validateImageFile(file);
      if (validationMessage) {
        validationMessages.push(`${file.name}: ${validationMessage}`);
        return;
      }

      if (this.hasMatchingPendingFile(file)) {
        validationMessages.push(`${file.name}: this file is already queued.`);
        return;
      }

      acceptedFiles.push(file);
    });

    acceptedFiles.forEach((file) => {
      this.pendingImages.push({
        file,
        previewUrl: URL.createObjectURL(file)
      });
    });

    if (this.primaryPendingImageIndex === null && this.pendingImages.length > 0) {
      this.primaryPendingImageIndex = 0;
    }

    if (acceptedFiles.length > 0) {
      this.eventForm.patchValue({ imageUrl: '' });
      this.successMessage = '';
    }

    this.errorMessage = validationMessages.join(' ');
    input.value = '';
  }

  setPendingPrimary(index: number): void {
    if (index < 0 || index >= this.pendingImages.length) {
      return;
    }

    this.primaryPendingImageIndex = index;
  }

  removePendingImage(index: number): void {
    const pendingImage = this.pendingImages[index];
    if (!pendingImage) {
      return;
    }

    URL.revokeObjectURL(pendingImage.previewUrl);
    this.pendingImages.splice(index, 1);

    if (this.pendingImages.length === 0) {
      this.primaryPendingImageIndex = null;
      return;
    }

    if (this.primaryPendingImageIndex === null) {
      this.primaryPendingImageIndex = 0;
      return;
    }

    if (this.primaryPendingImageIndex === index) {
      this.primaryPendingImageIndex = Math.min(index, this.pendingImages.length - 1);
      return;
    }

    if (index < this.primaryPendingImageIndex) {
      this.primaryPendingImageIndex--;
    }
  }

  onLocationSelected(selection: EventLocationSelection): void {
    this.selectedLatitude = selection.latitude;
    this.selectedLongitude = selection.longitude;
    this.selectedPlaceId = selection.placeId ?? null;
    this.selectedMappedAddress = selection.address.trim();
    this.eventForm.patchValue({ location: selection.address });
    this.eventForm.get('location')?.markAsDirty();
  }

  clearPendingImages(): void {
    this.revokePendingImagePreviews();
    this.pendingImages = [];
    this.primaryPendingImageIndex = null;

    const fileInput = document.getElementById('imageFiles') as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  submitForm(): void {
    if (!this.canCreateEvents) {
      this.errorMessage = this.buildPermissionErrorMessage();
      return;
    }

    const scheduleErrorMessage = getEventScheduleValidationMessage(this.durationMinutes);
    if (scheduleErrorMessage) {
      this.markScheduleControlsTouched();
      this.errorMessage = scheduleErrorMessage;
      return;
    }

    if (!this.eventForm.valid) {
      this.eventForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    const imageValidationMessage = this.validatePendingImageChange();
    if (imageValidationMessage) {
      this.errorMessage = imageValidationMessage;
      this.eventForm.get('imageUrl')?.markAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const eventPayload = this.buildEventPayload();
    const queuedImageCount = this.pendingImages.length;

    const request$ = this.hasPendingImages
      ? this.eventService.createEventWithImages(eventPayload, this.getOrderedPendingFiles())
      : this.eventService.createEvent(eventPayload);

    request$.subscribe({
      next: (_createdEvent: EventResponseDTO) => {
        this.applyCreatedEventState();
        this.finishSuccess(
          queuedImageCount > 0
            ? `Event created successfully with ${queuedImageCount} gallery image${queuedImageCount === 1 ? '' : 's'}.`
            : 'Event created successfully!'
        );
      },
      error: (error: any) => {
        this.handleSaveError(error);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/events']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.eventForm.get(fieldName);
    if (!control || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `${fieldName} is required`;
    }
    if (control.errors['minlength']) {
      return `${fieldName} is too short`;
    }
    if (control.errors['min']) {
      return `${fieldName} must be greater than 0`;
    }
    if (control.errors['pattern']) {
      return `${fieldName} format is invalid`;
    }

    return 'Invalid field';
  }

  formatFileSize(sizeInBytes: number): string {
    if (sizeInBytes >= 1024 * 1024) {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`;
  }

  private buildEventPayload(): EventRequestDTO {
    const imageReference = this.getDirectImageUrl();
    const normalizedLocation = String(this.eventForm.value.location ?? '').trim();
    const shouldIncludeMappedCoordinates = this.hasMappedLocation
      && normalizedLocation.length > 0
      && normalizedLocation === this.selectedMappedAddress;
    const eventPayload: EventRequestDTO = {
      titre: this.eventForm.value.title,
      description: this.eventForm.value.description,
      categorie: this.eventForm.value.category as EventCategory,
      dateDebut: this.combineDateAndTime(this.eventForm.value.date, this.eventForm.value.startTime),
      dateFin: this.combineDateAndTime(this.eventForm.value.date, this.eventForm.value.endTime),
      lieu: this.eventForm.value.location,
      latitude: shouldIncludeMappedCoordinates ? this.selectedLatitude ?? undefined : undefined,
      longitude: shouldIncludeMappedCoordinates ? this.selectedLongitude ?? undefined : undefined,
      googlePlaceId: shouldIncludeMappedCoordinates ? this.selectedPlaceId ?? undefined : undefined,
      capaciteMax: parseInt(this.eventForm.value.capacity, 10),
      capaciteWaitlist: Math.floor(parseInt(this.eventForm.value.capacity, 10) * 0.1),
      reservationApprovalRequired: this.eventForm.value.reservationApprovalRequired !== false,
      published: this.eventForm.value.published === true,
      prix: parseFloat(this.eventForm.value.price),
      dureeMinutes: this.durationMinutes ?? 0
    };

    if (imageReference) {
      eventPayload.bannerImage = imageReference;
      eventPayload.thumbnailImage = imageReference;
      eventPayload.galleryImages = JSON.stringify([imageReference]);
    }

    return eventPayload;
  }

  private getDirectImageUrl(): string | undefined {
    if (this.hasPendingImages) {
      return undefined;
    }

    const imageUrl = this.eventForm.get('imageUrl')?.value;
    if (typeof imageUrl !== 'string') {
      return undefined;
    }

    const trimmedUrl = imageUrl.trim();
    return trimmedUrl || undefined;
  }

  private getOrderedPendingFiles(): File[] {
    if (this.primaryPendingImageIndex === null) {
      return this.pendingImages.map((pendingImage) => pendingImage.file);
    }

    const orderedImages = [...this.pendingImages];
    const [primaryImage] = orderedImages.splice(this.primaryPendingImageIndex, 1);

    return [primaryImage, ...orderedImages]
      .filter((pendingImage): pendingImage is PendingImagePreview => !!pendingImage)
      .map((pendingImage) => pendingImage.file);
  }

  private validatePendingImageChange(): string | null {
    const directImageUrl = this.getDirectImageUrl();
    if (!directImageUrl) {
      return null;
    }

    if (directImageUrl.length > 500) {
      return 'Image URL must be 500 characters or fewer. Use a direct image URL or upload a file instead.';
    }

    try {
      const parsedUrl = new URL(directImageUrl);
      if (!/^https?:$/i.test(parsedUrl.protocol)) {
        return 'Image URL must start with http:// or https://.';
      }

      if (this.isSearchResultsUrl(parsedUrl)) {
        return 'Please use a direct image URL, not a Google or Bing search results link. Upload the file instead if needed.';
      }

      if (this.isKnownImagePageUrl(parsedUrl)) {
        return 'Please use a direct image file URL. Unsplash and other photo page links will not work. Upload the file instead if needed.';
      }

      if (!this.isDirectImageUrl(parsedUrl)) {
        return 'Please use a direct image file URL ending in .jpg, .jpeg, .png, .webp, .gif, or .avif, or upload the file instead.';
      }
    } catch {
      return 'Please enter a valid direct image URL or upload a file instead.';
    }

    return null;
  }

  private isSearchResultsUrl(url: URL): boolean {
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    if (hostname.includes('google.') && (pathname.includes('/search') || pathname.includes('/imgres'))) {
      return true;
    }

    if (hostname.includes('bing.com') && pathname.includes('/images/search')) {
      return true;
    }

    if (hostname.includes('duckduckgo.com') && url.searchParams.get('ia') === 'images') {
      return true;
    }

    if (hostname.includes('yahoo.') && pathname.includes('/images/search')) {
      return true;
    }

    return false;
  }

  private validateImageFile(file: File): string | null {
    if (!this.isAllowedImageFile(file)) {
      return 'please select a JPG, JPEG, PNG, GIF, or WebP file.';
    }

    if (file.size > this.maxImageSize) {
      return 'image size must be 10MB or less.';
    }

    return null;
  }

  private hasMatchingPendingFile(file: File): boolean {
    return this.pendingImages.some((pendingImage) =>
      pendingImage.file.name === file.name
      && pendingImage.file.size === file.size
      && pendingImage.file.lastModified === file.lastModified
    );
  }

  private isAllowedImageFile(file: File): boolean {
    const fileName = file.name.toLowerCase();
    const extension = fileName.includes('.')
      ? fileName.substring(fileName.lastIndexOf('.') + 1)
      : '';

    return this.allowedMimeTypes.includes(file.type) || this.allowedFileExtensions.includes(extension);
  }

  private isKnownImagePageUrl(url: URL): boolean {
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

    return [
      'unsplash.com',
      'pexels.com',
      'pixabay.com',
      'shutterstock.com',
      'gettyimages.com'
    ].includes(hostname);
  }

  private isDirectImageUrl(url: URL): boolean {
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = url.pathname.toLowerCase();

    if (pathname.includes('/api/events/images/') && pathname.endsWith('/content')) {
      return true;
    }

    if (this.directImageHosts.includes(hostname)) {
      return true;
    }

    return this.directImageExtensions.some((extension) => pathname.endsWith(extension));
  }

  private finishSuccess(message: string): void {
    this.successMessage = message;
    this.isSubmitting = false;
    setTimeout(() => {
      this.router.navigate(['/admin/events']);
    }, 1500);
  }

  private handleSaveError(error: any): void {
    this.isSubmitting = false;
    console.error('Error creating event:', error);
    const errorMessage = this.extractValidationError(error);
    const rewrittenScheduleMessage = rewriteScheduleSaveErrorMessage(errorMessage, this.durationMinutes);

    if (error.status === 403) {
      this.errorMessage = this.isGenericForbiddenMessage(errorMessage)
        ? this.buildPermissionErrorMessage(true)
        : errorMessage || this.buildPermissionErrorMessage(true);
      return;
    }

    if (error.status === 400) {
      this.errorMessage = rewrittenScheduleMessage || 'Invalid event data. Please check the form and try again.';
      return;
    }

    if (rewrittenScheduleMessage) {
      this.errorMessage = rewrittenScheduleMessage;
      return;
    }

    this.errorMessage = 'Failed to create event. Please try again.';
  }

  private resolvePermissionContext(): void {
    this.currentRole = this.authService.getRole();

    this.authService.fetchCurrentUser().subscribe({
      next: () => {
        this.currentRole = this.authService.getRole();

        if (!this.canCreateEvents) {
          this.errorMessage = this.buildPermissionErrorMessage();
        }
      },
      error: (error: any) => {
        this.currentRole = this.authService.getRole();

        if (error?.status === 401 || error?.status === 403) {
          this.errorMessage = 'Your session is no longer authorized. Please log in again with an ADMINISTRATEUR, GERANT_RESTAU, or GUIDE account.';
          return;
        }

        if (!this.canCreateEvents) {
          this.errorMessage = this.buildPermissionErrorMessage();
        }
      }
    });
  }

  private buildPermissionErrorMessage(receivedServer403 = false): string {
    const detectedRole = this.currentRole || this.authService.getRole();

    if (!detectedRole) {
      return receivedServer403
        ? 'The backend rejected this create request because this session is not recognized as an ADMINISTRATEUR, GERANT_RESTAU, or GUIDE account. Please log in again and retry.'
        : 'Only ADMINISTRATEUR, GERANT_RESTAU, or GUIDE accounts can create events. Please log in with one of those roles.';
    }

    if (!this.authService.canManageEvents(detectedRole)) {
      return `Your account role is ${detectedRole}. Only ADMINISTRATEUR, GERANT_RESTAU, or GUIDE accounts can create events. Log out and sign in with an authorized account.`;
    }

    return `The backend rejected this request even though this session is marked as ${detectedRole}. Refresh the page once and try again. If it still fails, log out and back in so the session can resync.`;
  }

  private isGenericForbiddenMessage(message: string | null): boolean {
    if (!message) {
      return true;
    }

    const normalizedMessage = message.trim().toLowerCase();
    return normalizedMessage === 'forbidden'
      || normalizedMessage === 'access denied'
      || normalizedMessage === 'access is denied'
      || normalizedMessage === 'request failed with status code 403';
  }

  private extractValidationError(error: any): string | null {
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

    const validationErrors = apiError.errors;
    if (Array.isArray(validationErrors)) {
      const messages = validationErrors
        .map((entry: unknown) => {
          if (typeof entry === 'string') {
            return entry.trim();
          }
          if (entry && typeof entry === 'object' && 'defaultMessage' in entry) {
            const defaultMessage = (entry as { defaultMessage?: unknown }).defaultMessage;
            return typeof defaultMessage === 'string' ? defaultMessage.trim() : '';
          }
          return '';
        })
        .filter(Boolean);

      return messages.length > 0 ? messages.join(' ') : null;
    }

    if (validationErrors && typeof validationErrors === 'object') {
      const messages = Object.values(validationErrors)
        .map((value: unknown) => typeof value === 'string' ? value.trim() : '')
        .filter(Boolean);

      return messages.length > 0 ? messages.join(' ') : null;
    }

    return null;
  }

  private applyCreatedEventState(): void {
    this.clearPendingImages();
    this.eventForm.patchValue({ imageUrl: '' }, { emitEvent: false });
    this.selectedLatitude = null;
    this.selectedLongitude = null;
    this.selectedPlaceId = null;
    this.selectedMappedAddress = '';
  }

  private revokePendingImagePreviews(): void {
    this.pendingImages.forEach((pendingImage) => {
      URL.revokeObjectURL(pendingImage.previewUrl);
    });
  }

  private combineDateAndTime(date: string, time: string): string {
    return `${date}T${time}:00.000Z`;
  }

  private markScheduleControlsTouched(): void {
    this.eventForm.get('startTime')?.markAsTouched();
    this.eventForm.get('endTime')?.markAsTouched();
  }
}
