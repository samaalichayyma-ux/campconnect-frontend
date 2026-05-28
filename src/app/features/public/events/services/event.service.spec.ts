import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { EventService } from './event.service';
import { EventResponseDTO } from '../models/event.model';

describe('EventService event and reservation helpers', () => {
  let service: EventService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(EventService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('resolves backend image paths without changing absolute or data URLs', () => {
    expect(service.resolveImageUrl(null)).toBe('');
    expect(service.resolveImageUrl('/api/events/images/7/content'))
      .toBe('http://localhost:8082/api/events/images/7/content');
    expect(service.resolveImageUrl('api/events/images/7/content'))
      .toBe('http://localhost:8082/api/events/images/7/content');
    expect(service.resolveImageUrl('/events/images/7/content'))
      .toBe('http://localhost:8082/api/events/images/7/content');
    expect(service.resolveImageUrl('events/images/7/content'))
      .toBe('http://localhost:8082/api/events/images/7/content');
    expect(service.resolveImageUrl('uploads\\events\\banner.jpg'))
      .toBe('uploads/events/banner.jpg');
    expect(service.resolveImageUrl('https://cdn.example.com/event.jpg'))
      .toBe('https://cdn.example.com/event.jpg');
    expect(service.resolveImageUrl('data:image/png;base64,abc'))
      .toBe('data:image/png;base64,abc');
    expect(service.resolveImageUrl('   '))
      .toBe('');
  });

  it('chooses the best primary image fallback for event cards', () => {
    expect(service.getEventPrimaryImageUrl(null, 'fallback.jpg')).toBe('fallback.jpg');
    expect(service.getEventPrimaryImageUrl({
      images: [
        { imageUrl: '/api/events/images/1/content', isPrimary: false },
        { imageUrl: '/api/events/images/2/content', isPrimary: true }
      ]
    } as Partial<EventResponseDTO>, 'fallback.jpg')).toBe('http://localhost:8082/api/events/images/2/content');

    expect(service.getEventPrimaryImageUrl({
      galleryImages: 'legacy-banner.jpg'
    } as Partial<EventResponseDTO>, 'fallback.jpg')).toBe('legacy-banner.jpg');
  });

  it('builds a unique gallery from modern, metadata, and legacy image fields', () => {
    const event = {
      galleryImageUrls: ['/api/events/images/1/content', '/api/events/images/1/content'],
      primaryImageUrl: 'events/images/2/content',
      thumbnailImage: 'thumbnail.jpg',
      bannerImage: 'banner.jpg',
      galleryImages: '["legacy-a.jpg", "legacy-b.jpg"]',
      images: [
        {
          imageUrl: '/events/images/3/content',
          isPrimary: true
        }
      ]
    } as Partial<EventResponseDTO>;

    expect(service.getEventGalleryImageUrls(event)).toEqual([
      'http://localhost:8082/api/events/images/1/content',
      'http://localhost:8082/api/events/images/3/content',
      'http://localhost:8082/api/events/images/2/content',
      'thumbnail.jpg',
      'banner.jpg',
      'legacy-a.jpg',
      'legacy-b.jpg'
    ]);
  });

  it('loads and normalizes public promotions for a specific event', () => {
    service.getPublicPromotions(42).subscribe((promotions) => {
      expect(promotions).toEqual([
        jasmine.objectContaining({
          id: 5,
          name: 'Summer',
          code: 'SUMMER25',
          discountType: 'PERCENTAGE',
          discountValue: 25,
          eventIds: [42],
          scope: 'EVENTS'
        })
      ]);
    });

    const request = httpMock.expectOne('http://localhost:8082/api/events/42/promotions/active');
    expect(request.request.method).toBe('GET');
    request.flush({
      content: [
        {
          id: '5',
          titre: 'Summer',
          promoCode: 'SUMMER25',
          discountType: 'PERCENTAGE',
          value: '25',
          targetEventIds: ['42'],
          active: 'true'
        }
      ]
    });
  });

  it('normalizes admin promotion payloads and serializes targeted event updates', () => {
    service.getAdminPromotions(42).subscribe((promotions) => {
      expect(promotions[0]).toEqual(jasmine.objectContaining({
        id: 8,
        name: 'Targeted Deal',
        eventIds: [42, 43],
        targetedEvents: jasmine.arrayContaining([
          jasmine.objectContaining({ id: 42, titre: 'Forest Camp' })
        ]),
        scope: 'EVENTS',
        currentlyAvailable: true
      }));
    });

    const listRequest = httpMock.expectOne((request) =>
      request.url === 'http://localhost:8082/api/promotions/admin'
      && request.params.get('eventId') === '42'
    );
    expect(listRequest.request.method).toBe('GET');
    listRequest.flush([
      {
        id: 8,
        name: 'Targeted Deal',
        discountType: 'FIXED_AMOUNT',
        discountValue: '15',
        applicableEvents: [
          { id: 42, title: 'Forest Camp' },
          { id: '43', titre: 'Kayak Camp' }
        ],
        appliesToAllEvents: false,
        availableNow: true
      }
    ]);

    service.updateAdminPromotion(8, {
      name: ' targeted deal ',
      code: ' camp15 ',
      discountType: 'FIXED_AMOUNT',
      discountValue: 15,
      autoApply: false,
      discoverable: true,
      active: true,
      appliesToAllEvents: false,
      eventIds: [42, 42, 43, 0, Number.NaN]
    }).subscribe((promotion) => {
      expect(promotion.code).toBe('CAMP15');
    });

    const updateRequest = httpMock.expectOne('http://localhost:8082/api/promotions/admin/8');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual(jasmine.objectContaining({
      name: 'targeted deal',
      code: 'CAMP15',
      scope: 'EVENTS',
      appliesToAllEvents: false,
      eventIds: [42, 43],
      targetEventIds: [42, 43]
    }));
    updateRequest.flush({
      id: 8,
      name: 'Targeted Deal',
      code: 'CAMP15',
      discountType: 'FIXED_AMOUNT',
      discountValue: 15,
      eventIds: [42, 43],
      appliesToAllEvents: false
    });
  });

  it('calls reservation action endpoints with optional reasons and report formats', () => {
    service.rejectReservation(12, ' duplicate booking ').subscribe();
    const rejectRequest = httpMock.expectOne((request) =>
      request.url === 'http://localhost:8082/api/reservations/rejectReservation/12'
      && request.params.get('reason') === ' duplicate booking '
    );
    expect(rejectRequest.request.method).toBe('PUT');
    rejectRequest.flush({ id: 12 });

    service.cancelReservation(12).subscribe();
    const cancelRequest = httpMock.expectOne('http://localhost:8082/api/reservations/cancelReservation/12');
    expect(cancelRequest.request.method).toBe('DELETE');
    expect(cancelRequest.request.params.has('reason')).toBeFalse();
    cancelRequest.flush(null);

    service.downloadGuestList(7, 'pdf').subscribe((blob) => {
      expect(blob instanceof Blob).toBeTrue();
    });
    const guestListRequest = httpMock.expectOne((request) =>
      request.url === 'http://localhost:8082/api/reservations/exports/guest-list/7'
      && request.params.get('format') === 'pdf'
    );
    expect(guestListRequest.request.method).toBe('GET');
    expect(guestListRequest.request.responseType).toBe('blob');
    guestListRequest.flush(new Blob(['guest list']));
  });

  it('loads notifications and marks them as read', () => {
    service.getMyNotifications().subscribe((notifications) => {
      expect(notifications[0].title).toBe('Event reminder');
    });
    httpMock.expectOne('http://localhost:8082/api/notifications/me').flush([
      { id: 1, title: 'Event reminder', read: false }
    ]);

    service.getMyUnreadNotificationCount().subscribe((response) => {
      expect(response.unreadCount).toBe(3);
    });
    httpMock.expectOne('http://localhost:8082/api/notifications/me/unread-count').flush({ unreadCount: 3 });

    service.markNotificationAsRead(1).subscribe((notification) => {
      expect(notification.read).toBeTrue();
    });
    const readRequest = httpMock.expectOne('http://localhost:8082/api/notifications/1/read');
    expect(readRequest.request.method).toBe('PUT');
    readRequest.flush({ id: 1, read: true });

    service.markAllNotificationsAsRead().subscribe();
    const readAllRequest = httpMock.expectOne('http://localhost:8082/api/notifications/me/read-all');
    expect(readAllRequest.request.method).toBe('PUT');
    readAllRequest.flush(null);
  });

  it('falls back from event promotion endpoint to global active promotions', () => {
    service.getEventPromotions(99).subscribe((promotions) => {
      expect(promotions[0].name).toBe('Global Deal');
      expect(promotions[0].scope).toBe('GLOBAL');
    });

    httpMock.expectOne('http://localhost:8082/api/events/99/promotions/active').flush({}, { status: 500, statusText: 'Server error' });
    httpMock.expectOne('http://localhost:8082/api/events/99/promotions').flush({}, { status: 404, statusText: 'Not found' });
    httpMock.expectOne('http://localhost:8082/api/events/promotions/active').flush([
      {
        id: 2,
        name: 'Global Deal',
        discountType: 'FIXED_AMOUNT',
        discountValue: 10,
        appliesToAllEvents: true,
        active: true
      }
    ]);
  });
});
