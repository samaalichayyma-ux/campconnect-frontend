import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import {
  Event,
  EventDuplicateRequestDTO,
  EventReservation,
  ReservationFeedbackRequestDTO,
  ReservationRequestDTO,
  ReservationResponseDTO,
  EventImageDTO,
  EventRequestDTO,
  EventResponseDTO,
  PromotionOfferRequestDTO,
  PromotionOfferResponseDTO,
  PromotionScope,
  PromotionTargetEventSummaryDTO,
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
  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/getAllEvents`);
  }

  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.eventsBaseUrl}/getEvent/${id}`);
  }

  getUpcomingEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/getUpcoming`);
  }

  getAvailableEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/available`);
  }

  getEventsByCategory(category: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/getByCategory/${category}`);
  }

  getEventsByStatus(status: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/getByStatus/${status}`);
  }

  getEventsByOrganizer(organizerId: number): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/getByOrganizer/${organizerId}`);
  }

  getEventsByLocation(location: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/getByLocation`, {
      params: { lieu: location }
    });
  }

  getEventsByDateRange(startDate: string, endDate: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/getByDateRange`, {
      params: { startDate, endDate }
    });
  }

  getAvailableSeats(eventId: number): Observable<number> {
    return this.http.get<number>(`${this.eventsBaseUrl}/availableSeats/${eventId}`);
  }

  getParticipantCount(eventId: number): Observable<number> {
    return this.http.get<number>(`${this.eventsBaseUrl}/participants/${eventId}/count`);
  }

  getWaitlistCount(eventId: number): Observable<number> {
    return this.http.get<number>(`${this.eventsBaseUrl}/waitlist/${eventId}/count`);
  }

  getEventRevenue(eventId: number): Observable<number> {
    return this.http.get<number>(`${this.eventsBaseUrl}/analytics/revenue/${eventId}`);
  }

  getOrganizerTotalParticipants(organizerId: number): Observable<number> {
    return this.http.get<number>(`${this.eventsBaseUrl}/analytics/organizer/${organizerId}/totalParticipants`);
  }

  searchEvents(keyword: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsBaseUrl}/search`, {
      params: { keyword }
    });
  }
  createEvent(eventRequest: EventRequestDTO): Observable<EventResponseDTO> {
    return this.http.post<EventResponseDTO>(`${this.eventsBaseUrl}/createEvent`, eventRequest);
  }

  createEventWithFile(formData: FormData): Observable<EventResponseDTO> {
    return this.http.post<EventResponseDTO>(`${this.eventsBaseUrl}/createEventWithImages`, formData);
  }

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

  startEvent(id: number): Observable<void> {
    return this.http.put<void>(`${this.eventsBaseUrl}/startEvent/${id}`, {});
  }

  postponeEvent(id: number, newDate: string): Observable<void> {
    return this.http.put<void>(`${this.eventsBaseUrl}/postponeEvent/${id}`, { newDate });
  }

  completeEvent(id: number): Observable<void> {
    return this.http.put<void>(`${this.eventsBaseUrl}/completeEvent/${id}`, {});
  }

  cancelEvent(id: number): Observable<void> {
    return this.http.put<void>(`${this.eventsBaseUrl}/cancelEvent/${id}`, {});
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.eventsBaseUrl}/deleteEvent/${id}`);
  }
  getAllReservations(): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/getAllReservations`);
  }

  getReservationById(id: number): Observable<EventReservation> {
    return this.http.get<EventReservation>(`${this.reservationsBaseUrl}/getReservation/${id}`);
  }

  getUserReservations(userId: number): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/getByUser/${userId}`);
  }

  getMyReservations(): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/me`);
  }

  getEventReservations(eventId: number): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/getByEvent/${eventId}`);
  }

  getUserCancelledReservations(userId: number): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/cancelled/${userId}`);
  }

  getMyReservationStats(): Observable<UserReservationStatsDTO> {
    return this.http.get<UserReservationStatsDTO>(`${this.reservationsBaseUrl}/me/stats`);
  }

  getPublicPromotions(eventId?: number): Observable<PromotionOfferResponseDTO[]> {
    if (Number.isFinite(eventId) && Number(eventId) > 0) {
      return this.getEventPromotions(Number(eventId));
    }

    return this.http.get<unknown>(`${this.eventsBaseUrl}/promotions/active`).pipe(
      map((response) => this.normalizePromotions(response))
    );
  }

  getEventPromotions(eventId: number): Observable<PromotionOfferResponseDTO[]> {
    return this.http.get<unknown>(`${this.eventsBaseUrl}/${eventId}/promotions/active`).pipe(
      map((response) => this.normalizePromotions(response)),
      catchError(() =>
        this.http.get<unknown>(`${this.eventsBaseUrl}/${eventId}/promotions`).pipe(
          map((response) => this.normalizePromotions(response)),
          catchError(() => this.getPublicPromotions())
        )
      )
    );
  }

  getAdminPromotions(eventId?: number): Observable<PromotionOfferResponseDTO[]> {
    let params = new HttpParams();

    if (Number.isFinite(eventId) && Number(eventId) > 0) {
      params = params.set('eventId', Number(eventId));
    }

    return this.http.get<unknown>(`${this.promotionsBaseUrl}/admin`, { params }).pipe(
      map((response) => this.normalizePromotions(response))
    );
  }

  getAdminPromotionById(promotionId: number): Observable<PromotionOfferResponseDTO> {
    return this.http.get<unknown>(`${this.promotionsBaseUrl}/admin/${promotionId}`).pipe(
      map((response) => this.normalizePromotion(response))
    );
  }

  createAdminPromotion(promotion: PromotionOfferRequestDTO): Observable<PromotionOfferResponseDTO> {
    return this.http.post<unknown>(
      `${this.promotionsBaseUrl}/admin`,
      this.serializePromotionRequest(promotion)
    ).pipe(
      map((response) => this.normalizePromotion(response))
    );
  }

  updateAdminPromotion(promotionId: number, promotion: PromotionOfferRequestDTO): Observable<PromotionOfferResponseDTO> {
    return this.http.put<unknown>(
      `${this.promotionsBaseUrl}/admin/${promotionId}`,
      this.serializePromotionRequest(promotion)
    ).pipe(
      map((response) => this.normalizePromotion(response))
    );
  }

  deleteAdminPromotion(promotionId: number): Observable<void> {
    return this.http.delete<void>(`${this.promotionsBaseUrl}/admin/${promotionId}`);
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

  getPendingReservations(): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/pending`);
  }

  getUnpaidReservations(): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/unpaid`);
  }

  getRefundableReservations(): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/refundable`);
  }

  getEventWaitlist(eventId: number): Observable<EventReservation[]> {
    return this.http.get<EventReservation[]>(`${this.reservationsBaseUrl}/getWaitlist/${eventId}`);
  }

  isUserOnWaitlist(userId: number, eventId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.reservationsBaseUrl}/isOnWaitlist/${userId}/${eventId}`);
  }

  calculateReservationPrice(eventId: number, numberOfParticipants: number): Observable<number> {
    return this.http.get<number>(`${this.reservationsBaseUrl}/calculatePrice/${eventId}`, {
      params: { numberOfParticipants }
    });
  }

  getConfirmedReservationsCount(eventId: number): Observable<number> {
    return this.http.get<number>(`${this.reservationsBaseUrl}/analytics/confirmedCount/${eventId}`);
  }

  getReservationRevenue(eventId: number): Observable<number> {
    return this.http.get<number>(`${this.reservationsBaseUrl}/analytics/revenue/${eventId}`);
  }
  createReservation(reservation: ReservationRequestDTO): Observable<ReservationResponseDTO> {
    return this.http.post<ReservationResponseDTO>(`${this.reservationsBaseUrl}/createReservation`, reservation);
  }

  updateReservation(id: number, reservation: ReservationRequestDTO): Observable<ReservationResponseDTO> {
    return this.http.put<ReservationResponseDTO>(`${this.reservationsBaseUrl}/updateReservation/${id}`, reservation);
  }

  confirmReservation(id: number): Observable<ReservationResponseDTO> {
    return this.http.put<ReservationResponseDTO>(`${this.reservationsBaseUrl}/confirmReservation/${id}`, {});
  }

  markAsAttended(id: number): Observable<ReservationResponseDTO> {
    return this.http.put<ReservationResponseDTO>(`${this.reservationsBaseUrl}/markAttended/${id}`, {});
  }

  rejectReservation(id: number, reason = ''): Observable<ReservationResponseDTO> {
    const params = reason ? new HttpParams().set('reason', reason) : undefined;
    return this.http.put<ReservationResponseDTO>(`${this.reservationsBaseUrl}/rejectReservation/${id}`, {}, { params });
  }

  markAsNoShow(id: number): Observable<ReservationResponseDTO> {
    return this.http.put<ReservationResponseDTO>(`${this.reservationsBaseUrl}/markNoShow/${id}`, {});
  }

  refundReservation(id: number, reason = ''): Observable<void> {
    const params = reason ? new HttpParams().set('reason', reason) : undefined;
    return this.http.post<void>(`${this.reservationsBaseUrl}/refundReservation/${id}`, {}, { params });
  }

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

  submitReservationFeedback(
    reservationId: number,
    payload: ReservationFeedbackRequestDTO
  ): Observable<ReservationResponseDTO> {
    return this.http.post<ReservationResponseDTO>(
      `${this.reservationsBaseUrl}/${reservationId}/feedback`,
      payload
    );
  }

  downloadGuestList(eventId: number, format: 'csv' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.reservationsBaseUrl}/exports/guest-list/${eventId}`, {
      params: { format },
      responseType: 'blob'
    });
  }

  downloadAttendanceSheet(eventId: number, format: 'csv' | 'pdf' = 'pdf'): Observable<Blob> {
    return this.http.get(`${this.reservationsBaseUrl}/exports/attendance-sheet/${eventId}`, {
      params: { format },
      responseType: 'blob'
    });
  }

  downloadReservationReport(format: 'csv' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.reservationsBaseUrl}/exports/reservation-report`, {
      params: { format },
      responseType: 'blob'
    });
  }

  downloadRevenueReport(format: 'csv' | 'pdf' = 'pdf'): Observable<Blob> {
    return this.http.get(`${this.reservationsBaseUrl}/exports/revenue-report`, {
      params: { format },
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

  processWaitlist(eventId: number): Observable<void> {
    return this.http.put<void>(`${this.reservationsBaseUrl}/processWaitlist/${eventId}`, {});
  }

  cancelReservation(id: number, reason = ''): Observable<void> {
    const params = reason ? new HttpParams().set('reason', reason) : undefined;
    return this.http.delete<void>(`${this.reservationsBaseUrl}/cancelReservation/${id}`, { params });
  }
  getEventImages(eventId: number): Observable<EventImageDTO[]> {
    return this.http.get<EventImageDTO[]>(`${this.eventsBaseUrl}/${eventId}/images`);
  }

  getEventImage(imageId: number): Observable<EventImageDTO> {
    return this.http.get<EventImageDTO>(`${this.eventsBaseUrl}/images/${imageId}`);
  }

  addImageToEvent(eventId: number, imageFile: File, makePrimary = false): Observable<EventResponseDTO> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('makePrimary', String(makePrimary));
    return this.http.post<EventResponseDTO>(`${this.eventsBaseUrl}/${eventId}/addImage`, formData);
  }

  addImagesToEvent(eventId: number, imageFiles: File[], makePrimary = false): Observable<EventResponseDTO> {
    const formData = new FormData();
    imageFiles.forEach((imageFile) => {
      formData.append('images', imageFile);
    });
    formData.append('makePrimary', String(makePrimary));

    return this.http.post<EventResponseDTO>(`${this.eventsBaseUrl}/${eventId}/images`, formData);
  }

  deleteEventImage(eventId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.eventsBaseUrl}/${eventId}/images/${imageId}`);
  }

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

  private normalizePromotions(response: unknown): PromotionOfferResponseDTO[] {
    const promotions = this.extractArray(response);
    return promotions.map((promotion) => this.normalizePromotion(promotion));
  }

  private normalizePromotion(response: unknown): PromotionOfferResponseDTO {
    const promotion = typeof response === 'object' && response !== null
      ? response as Record<string, unknown>
      : {};
    const targetedEvents = this.normalizeTargetedEvents(
      promotion['targetedEvents']
      ?? promotion['events']
      ?? promotion['applicableEvents']
      ?? promotion['targetEvents']
    );
    const eventIds = this.extractEventIds(
      promotion['eventIds']
      ?? promotion['targetEventIds']
      ?? promotion['applicableEventIds']
      ?? targetedEvents
    );
    const appliesToAllEvents = this.getBoolean(
      promotion['appliesToAllEvents'],
      promotion['global'],
      promotion['isGlobal'],
      promotion['allEvents']
    );
    const scope: PromotionScope = appliesToAllEvents === false || eventIds.length > 0 ? 'EVENTS' : 'GLOBAL';

    return {
      id: this.getNumber(promotion['id']) ?? 0,
      name: this.getString(promotion['name'], promotion['titre']) ?? 'Promotion',
      code: this.getString(promotion['code'], promotion['promoCode']) ?? undefined,
      description: this.getString(promotion['description']),
      discountType: (this.getString(promotion['discountType']) as PromotionOfferResponseDTO['discountType']) ?? 'PERCENTAGE',
      discountValue: this.getNumber(promotion['discountValue'], promotion['value']) ?? 0,
      minimumSubtotal: this.getNumber(promotion['minimumSubtotal']),
      minimumParticipants: this.getNumber(promotion['minimumParticipants']),
      autoApply: this.getBoolean(promotion['autoApply'], promotion['automatic']) ?? false,
      discoverable: this.getBoolean(promotion['discoverable'], promotion['visible']) ?? false,
      active: this.getBoolean(promotion['active']) ?? false,
      currentlyAvailable: this.getBoolean(
        promotion['currentlyAvailable'],
        promotion['availableNow'],
        promotion['active']
      ) ?? false,
      maxRedemptions: this.getNumber(promotion['maxRedemptions']),
      usageCount: this.getNumber(promotion['usageCount']),
      remainingRedemptions: this.getNumber(promotion['remainingRedemptions']),
      startsAt: this.getString(promotion['startsAt'], promotion['startDate']),
      endsAt: this.getString(promotion['endsAt'], promotion['endDate']),
      dateCreation: this.getString(promotion['dateCreation'], promotion['createdAt']),
      dateModification: this.getString(promotion['dateModification'], promotion['updatedAt']),
      appliesToAllEvents: appliesToAllEvents ?? eventIds.length === 0,
      scope,
      eventIds,
      targetedEvents
    };
  }

  private serializePromotionRequest(promotion: PromotionOfferRequestDTO): Record<string, unknown> {
    const sanitizedEventIds = Array.from(
      new Set(
        (promotion.eventIds ?? [])
          .map((eventId) => Number(eventId))
          .filter((eventId) => Number.isFinite(eventId) && eventId > 0)
      )
    );
    const appliesToAllEvents = promotion.appliesToAllEvents !== false;

    return {
      name: promotion.name.trim(),
      code: promotion.code?.trim().toUpperCase() || undefined,
      description: promotion.description?.trim() || undefined,
      discountType: promotion.discountType,
      discountValue: Number(promotion.discountValue),
      minimumSubtotal: this.toOptionalNumber(promotion.minimumSubtotal),
      minimumParticipants: this.toOptionalNumber(promotion.minimumParticipants),
      autoApply: promotion.autoApply,
      discoverable: promotion.discoverable,
      active: promotion.active,
      maxRedemptions: this.toOptionalNumber(promotion.maxRedemptions),
      startsAt: promotion.startsAt || undefined,
      endsAt: promotion.endsAt || undefined,
      appliesToAllEvents,
      scope: appliesToAllEvents ? 'GLOBAL' : 'EVENTS',
      eventIds: appliesToAllEvents ? [] : sanitizedEventIds,
      global: appliesToAllEvents,
      targetEventIds: appliesToAllEvents ? [] : sanitizedEventIds,
      applicableEventIds: appliesToAllEvents ? [] : sanitizedEventIds
    };
  }

  private normalizeTargetedEvents(value: unknown): PromotionTargetEventSummaryDTO[] {
    return this.extractArray(value).reduce<PromotionTargetEventSummaryDTO[]>((targetEvents, item) => {
      if (typeof item !== 'object' || item === null) {
        return targetEvents;
      }

      const event = item as Record<string, unknown>;
      const id = this.getNumber(event['id']);
      const titre = this.getString(event['titre'], event['title']);
      if (!id || !titre) {
        return targetEvents;
      }

      targetEvents.push({
        id,
        titre,
        dateDebut: this.getString(event['dateDebut'], event['startsAt']) ?? undefined,
        dateFin: this.getString(event['dateFin'], event['endsAt']) ?? undefined,
        lieu: this.getString(event['lieu'], event['location']) ?? undefined
      });

      return targetEvents;
    }, []);
  }

  private extractEventIds(value: unknown): number[] {
    const sourceArray = Array.isArray(value) ? value : [];
    const ids = sourceArray
      .map((item) => {
        if (typeof item === 'number') {
          return item;
        }

        if (typeof item === 'string') {
          return Number(item);
        }

        if (typeof item === 'object' && item !== null) {
          return this.getNumber((item as Record<string, unknown>)['id']);
        }

        return undefined;
      })
      .filter((eventId): eventId is number => Number.isFinite(eventId) && Number(eventId) > 0);

    return Array.from(new Set(ids));
  }

  private extractArray(value: unknown): unknown[] {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      const content = (value as { content?: unknown }).content;
      if (Array.isArray(content)) {
        return content;
      }
    }

    return [];
  }

  private getString(...values: unknown[]): string | undefined {
    const match = values.find((value) => typeof value === 'string' && value.trim().length > 0);
    return typeof match === 'string' ? match.trim() : undefined;
  }

  private getNumber(...values: unknown[]): number | undefined {
    for (const value of values) {
      const numericValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
      if (Number.isFinite(numericValue)) {
        return numericValue;
      }
    }

    return undefined;
  }

  private getBoolean(...values: unknown[]): boolean | undefined {
    for (const value of values) {
      if (typeof value === 'boolean') {
        return value;
      }

      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') {
          return true;
        }
        if (value.toLowerCase() === 'false') {
          return false;
        }
      }
    }

    return undefined;
  }

  private toOptionalNumber(value: number | undefined): number | undefined {
    return Number.isFinite(value) ? Number(value) : undefined;
  }
}
