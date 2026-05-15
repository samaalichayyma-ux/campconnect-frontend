# Events & Reservations API Reference

This document outlines all available API endpoints integrated with the CampConnect frontend.

## Base Configuration
- **Backend URL**: `http://localhost:8082/api`
- **Service**: `EventService` (`src/app/features/public/events/services/event.service.ts`)
- **Models**: `Event` and `EventReservation` interfaces

---

## EVENTS ENDPOINTS

### Read Operations (GET)

#### 1. Get All Events
```typescript
getAllEvents(): Observable<Event[]>
// GET /api/events/getAllEvents
// Returns: Array of all events
// Usage: this.eventService.getAllEvents().subscribe(events => { ... })
```

#### 2. Get Event by ID
```typescript
getEventById(id: number): Observable<Event>
// GET /api/events/getEvent/{id}
// Returns: Single event object
// Usage: this.eventService.getEventById(1).subscribe(event => { ... })
```

#### 3. Get Upcoming Events
```typescript
getUpcomingEvents(): Observable<Event[]>
// GET /api/events/getUpcoming
// Returns: Array of events that haven't started yet
// Usage: this.eventService.getUpcomingEvents().subscribe(events => { ... })
```

#### 4. Get Available Events
```typescript
getAvailableEvents(): Observable<Event[]>
// GET /api/events/available
// Returns: Array of events with available seats
// Usage: this.eventService.getAvailableEvents().subscribe(events => { ... })
```

#### 5. Get Events by Category
```typescript
getEventsByCategory(category: string): Observable<Event[]>
// GET /api/events/getByCategory/{categorie}
// Returns: All events matching the category
// Usage: this.eventService.getEventsByCategory('Workshop').subscribe(events => { ... })
```

#### 6. Get Events by Status
```typescript
getEventsByStatus(status: string): Observable<Event[]>
// GET /api/events/getByStatus/{statut}
// Returns: All events with the specified status
// Possible statuses: SCHEDULED, STARTED, POSTPONED, COMPLETED, CANCELLED
// Usage: this.eventService.getEventsByStatus('SCHEDULED').subscribe(events => { ... })
```

#### 7. Get Events by Organizer
```typescript
getEventsByOrganizer(organizerId: number): Observable<Event[]>
// GET /api/events/getByOrganizer/{organizerId}
// Returns: All events created by a specific organizer
// Usage: this.eventService.getEventsByOrganizer(123).subscribe(events => { ... })
```

#### 8. Get Events by Location
```typescript
getEventsByLocation(location: string): Observable<Event[]>
// GET /api/events/getByLocation?location={location}
// Returns: All events at a specific location
// Usage: this.eventService.getEventsByLocation('New York').subscribe(events => { ... })
```

#### 9. Get Events by Date Range
```typescript
getEventsByDateRange(startDate: string, endDate: string): Observable<Event[]>
// GET /api/events/getByDateRange?startDate={startDate}&endDate={endDate}
// Date format: ISO 8601 (YYYY-MM-DD)
// Returns: All events within the date range
// Usage: this.eventService.getEventsByDateRange('2026-03-24', '2026-04-24').subscribe(events => { ... })
```

#### 10. Get Available Seats for Event
```typescript
getAvailableSeats(eventId: number): Observable<number>
// GET /api/events/availableSeats/{id}
// Returns: Number of available seats
// Usage: this.eventService.getAvailableSeats(1).subscribe(seats => { ... })
```

#### 11. Get Participant Count
```typescript
getParticipantCount(eventId: number): Observable<number>
// GET /api/events/participants/{id}/count
// Returns: Total confirmed participants
// Usage: this.eventService.getParticipantCount(1).subscribe(count => { ... })
```

#### 12. Get Waitlist Count
```typescript
getWaitlistCount(eventId: number): Observable<number>
// GET /api/events/waitlist/{id}/count
// Returns: Number of people on waitlist
// Usage: this.eventService.getWaitlistCount(1).subscribe(count => { ... })
```

#### 13. Search Events
```typescript
searchEvents(query: string): Observable<Event[]>
// GET /api/events/search?q={query}
// Returns: Events matching the search query
// Usage: this.eventService.searchEvents('camping').subscribe(events => { ... })
```

