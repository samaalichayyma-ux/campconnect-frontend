import { TestBed } from '@angular/core/testing';

import { AppToastService } from '../../../../core/services/app-toast.service';
import { EventService } from '../../../public/events/services/event.service';
import { Event, ReservationResponseDTO } from '../../../public/events/models/event.model';
import { ReservationListComponent } from './reservation-list.component';

describe('ReservationListComponent reservation workflow helpers', () => {
  let component: ReservationListComponent;

  beforeEach(() => {
    const eventService = jasmine.createSpyObj<EventService>('EventService', ['getEventPrimaryImageUrl']);
    const toastService = jasmine.createSpyObj<AppToastService>('AppToastService', ['error', 'success', 'info', 'warning']);

    TestBed.configureTestingModule({
      providers: [
        { provide: EventService, useValue: eventService },
        { provide: AppToastService, useValue: toastService }
      ]
    });

    component = TestBed.runInInjectionContext(() => new ReservationListComponent(eventService));
  });

  it('formats reservation status labels and maps status classes', () => {
    expect(component.formatStatusLabel('NO_SHOW')).toBe('No Show');
    expect(component.formatStatusLabel(null)).toBe('-');
    expect(component.getStatusClass('PAID')).toBe('status-paid');
    expect(component.getPaymentStatusClass('PARTIALLY_REFUNDED')).toBe('payment-refunded');
  });

  it('guards reservation actions based on workflow state', () => {
    const pending = createReservation({ statut: 'PENDING' });
    const confirmed = createReservation({ statut: 'CONFIRMED' });
    const waitlisted = createReservation({ statut: 'PAID', estEnAttente: true });
    const cancelledPaid = createReservation({ statut: 'CANCELLED', statutPaiement: 'PAID' });

    expect(component.canConfirm(pending)).toBeTrue();
    expect(component.canMarkAttended(confirmed)).toBeTrue();
    expect(component.canMarkNoShow(waitlisted)).toBeFalse();
    expect(component.canRefund(cancelledPaid)).toBeTrue();
    expect(component.canCancel(cancelledPaid)).toBeFalse();
  });

  it('allows no-show only when the linked event is completed', () => {
    const reservation = createReservation({ statut: 'PAID', eventId: 7 });
    component.eventById.set(7, createEvent({ id: 7, statut: 'COMPLETED' }));

    expect(component.canMarkNoShow(reservation)).toBeTrue();

    component.eventById.set(7, createEvent({ id: 7, statut: 'ONGOING' }));

    expect(component.canMarkNoShow(reservation)).toBeFalse();
  });

  it('filters reservations by event, user, and workflow and updates pagination', () => {
    component.reservations = [
      createReservation({
        id: 1,
        eventTitre: 'Desert Camp',
        utilisateurNom: 'Iheb',
        statut: 'PENDING',
        statutPaiement: 'UNPAID'
      }),
      createReservation({
        id: 2,
        eventTitre: 'Forest Workshop',
        utilisateurNom: 'Molk',
        statut: 'PAID',
        statutPaiement: 'PAID'
      }),
      createReservation({
        id: 3,
        eventTitre: 'Desert Camp',
        utilisateurNom: 'Sara',
        statut: 'CANCELLED',
        statutPaiement: 'REFUNDED'
      })
    ];

    component.eventFilter = 'desert';
    component.workflowFilter = 'refunded';
    component.applyFilters();

    expect(component.filteredReservations.map((reservation) => reservation.id)).toEqual([3]);
    expect(component.paginatedReservations.map((reservation) => reservation.id)).toEqual([3]);
    expect(component.filteredCount).toBe(1);
    expect(component.hasActiveFilters()).toBeTrue();
  });
});

function createReservation(overrides: Partial<ReservationResponseDTO> = {}): ReservationResponseDTO {
  return {
    id: 1,
    utilisateurId: 10,
    utilisateurNom: 'Guest',
    utilisateurEmail: 'guest@example.com',
    eventId: 20,
    eventTitre: 'Camp Event',
    eventDateDebut: '2026-06-01T10:00:00',
    eventDateFin: '2026-06-01T12:00:00',
    eventLieu: 'Tunis',
    statut: 'PENDING',
    nombreParticipants: 1,
    prixTotal: 40,
    estEnAttente: false,
    statutPaiement: 'UNPAID',
    dateCreation: '2026-05-01T10:00:00',
    dateModification: '2026-05-01T10:00:00',
    ...overrides
  };
}

function createEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 1,
    titre: 'Camp Event',
    description: 'Outdoor event',
    categorie: 'CAMPING_ACTIVITY',
    statut: 'SCHEDULED',
    dateDebut: '2026-06-01T10:00:00',
    dateFin: '2026-06-01T12:00:00',
    lieu: 'Tunis',
    capaciteMax: 30,
    capaciteWaitlist: 5,
    prix: 40,
    dureeMinutes: 120,
    organizerId: 2,
    organizerNom: 'Organizer',
    organizerEmail: 'organizer@example.com',
    participantsCount: 0,
    waitlistCount: 0,
    availableSeats: 30,
    isFullyBooked: false,
    dateCreation: '2026-05-01T10:00:00',
    dateModification: '2026-05-01T10:00:00',
    ...overrides
  };
}
