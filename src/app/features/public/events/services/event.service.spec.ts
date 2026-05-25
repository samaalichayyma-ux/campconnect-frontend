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
    expect(service.resolveImageUrl('/api/events/images/7/content'))
      .toBe('http://localhost:8082/api/events/images/7/content');
    expect(service.resolveImageUrl('events/images/7/content'))
      .toBe('http://localhost:8082/api/events/images/7/content');
    expect(service.resolveImageUrl('https://cdn.example.com/event.jpg'))
      .toBe('https://cdn.example.com/event.jpg');
    expect(service.resolveImageUrl('data:image/png;base64,abc'))
      .toBe('data:image/png;base64,abc');
    expect(service.resolveImageUrl('   '))
      .toBe('');
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