### Analytics Endpoints (GET)

#### 14. Get Event Revenue
```typescript
getEventRevenue(eventId: number): Observable<number>
// GET /api/events/analytics/revenue/{id}
// Returns: Total revenue from event reservations
// Usage: this.eventService.getEventRevenue(1).subscribe(revenue => { ... })
```

#### 15. Get Organizer Total Participants
```typescript
getOrganizerTotalParticipants(organizerId: number): Observable<number>
// GET /api/events/analytics/organizer/{organizerId}/totalParticipants
// Returns: Total participants across all organizer's events
// Usage: this.eventService.getOrganizerTotalParticipants(123).subscribe(total => { ... })
```

### Write Operations (POST/PUT/DELETE)

#### 16. Create Event
```typescript
createEvent(event: Event): Observable<Event>
// POST /api/events/createEvent
// Body: Event object with fields (title, description, date, startTime, endTime, etc.)
// Returns: Created event with ID
// Usage:
const newEvent: Event = {
  title: 'Camping Trip',
  description: 'Fun camping adventure',
  date: '2026-04-15',
  startTime: '09:00',
  endTime: '17:00',
  location: 'Mountain Valley',
  capacity: 50,
  category: 'Outdoor',
  price: 99.99
};
this.eventService.createEvent(newEvent).subscribe(createdEvent => { ... })
```

#### 17. Update Event
```typescript
updateEvent(id: number, event: Event): Observable<Event>
// PUT /api/events/updateEvent/{id}
// Body: Event object with updated fields
// Returns: Updated event
// Usage: this.eventService.updateEvent(1, updatedEvent).subscribe(event => { ... })
```

#### 18. Start Event
```typescript
startEvent(id: number): Observable<void>
// PUT /api/events/startEvent/{id}
// Changes event status to STARTED
// Usage: this.eventService.startEvent(1).subscribe(() => { ... })
```

#### 19. Postpone Event
```typescript
postponeEvent(id: number, newDate: string): Observable<void>
// PUT /api/events/postponeEvent/{id}
// Body: { newDate: '2026-04-20' }
// Returns: void
// Usage: this.eventService.postponeEvent(1, '2026-04-20').subscribe(() => { ... })
```

#### 20. Complete Event
```typescript
completeEvent(id: number): Observable<void>
// PUT /api/events/completeEvent/{id}
// Changes event status to COMPLETED
// Usage: this.eventService.completeEvent(1).subscribe(() => { ... })
```

#### 21. Cancel Event
```typescript
cancelEvent(id: number): Observable<void>
// PUT /api/events/cancelEvent/{id}
// Changes event status to CANCELLED
// Usage: this.eventService.cancelEvent(1).subscribe(() => { ... })
```

#### 22. Delete Event
```typescript
deleteEvent(id: number): Observable<void>
// DELETE /api/events/deleteEvent/{id}
// Returns: void
// Usage: this.eventService.deleteEvent(1).subscribe(() => { ... })
```

---

## RESERVATIONS ENDPOINTS

### Read Operations (GET)

#### 1. Get All Reservations
```typescript
getAllReservations(): Observable<EventReservation[]>
// GET /api/reservations/getAllReservations
// Returns: Array of all reservations
// Usage: this.eventService.getAllReservations().subscribe(reservations => { ... })
```

#### 2. Get Reservation by ID
```typescript
getReservationById(id: number): Observable<EventReservation>
// GET /api/reservations/getReservation/{id}
// Returns: Single reservation object
// Usage: this.eventService.getReservationById(1).subscribe(res => { ... })
```

#### 3. Get User Reservations
```typescript
getUserReservations(userId: number): Observable<EventReservation[]>
// GET /api/reservations/getByUser/{userId}
// Returns: All reservations for a specific user
// Usage: this.eventService.getUserReservations(123).subscribe(reservations => { ... })
```

#### 4. Get Event Reservations
```typescript
getEventReservations(eventId: number): Observable<EventReservation[]>
// GET /api/reservations/getByEvent/{eventId}
// Returns: All reservations for a specific event
// Usage: this.eventService.getEventReservations(1).subscribe(reservations => { ... })
```

