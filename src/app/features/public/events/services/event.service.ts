import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Event,
  EventDuplicateRequestDTO,
  EventReservation,
  ReservationRequestDTO,
  ReservationResponseDTO,
  EventImageDTO,
  EventRequestDTO,
  EventResponseDTO,
  PromotionOfferResponseDTO,
  PromotionPreviewDTO,
  StripeCheckoutSessionResponseDTO,
  UserNotificationResponseDTO,
  UserReservationStatsDTO
} from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly eventsBaseUrl = 'http://localhost:8082/api/events';
  private readonly reservationsBaseUrl = 'http://localhost:8082/api/reservations';
  private readonly promotionsBaseUrl = 'http://localhost:8082/api/promotions';
  private readonly notificationsBaseUrl = 'http://localhost:8082/api/notifications';

  constructor(private http: HttpClient) {}

  // ========== EVENTS ENDPOINTS ==========

  // GET all events
  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/getAllEvents`);
  }

  // GET event by ID
  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.eventsBaseUrl}/getEvent/${id}`);
  }

  // GET upcoming events
  getUpcomingEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/getUpcoming`);
  }

  // GET available events (not full capacity)
  getAvailableEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/available`);
  }

  // GET events by category
  getEventsByCategory(category: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/getByCategory/${category}`);
  }

  // GET events by status
  getEventsByStatus(status: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/getByStatus/${status}`);
  }

  // GET events by organizer
  getEventsByOrganizer(organizerId: number): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/getByOrganizer/${organizerId}`);
  }

  // GET events by location
  getEventsByLocation(location: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/getByLocation`, {
      params: { lieu: location }
    });
  }

  // GET events by date range
  getEventsByDateRange(startDate: string, endDate: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/getByDateRange`, {
      params: { startDate, endDate }
    });
  }

  // GET available seats for event
  getAvailableSeats(eventId: number): Observable<number> {
    return this.http.get<number>(`${this.eventsBaseUrl}/availableSeats/${eventId}`);
  }

  // GET participant count
  getParticipantCount(eventId: number): Observable<number> {
    return this.http.get<number>(`${this.eventsBaseUrl}/participants/${eventId}/count`);
  }

  // GET waitlist count
  getWaitlistCount(eventId: number): Observable<number> {
    return this.http.get<number>(`${this.eventsBaseUrl}/waitlist/${eventId}/count`);
  }

  // GET event revenue (analytics)
  getEventRevenue(eventId: number): Observable<number> {
    return this.http.get<number>(`${this.eventsBaseUrl}/analytics/revenue/${eventId}`);
  }

  // GET organizer total participants (analytics)
  getOrganizerTotalParticipants(organizerId: number): Observable<number> {
    return this.http.get<number>(`${this.eventsBaseUrl}/analytics/organizer/${organizerId}/totalParticipants`);
  }

  // Search events
  searchEvents(keyword: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/search`, {
      params: { keyword }
    });
  }

  // ========== EVENT ADMIN OPERATIONS ==========

  // POST create new event (JSON format)
  createEvent(eventRequest: EventRequestDTO): Observable<EventResponseDTO> {
    return this.http.post<EventResponseDTO>(`${this.eventsBaseUrl}/createEvent`, eventRequest);
  }

  // POST create new event with image file
  createEventWithFile(formData: FormData): Observable<EventResponseDTO> {
    return this.http.post<EventResponseDTO>(`${this.eventsBaseUrl}/createEventWithImages`, formData);
  }

  // POST create new event with gallery images
  createEventWithImages(eventRequest: EventRequestDTO, imageFiles: File[]): Observable<EventResponseDTO> {
    const formData = new FormData();
    formData.append(
      'event',
      new Blob([JSON.stringify(eventRequest)], { type: 'application/json' })
    );

    imageFiles.forEach((imageFile) => {
      formData.append('images', imageFile);
    });

    return this.http.post<EventResponseDTO>(`${this.eventsBaseUrl}/createEventWithImages`, formData);
  }

  // PUT update event
  updateEvent(id: number, event: EventRequestDTO): Observable<EventResponseDTO> {
    return this.http.put<EventResponseDTO>(`${this.eventsBaseUrl}/updateEvent/${id}`, event);
  }

  publishEvent(id: number): Observable<EventResponseDTO> {
    return this.http.put<EventResponseDTO>(`${this.eventsBaseUrl}/${id}/publish`, {});
  }

  unpublishEvent(id: number): Observable<EventResponseDTO> {
    return this.http.put<EventResponseDTO>(`${this.eventsBaseUrl}/${id}/unpublish`, {});
  }

  duplicateEvent(id: number, payload: EventDuplicateRequestDTO): Observable<EventResponseDTO[]> {
    return this.http.post<EventResponseDTO[]>(`${this.eventsBaseUrl}/${id}/duplicate`, payload);
  }

  getFavoriteEvents(): Observable<EventResponseDTO[]> {
    return this.http.get<EventResponseDTO[]>(`${this.eventsBaseUrl}/favorites/me`);
  }

  addFavorite(eventId: number): Observable<void> {
    return this.http.post<void>(`${this.eventsBaseUrl}/${eventId}/favorite`, {});
  }

  removeFavorite(eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.eventsBaseUrl}/${eventId}/favorite`);
  }

  // PUT start event
  startEvent(id: number): Observable<void> {
    return this.http.put<void>(`${this.eventsBaseUrl}/startEvent/${id}`, {});
  }

  // PUT postpone event
  postponeEvent(id: number, newDate: string): Observable<void> {
    return this.http.put<void>(`${this.eventsBaseUrl}/postponeEvent/${id}`, { newDate });
  }

  // PUT complete event
  completeEvent(id: number): Observable<void> {
    return this.http.put<void>(`${this.eventsBaseUrl}/completeEvent/${id}`, {});
  }

  // PUT cancel event
  cancelEvent(id: number): Observable<void> {
    return this.http.put<void>(`${this.eventsBaseUrl}/cancelEvent/${id}`, {});
  }

  // DELETE event
  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.eventsBaseUrl}/deleteEvent/${id}`);
  }

  // ========== RESERVATIONS ENDPOINTS ==========

  // GET all reservations
  getAllReservations(): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/getAllReservations`);
  }

  // GET reservation by ID
  getReservationById(id: number): Observable<EventReservation> {
    return this.http.get<EventReservation>(`${this.reservationsBaseUrl}/getReservation/${id}`);
  }

  // GET user reservations
  getUserReservations(userId: number): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/getByUser/${userId}`);
  }

  getMyReservations(): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/me`);
  }

  // GET event reservations
  getEventReservations(eventId: number): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/getByEvent/${eventId}`);
  }

  // GET user cancelled reservations
  getUserCancelledReservations(userId: number): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/cancelled/${userId}`);
  }

  getMyReservationStats(): Observable<UserReservationStatsDTO> {
    return this.http.get<UserReservationStatsDTO>(`${this.reservationsBaseUrl}/me/stats`);
  }

  getPublicPromotions(): Observable<PromotionOfferResponseDTO[]> {
    return this.http.get<PromotionOfferResponseDTO[]>(`${this.eventsBaseUrl}/promotions/active`);
  }

  previewReservationPricing(
    eventId: number,
    numberOfParticipants: number,
    promoCode?: string
  ): Observable<PromotionPreviewDTO> {
    let params = new HttpParams()
      .set('eventId', eventId)
      .set('numberOfParticipants', numberOfParticipants);

    if (promoCode?.trim()) {
      params = params.set('promoCode', promoCode.trim());
    }

    return this.http.get<PromotionPreviewDTO>(`${this.eventsBaseUrl}/pricing/preview`, { params });
  }

  // GET pending reservations
  getPendingReservations(): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/pending`);
  }

  // GET unpaid reservations
  getUnpaidReservations(): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/unpaid`);
  }

  // GET refundable reservations
  getRefundableReservations(): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/refundable`);
  }

  // GET event waitlist
  getEventWaitlist(eventId: number): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/getWaitlist/${eventId}`);
  }

  // GET check if user on waitlist
  isUserOnWaitlist(userId: number, eventId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.reservationsBaseUrl}/isOnWaitlist/${userId}/${eventId}`);
  }

  // GET calculate reservation price
  calculateReservationPrice(eventId: number, numberOfParticipants: number): Observable<number> {
    return this.http.get<number>(`${this.reservationsBaseUrl}/calculatePrice/${eventId}`, {
      params: { numberOfParticipants }
    });
  }

  // GET confirmed reservations count
  getConfirmedReservationsCount(eventId: number): Observable<number> {
    return this.http.get<number>(`${this.reservationsBaseUrl}/analytics/confirmedCount/${eventId}`);
  }

  // GET event revenue (from reservations)
  getReservationRevenue(eventId: number): Observable<number> {
    return this.http.get<number>(`${this.reservationsBaseUrl}/analytics/revenue/${eventId}`);
  }

  // ========== RESERVATION ADMIN OPERATIONS ==========

  // POST create reservation
  createReservation(reservation: ReservationRequestDTO): Observable<ReservationResponseDTO> {
    return this.http.post<ReservationResponseDTO>(`${this.reservationsBaseUrl}/createReservation`, reservation);
  }

  // PUT update reservation
  updateReservation(id: number, reservation: ReservationRequestDTO): Observable<ReservationResponseDTO> {
    return this.http.put<ReservationResponseDTO>(`${this.reservationsBaseUrl}/updateReservation/${id}`, reservation);
  }

  // PUT confirm reservation
  confirmReservation(id: number): Observable<ReservationResponseDTO> {
    return this.http.put<ReservationResponseDTO>(`${this.reservationsBaseUrl}/confirmReservation/${id}`, {});
  }

  // PUT reject reservation
  rejectReservation(id: number, reason = ''): Observable<ReservationResponseDTO> {
    const params = reason ? new HttpParams().set('reason', reason) : undefined;
    return this.http.put<ReservationResponseDTO>(`${this.reservationsBaseUrl}/rejectReservation/${id}`, {}, { params });
  }

  // PUT mark no-show
  markAsNoShow(id: number): Observable<ReservationResponseDTO> {
    return this.http.put<ReservationResponseDTO>(`${this.reservationsBaseUrl}/markNoShow/${id}`, {});
  }

  // POST refund reservation
  refundReservation(id: number, reason = ''): Observable<void> {
    const params = reason ? new HttpParams().set('reason', reason) : undefined;
    return this.http.post<void>(`${this.reservationsBaseUrl}/refundReservation/${id}`, {}, { params });
  }

  // POST process payment
  processPayment(paymentData: any): Observable<void> {
    return this.http.post<void>(`${this.reservationsBaseUrl}/processPayment`, paymentData);
  }

  createCheckoutSession(reservationId: number): Observable<StripeCheckoutSessionResponseDTO> {
    return this.http.post<StripeCheckoutSessionResponseDTO>(
      `${this.reservationsBaseUrl}/${reservationId}/checkout-session`,
      {}
    );
  }

  syncCheckoutSession(sessionId: string): Observable<ReservationResponseDTO> {
    return this.http.post<ReservationResponseDTO>(
      `${this.reservationsBaseUrl}/checkout-session/sync`,
      { sessionId }
    );
  }

  downloadReservationReceipt(reservationId: number): Observable<Blob> {
    return this.http.get(`${this.reservationsBaseUrl}/${reservationId}/receipt`, {
      responseType: 'blob'
    });
  }

  downloadReservationCalendarInvite(reservationId: number): Observable<Blob> {
    return this.http.get(`${this.reservationsBaseUrl}/${reservationId}/calendar.ics`, {
      responseType: 'blob'
    });
  }

  getMyNotifications(): Observable<UserNotificationResponseDTO[]> {
    return this.http.get<UserNotificationResponseDTO[]>(`${this.notificationsBaseUrl}/me`);
  }

  getMyUnreadNotificationCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.notificationsBaseUrl}/me/unread-count`);
  }

  markNotificationAsRead(notificationId: number): Observable<UserNotificationResponseDTO> {
    return this.http.put<UserNotificationResponseDTO>(`${this.notificationsBaseUrl}/${notificationId}/read`, {});
  }

  markAllNotificationsAsRead(): Observable<void> {
    return this.http.put<void>(`${this.notificationsBaseUrl}/me/read-all`, {});
  }

  // PUT process waitlist
  processWaitlist(eventId: number): Observable<void> {
    return this.http.put<void>(`${this.reservationsBaseUrl}/processWaitlist/${eventId}`, {});
  }

  // DELETE cancel reservation
  cancelReservation(id: number, reason = ''): Observable<void> {
    const params = reason ? new HttpParams().set('reason', reason) : undefined;
    return this.http.delete<void>(`${this.reservationsBaseUrl}/cancelReservation/${id}`, { params });
  }

  // ========== EVENT IMAGE ENDPOINTS ==========

  // GET all images for an event
  getEventImages(eventId: number): Observable<EventImageDTO[]> {
    return this.http.get<EventImageDTO[]>(`${this.eventsBaseUrl}/${eventId}/images`);
  }

  // GET a specific image by ID
  getEventImage(imageId: number): Observable<EventImageDTO> {
    return this.http.get<EventImageDTO>(`${this.eventsBaseUrl}/images/${imageId}`);
  }

  // POST add image to event
  addImageToEvent(eventId: number, imageFile: File, makePrimary = false): Observable<EventResponseDTO> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('makePrimary', String(makePrimary));
    return this.http.post<EventResponseDTO>(`${this.eventsBaseUrl}/${eventId}/addImage`, formData);
  }

  // POST add multiple images to event
  addImagesToEvent(eventId: number, imageFiles: File[], makePrimary = false): Observable<EventResponseDTO> {
    const formData = new FormData();
    imageFiles.forEach((imageFile) => {
      formData.append('images', imageFile);
    });
    formData.append('makePrimary', String(makePrimary));

    return this.http.post<EventResponseDTO>(`${this.eventsBaseUrl}/${eventId}/images`, formData);
  }

  // DELETE an image
  deleteEventImage(eventId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.eventsBaseUrl}/${eventId}/images/${imageId}`);
  }

  // PUT set image as primary
  setImageAsPrimary(eventId: number, imageId: number): Observable<EventResponseDTO> {
    return this.http.put<EventResponseDTO>(`${this.eventsBaseUrl}/${eventId}/images/${imageId}/setAsPrimary`, {});
  }

  getEventPrimaryImageUrl(event?: Partial<EventResponseDTO> | null, fallbackUrl = ''): string {
    if (!event) {
      return fallbackUrl;
    }

    const metadataPrimaryImage = event.images?.find((image) => image.isPrimary)?.imageUrl ?? event.images?.[0]?.imageUrl;
    const firstGalleryUrl = event.galleryImageUrls?.find((url) => this.isNonEmptyString(url));
    const legacyGalleryUrl = this.parseLegacyGalleryImages(event.galleryImages)[0];
    const preferredImageUrl = event.primaryImageUrl
      ?? firstGalleryUrl
      ?? metadataPrimaryImage
      ?? event.thumbnailImage
      ?? event.bannerImage
      ?? legacyGalleryUrl;

    return this.resolveImageUrl(preferredImageUrl) || fallbackUrl;
  }

  getEventGalleryImageUrls(event?: Partial<EventResponseDTO> | null): string[] {
    if (!event) {
      return [];
    }

    const galleryUrls = [
      ...(event.galleryImageUrls ?? []),
      ...(event.images ?? []).map((image) => image.imageUrl),
      ...(event.primaryImageUrl ? [event.primaryImageUrl] : []),
      ...(event.thumbnailImage ? [event.thumbnailImage] : []),
      ...(event.bannerImage ? [event.bannerImage] : []),
      ...this.parseLegacyGalleryImages(event.galleryImages)
    ];

    const uniqueUrls = new Set<string>();

    return galleryUrls
      .map((imageUrl) => this.resolveImageUrl(imageUrl))
      .filter((imageUrl) => this.isNonEmptyString(imageUrl))
      .filter((imageUrl) => {
        if (uniqueUrls.has(imageUrl)) {
          return false;
        }

        uniqueUrls.add(imageUrl);
        return true;
      });
  }

  resolveImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) {
      return '';
    }

    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl) {
      return '';
    }

    if (trimmedUrl.startsWith('data:') || /^https?:\/\//i.test(trimmedUrl)) {
      return trimmedUrl;
    }

    const normalizedUrl = trimmedUrl.replace(/\\/g, '/');
    if (normalizedUrl.startsWith('/api/')) {
      return `http://localhost:8082${normalizedUrl}`;
    }
    if (normalizedUrl.startsWith('api/')) {
      return `http://localhost:8082/${normalizedUrl}`;
    }
    if (normalizedUrl.startsWith('/events/')) {
      return `http://localhost:8082/api${normalizedUrl}`;
    }
    if (normalizedUrl.startsWith('events/')) {
      return `http://localhost:8082/api/${normalizedUrl}`;
    }

    return normalizedUrl;
  }

  private parseLegacyGalleryImages(galleryImages?: string | null): string[] {
    if (!galleryImages || typeof galleryImages !== 'string') {
      return [];
    }

    const trimmedValue = galleryImages.trim();
    if (!trimmedValue) {
      return [];
    }

    try {
      const parsedValue = JSON.parse(trimmedValue) as unknown;
      if (Array.isArray(parsedValue)) {
        return parsedValue.filter((value): value is string => this.isNonEmptyString(value));
      }
    } catch {
      if (this.isNonEmptyString(trimmedValue)) {
        return [trimmedValue];
      }
    }

    return [];
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
