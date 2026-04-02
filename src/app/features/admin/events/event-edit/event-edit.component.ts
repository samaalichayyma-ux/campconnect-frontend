import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { EventLocationMapComponent } from '../../../public/events/components/event-location-map/event-location-map.component';
import { EventCategory, EventImageDTO, EventLocationSelection, EventRequestDTO, EventResponseDTO } from '../../../public/events/models/event.model';
import { EventService } from '../../../public/events/services/event.service';

interface PendingImagePreview {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-event-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminIconComponent, EventLocationMapComponent],
  templateUrl: './event-edit.component.html',
  styleUrl: './event-edit.component.css'
})
export class EventEditComponent implements OnInit, OnDestroy {
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

  readonly fallbackImageUrl = 'assets/images/default-image.jpg';

  eventForm: FormGroup;
  isSubmitting = false;
  isLoading = false;
  isGalleryActionRunning = false;
  errorMessage = '';
  successMessage = '';

  private originalFormValue: Record<string, string> | null = null;

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

  eventId: number | null = null;
  currentImageUrl: string | null = null;
  currentGalleryImageUrls: string[] = [];
  eventImages: EventImageDTO[] = [];
  imageCount = 0;
  pendingImages: PendingImagePreview[] = [];
  primaryPendingImageIndex: number | null = null;
  selectedLatitude: number | null = null;
  selectedLongitude: number | null = null;
  selectedPlaceId: string | null = null;
  selectedMappedAddress = '';

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.eventForm = this.createForm();
  }

  ngOnInit(): void {
    this.eventId = parseInt(this.route.snapshot.paramMap.get('id') || '0', 10);
    if (this.eventId) {
      this.loadEvent(this.eventId);
    }
  }

  ngOnDestroy(): void {
    this.revokePendingImagePreviews();
  }

  get hasLiveGallery(): boolean {
    return this.imageCount > 0 || this.eventImages.length > 0;
  }

  get hasPendingImages(): boolean {
    return this.pendingImages.length > 0;
  }

  get queuedImageCount(): number {
    return this.pendingImages.length;
  }

  get liveGalleryCount(): number {
    return Math.max(this.imageCount, this.eventImages.length);
  }

  get primaryPendingImage(): PendingImagePreview | null {
    if (this.primaryPendingImageIndex === null) {
      return null;
    }

    return this.pendingImages[this.primaryPendingImageIndex] ?? null;
  }

  get currentPrimaryImage(): EventImageDTO | null {
    return this.eventImages.find((image) => image.isPrimary) ?? this.eventImages[0] ?? null;
  }

  get directImagePreviewUrl(): string | null {
    return this.getDirectImageUrl() ?? null;
  }

  get leadPreviewUrl(): string | null {
    return this.primaryPendingImage?.previewUrl
      ?? this.directImagePreviewUrl
      ?? this.currentImageUrl;
  }

  get coverSourceLabel(): string {
    if (this.primaryPendingImage) {
      return `${this.primaryPendingImage.file.name} (queued cover)`;
    }

    if (this.directImagePreviewUrl) {
      return 'Direct image URL';
    }

    if (this.currentPrimaryImage?.imageName) {
      return this.currentPrimaryImage.imageName;
    }

    if (this.currentImageUrl) {
      return 'Current cover image';
    }

    return 'No image selected';
  }

  get mappedLocationSummary(): string {
    if (this.selectedLatitude === null || this.selectedLongitude === null) {
      return 'Address only';
    }

    return `${this.selectedLatitude.toFixed(5)}, ${this.selectedLongitude.toFixed(5)}`;
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
    });
  }

  loadEvent(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.eventService.getEventById(id).subscribe({
      next: (event: EventResponseDTO) => {
        this.patchFormFromEvent(event);
        this.syncImageStateFromEvent(event);
        this.originalFormValue = this.captureFormSnapshot();
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load event details.';
        console.error('Error loading event:', error);
      }
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

    if (!this.hasLiveGallery && this.primaryPendingImageIndex === null && this.pendingImages.length > 0) {
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

  keepCurrentPrimary(): void {
    if (!this.hasLiveGallery) {
      return;
    }

    this.primaryPendingImageIndex = null;
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
      return;
    }

    if (this.primaryPendingImageIndex === index) {
      this.primaryPendingImageIndex = this.hasLiveGallery ? null : Math.min(index, this.pendingImages.length - 1);
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

  setPrimaryImage(imageId: number): void {
    if (!this.eventId || this.isGalleryActionRunning || this.isSubmitting) {
      return;
    }

    this.isGalleryActionRunning = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.setImageAsPrimary(this.eventId, imageId).subscribe({
      next: (updatedEvent: EventResponseDTO) => {
        this.syncImageStateFromEvent(updatedEvent);
        this.successMessage = 'Cover image updated successfully.';
        this.isGalleryActionRunning = false;
      },
      error: (error: any) => {
        this.handleGalleryActionError(error, 'Failed to update the cover image.');
      }
    });
  }

  deleteImage(imageId: number): void {
    if (!this.eventId || this.isGalleryActionRunning || this.isSubmitting) {
      return;
    }

    this.isGalleryActionRunning = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.deleteEventImage(this.eventId, imageId).subscribe({
      next: () => {
        this.refreshImageState('Image removed from the gallery.');
      },
      error: (error: any) => {
        this.handleGalleryActionError(error, 'Failed to remove the image.');
      }
    });
  }

  submitForm(): void {
    if (!this.eventForm.valid || !this.eventId) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    const imageValidationMessage = this.validatePendingImageChange();
    if (imageValidationMessage) {
      this.errorMessage = imageValidationMessage;
      this.eventForm.get('imageUrl')?.markAsTouched();
      return;
    }

    const hasDetailsChange = this.hasEventDetailsChanges();
    const hasDirectImageUpdate = this.hasDirectImageUrlUpdate();

    if (!hasDetailsChange && this.hasPendingImages) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';
      this.uploadPendingImages(this.eventId, this.primaryPendingImageIndex !== null
        ? 'Gallery updated successfully with a new cover image.'
        : 'Gallery updated successfully.', true);
      return;
    }

    if (!hasDetailsChange && !hasDirectImageUpdate && !this.hasPendingImages) {
      this.errorMessage = 'No changes to save.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const eventPayload = this.buildEventPayload();
    this.eventService.updateEvent(this.eventId, eventPayload).subscribe({
      next: (updatedEvent: EventResponseDTO) => {
        this.applySavedEventState(updatedEvent);

        if (this.hasPendingImages) {
          this.uploadPendingImages(this.eventId!, this.primaryPendingImageIndex !== null
            ? 'Event and gallery updated successfully with a new cover image.'
            : 'Event and gallery updated successfully.', true);
          return;
        }

        this.finishSuccess(hasDirectImageUpdate && !hasDetailsChange
          ? 'Event image updated successfully!'
          : 'Event updated successfully!');
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

  getImageUrl(imageUrl?: string | null): string {
    return this.eventService.resolveImageUrl(imageUrl) || this.fallbackImageUrl;
  }

  onImageError(event: globalThis.Event): void {
    const imageElement = event.target as HTMLImageElement | null;
    if (!imageElement || imageElement.dataset['fallbackApplied'] === 'true') {
      return;
    }

    imageElement.dataset['fallbackApplied'] = 'true';
    imageElement.src = this.fallbackImageUrl;
  }

  private buildEventPayload(): EventRequestDTO {
    const imageReference = this.getDirectImageUrl();
    const normalizedLocation = String(this.eventForm.value.location ?? '').trim();
    const shouldIncludeMappedCoordinates = this.selectedLatitude !== null
      && this.selectedLongitude !== null
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
      dureeMinutes: this.calculateDurationMinutes(this.eventForm.value.startTime, this.eventForm.value.endTime)
    };

    if (imageReference) {
      eventPayload.bannerImage = imageReference;
      eventPayload.thumbnailImage = imageReference;
      eventPayload.galleryImages = JSON.stringify(this.buildGalleryReferences(imageReference));
    }

    return eventPayload;
  }

  private patchFormFromEvent(event: EventResponseDTO): void {
    this.eventForm.patchValue({
      title: event.titre,
      description: event.description,
      date: event.dateDebut.split('T')[0],
      startTime: event.dateDebut.split('T')[1]?.substring(0, 5),
      endTime: event.dateFin.split('T')[1]?.substring(0, 5),
      location: event.lieu,
      category: event.categorie,
      capacity: event.capaciteMax.toString(),
      reservationApprovalRequired: event.reservationApprovalRequired !== false,
      published: event.published !== false,
      price: event.prix.toString(),
      imageUrl: ''
    });
    this.selectedLatitude = event.latitude ?? null;
    this.selectedLongitude = event.longitude ?? null;
    this.selectedPlaceId = event.googlePlaceId ?? null;
    this.selectedMappedAddress = (event.latitude !== undefined && event.longitude !== undefined) ? event.lieu.trim() : '';
  }

  private syncImageStateFromEvent(event: EventResponseDTO): void {
    this.currentImageUrl = this.eventService.getEventPrimaryImageUrl(event) || null;
    this.currentGalleryImageUrls = this.eventService.getEventGalleryImageUrls(event);
    this.eventImages = this.sortEventImages(event.images ?? []);
    this.imageCount = event.imageCount ?? event.images?.length ?? 0;

    if (!this.eventImages.length && this.imageCount > 0 && this.eventId) {
      this.loadEventImages(this.eventId);
    }
  }

  private loadEventImages(eventId: number): void {
    this.eventService.getEventImages(eventId).subscribe({
      next: (images: EventImageDTO[]) => {
        this.eventImages = this.sortEventImages(images);
        this.imageCount = Math.max(this.imageCount, images.length);
        this.currentGalleryImageUrls = images
          .map((image) => this.eventService.resolveImageUrl(image.imageUrl))
          .filter((imageUrl): imageUrl is string => !!imageUrl);
      },
      error: (error: any) => {
        console.error('Error loading event gallery:', error);
      }
    });
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

  private buildGalleryReferences(primaryImageUrl: string): string[] {
    const normalizedPrimaryImageUrl = primaryImageUrl.trim();
    const existingGalleryUrls = this.currentGalleryImageUrls
      .map((imageUrl) => imageUrl.trim())
      .filter((imageUrl) => imageUrl.length > 0 && imageUrl !== normalizedPrimaryImageUrl);

    return [normalizedPrimaryImageUrl, ...existingGalleryUrls];
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

  private hasDirectImageUrlUpdate(): boolean {
    return !!this.getDirectImageUrl();
  }

  private hasEventDetailsChanges(): boolean {
    if (!this.originalFormValue) {
      return true;
    }

    const currentFormValue = this.captureFormSnapshot();
    return Object.keys(this.originalFormValue).some((key) => currentFormValue[key] !== this.originalFormValue?.[key]);
  }

  private captureFormSnapshot(): Record<string, string> {
    return {
      title: String(this.eventForm.get('title')?.value ?? '').trim(),
      description: String(this.eventForm.get('description')?.value ?? '').trim(),
      date: String(this.eventForm.get('date')?.value ?? ''),
      startTime: String(this.eventForm.get('startTime')?.value ?? ''),
      endTime: String(this.eventForm.get('endTime')?.value ?? ''),
      location: String(this.eventForm.get('location')?.value ?? '').trim(),
      capacity: String(this.eventForm.get('capacity')?.value ?? ''),
      category: String(this.eventForm.get('category')?.value ?? ''),
      reservationApprovalRequired: String(this.eventForm.get('reservationApprovalRequired')?.value ?? 'true'),
      price: String(this.eventForm.get('price')?.value ?? '')
    };
  }

  private uploadPendingImages(eventId: number, successMessage: string, navigateAfterSuccess = false): void {
    const orderedFiles = this.getOrderedPendingFiles();
    if (orderedFiles.length === 0) {
      if (navigateAfterSuccess) {
        this.finishSuccess(successMessage);
      } else {
        this.successMessage = successMessage;
      }
      return;
    }

    this.eventService.addImagesToEvent(eventId, orderedFiles, this.primaryPendingImageIndex !== null).subscribe({
      next: (updatedEvent: EventResponseDTO) => {
        this.clearPendingImages();
        this.syncImageStateFromEvent(updatedEvent);

        if (navigateAfterSuccess) {
          this.finishSuccess(successMessage);
        } else {
          this.isSubmitting = false;
          this.successMessage = successMessage;
        }
      },
      error: (error: any) => {
        this.isSubmitting = false;
        const uploadErrorMessage = this.extractValidationError(error);
        this.successMessage = 'Event saved, but the gallery upload failed.';
        this.errorMessage = uploadErrorMessage || 'Please reopen the event and try the gallery upload again.';
        console.error('Error uploading event gallery:', error);
      }
    });
  }

  private refreshImageState(successMessage: string): void {
    if (!this.eventId) {
      this.isGalleryActionRunning = false;
      return;
    }

    this.eventService.getEventById(this.eventId).subscribe({
      next: (event: EventResponseDTO) => {
        this.syncImageStateFromEvent(event);
        this.successMessage = successMessage;
        this.isGalleryActionRunning = false;
      },
      error: (error: any) => {
        this.handleGalleryActionError(error, 'The image changed, but the gallery could not be refreshed.');
      }
    });
  }

  private handleGalleryActionError(error: any, fallbackMessage: string): void {
    this.isGalleryActionRunning = false;
    const errorMessage = this.extractValidationError(error);
    this.errorMessage = errorMessage || fallbackMessage;
    console.error('Gallery action failed:', error);
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
    const errorMessage = this.extractValidationError(error);

    if (error.status === 403) {
      this.errorMessage = errorMessage || 'You do not have permission to update this event.';
    } else if (error.status === 404) {
      this.errorMessage = 'Event not found.';
    } else if (error.status === 400) {
      this.errorMessage = errorMessage || 'Invalid event data. Please check the form and try again.';
    } else {
      this.errorMessage = errorMessage || 'Failed to update event. Please try again.';
    }

    console.error('Error updating event:', error);
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

  private applySavedEventState(event: EventResponseDTO): void {
    this.syncImageStateFromEvent(event);
    this.eventForm.patchValue({ imageUrl: '' }, { emitEvent: false });
    this.originalFormValue = this.captureFormSnapshot();
  }

  private sortEventImages(images: EventImageDTO[]): EventImageDTO[] {
    return [...images].sort((firstImage, secondImage) => {
      if (firstImage.isPrimary !== secondImage.isPrimary) {
        return firstImage.isPrimary ? -1 : 1;
      }

      if (firstImage.displayOrder !== secondImage.displayOrder) {
        return firstImage.displayOrder - secondImage.displayOrder;
      }

      return firstImage.id - secondImage.id;
    });
  }

  private revokePendingImagePreviews(): void {
    this.pendingImages.forEach((pendingImage) => {
      URL.revokeObjectURL(pendingImage.previewUrl);
    });
  }

  private combineDateAndTime(date: string, time: string): string {
    return `${date}T${time}:00.000Z`;
  }

  private calculateDurationMinutes(startTime: string, endTime: string): number {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    return Math.max(0, endTotalMinutes - startTotalMinutes);
  }
}