#### 5. Get User Cancelled Reservations
```typescript
getUserCancelledReservations(userId: number): Observable<EventReservation[]>
// GET /api/reservations/cancelled/{userId}
// Returns: All cancelled reservations for a user
// Usage: this.eventService.getUserCancelledReservations(123).subscribe(reservations => { ... })
```

#### 6. Get Pending Reservations
```typescript
getPendingReservations(): Observable<EventReservation[]>
// GET /api/reservations/pending
// Returns: All reservations with PENDING status
// Usage: this.eventService.getPendingReservations().subscribe(reservations => { ... })
```

#### 7. Get Unpaid Reservations
```typescript
getUnpaidReservations(): Observable<EventReservation[]>
// GET /api/reservations/unpaid
// Returns: All reservations that haven't been paid
// Usage: this.eventService.getUnpaidReservations().subscribe(reservations => { ... })
```

#### 8. Get Refundable Reservations
```typescript
getRefundableReservations(): Observable<EventReservation[]>
// GET /api/reservations/refundable
// Returns: All reservations that can be refunded
// Usage: this.eventService.getRefundableReservations().subscribe(reservations => { ... })
```

#### 9. Get Event Waitlist
```typescript
getEventWaitlist(eventId: number): Observable<EventReservation[]>
// GET /api/reservations/getWaitlist/{eventId}
// Returns: All reservations on the waitlist for an event
// Usage: this.eventService.getEventWaitlist(1).subscribe(waitlist => { ... })
```

#### 10. Check if User on Waitlist
```typescript
isUserOnWaitlist(userId: number, eventId: number): Observable<boolean>
// GET /api/reservations/isOnWaitlist/{userId}/{eventId}
// Returns: true/false
// Usage: this.eventService.isUserOnWaitlist(123, 1).subscribe(onWaitlist => { ... })
```

#### 11. Calculate Reservation Price
```typescript
calculateReservationPrice(eventId: number, numberOfParticipants: number): Observable<number>
// GET /api/reservations/calculatePrice/{eventId}?numberOfParticipants={count}
// Returns: Total price for the reservation
// Usage: this.eventService.calculateReservationPrice(1, 3).subscribe(price => { ... })
```

### Analytics Endpoints (GET)

#### 12. Get Confirmed Reservations Count
```typescript
getConfirmedReservationsCount(eventId: number): Observable<number>
// GET /api/reservations/analytics/confirmedCount/{eventId}
// Returns: Number of confirmed reservations
// Usage: this.eventService.getConfirmedReservationsCount(1).subscribe(count => { ... })
```

#### 13. Get Reservation Revenue
```typescript
getReservationRevenue(eventId: number): Observable<number>
// GET /api/reservations/analytics/revenue/{eventId}
// Returns: Total revenue from reservations
// Usage: this.eventService.getReservationRevenue(1).subscribe(revenue => { ... })
```

### Write Operations (POST/PUT/DELETE)

#### 14. Create Reservation
```typescript
createReservation(reservation: EventReservation): Observable<EventReservation>
// POST /api/reservations/createReservation
// Body: EventReservation object with fields
// Returns: Created reservation with ID
// Usage:
const reservation: EventReservation = {
  eventId: 1,
  userId: 123,
  numberOfParticipants: 3,
  reservationDate: new Date().toISOString(),
  status: 'CONFIRMED'
};
this.eventService.createReservation(reservation).subscribe(created => { ... })
```

#### 15. Update Reservation
```typescript
updateReservation(id: number, reservation: EventReservation): Observable<EventReservation>
// PUT /api/reservations/updateReservation/{id}
// Body: Updated reservation object
// Returns: Updated reservation
// Usage: this.eventService.updateReservation(1, updatedRes).subscribe(res => { ... })
```

#### 16. Confirm Reservation
```typescript
confirmReservation(id: number): Observable<void>
// PUT /api/reservations/confirmReservation/{id}
// Changes status to CONFIRMED
// Usage: this.eventService.confirmReservation(1).subscribe(() => { ... })
```

#### 17. Reject Reservation
```typescript
rejectReservation(id: number): Observable<void>
// PUT /api/reservations/rejectReservation/{id}
// Changes status to REJECTED
// Usage: this.eventService.rejectReservation(1).subscribe(() => { ... })
```

#### 18. Mark as No-Show
```typescript
markAsNoShow(id: number): Observable<void>
// PUT /api/reservations/markNoShow/{id}
// Changes status to NO_SHOW
// Usage: this.eventService.markAsNoShow(1).subscribe(() => { ... })
```

#### 19. Refund Reservation
```typescript
refundReservation(id: number): Observable<void>
// POST /api/reservations/refundReservation/{id}
// Processes refund for the reservation
// Usage: this.eventService.refundReservation(1).subscribe(() => { ... })
```

#### 20. Process Payment
```typescript
processPayment(paymentData: any): Observable<void>
// POST /api/reservations/processPayment
// Body: Payment information (varies by payment processor)
// Returns: void
// Usage: this.eventService.processPayment({...}).subscribe(() => { ... })
```

#### 21. Process Waitlist
```typescript
processWaitlist(eventId: number): Observable<void>
// PUT /api/reservations/processWaitlist/{eventId}
// Moves waitlisted reservations to confirmed if seats become available
// Usage: this.eventService.processWaitlist(1).subscribe(() => { ... })
```

#### 22. Cancel Reservation
```typescript
cancelReservation(id: number): Observable<void>
// DELETE /api/reservations/cancelReservation/{id}
// Changes status to CANCELLED
// Usage: this.eventService.cancelReservation(1).subscribe(() => { ... })
```

---

## Data Models

### Event Interface
```typescript
export interface Event {
  id?: number;
  title: string;
  description: string;
  date: string;                 // ISO 8601 format
  startTime: string;            // HH:mm format
  endTime: string;              // HH:mm format
  location: string;
  capacity: number;
  registeredCount?: number;
  category: string;
  imageUrl?: string;
  price: number;
  status?: string;              // SCHEDULED, STARTED, POSTPONED, COMPLETED, CANCELLED
  createdAt?: string;
  updatedAt?: string;
}
```

### EventReservation Interface
```typescript
export interface EventReservation {
  id?: number;
  eventId: number;
  userId: number;
  numberOfParticipants: number;
  reservationDate: string;      // ISO 8601 format
  status: string;               // PENDING, CONFIRMED, REJECTED, CANCELLED, NO_SHOW
  totalPrice?: number;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## Usage Examples

### Example 1: Load and Display All Events
```typescript
// In component.ts
ngOnInit() {
  this.eventService.getAllEvents().subscribe({
    next: (events) => {
      this.events = events;
    },
    error: (error) => {
      console.error('Failed to load events:', error);
    }
  });
}
```

### Example 2: Create a Reservation
```typescript
// In component.ts
makeReservation(eventId: number, userId: number, participants: number) {
  const reservation: EventReservation = {
    eventId,
    userId,
    numberOfParticipants: participants,
    reservationDate: new Date().toISOString(),
    status: 'CONFIRMED'
  };

  this.eventService.createReservation(reservation).subscribe({
    next: (createdReservation) => {
      console.log('Reservation created:', createdReservation);
    },
    error: (error) => {
      console.error('Failed to create reservation:', error);
    }
  });
}
```

### Example 3: Get User's Reservations with Event Details
```typescript
// In component.ts
loadUserReservations(userId: number) {
  this.eventService.getUserReservations(userId).subscribe({
    next: (reservations) => {
      // Load event details for each reservation
      reservations.forEach(res => {
        this.eventService.getEventById(res.eventId).subscribe(event => {
          // Combine event with reservation data
          this.displayReservationWithEvent(res, event);
        });
      });
    },
    error: (error) => {
      console.error('Failed to load user reservations:', error);
    }
  });
}
```

---

## Status Codes & Error Handling

The backend returns standard HTTP status codes:
- **200 OK**: Successful GET/PUT/DELETE
- **201 Created**: Successful POST
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not authorized
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

Always implement error handling in your subscriptions:
```typescript
this.eventService.getEventById(id).subscribe({
  next: (event) => { /* Handle success */ },
  error: (error) => { /* Handle error */ }
});
```
