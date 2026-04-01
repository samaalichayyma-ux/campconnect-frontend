# 🚀 Events & Reservations API Integration - Quick Start Guide

Your CampConnect frontend is now fully integrated with the backend API endpoints for Events and Reservations!

## What Was Set Up

### 1. **Enhanced EventService** (`src/app/features/public/events/services/event.service.ts`)
   - **22 Event Methods** - All endpoints from `/api/events`
   - **23 Reservation Methods** - All endpoints from `/api/reservations`
   - Full CRUD operations for both events and reservations
   - Analytics endpoints (revenue, participant counts, etc.)
   - Advanced query methods (by category, date range, location, status)

### 2. **API Demo Component** 
   - **Location**: `src/app/features/admin/events/api-demo/api-demo.component.ts`
   - **Route**: `/admin/events/api-demo`
   - Interactive testing interface for all endpoints
   - Live preview of loaded data
   - Real-time results display

### 3. **Comprehensive Documentation**
   - **Location**: `src/app/features/admin/events/API-REFERENCE.md`
   - Complete endpoint reference with examples
   - Usage patterns and best practices
   - Error handling guidelines

## 🎯 How to Use

### Access the API Demo
1. Navigate to: **`http://localhost:4200/admin/events/api-demo`**
2. You'll see an interactive dashboard with:
   - **Left Panel**: API endpoint buttons and input controls
   - **Right Panel**: Live results display
   - **Bottom Section**: Live preview of loaded data

### Test Events API
```typescript
// In any component
constructor(private eventService: EventService) {}

// Get all events
this.eventService.getAllEvents().subscribe(events => {
  console.log('Events:', events);
});

// Get event by ID
this.eventService.getEventById(1).subscribe(event => {
  console.log('Event:', event);
});

// Create new event
const newEvent: Event = {
  title: 'Camping Adventure',
  description: 'A fun camping trip',
  date: '2026-04-15',
  startTime: '09:00',
  endTime: '17:00',
  location: 'Mountain Valley',
  capacity: 50,
  category: 'Outdoor',
  price: 99.99
};
this.eventService.createEvent(newEvent).subscribe(created => {
  console.log('Created:', created);
});
```

### Test Reservations API
```typescript
// Get user reservations
this.eventService.getUserReservations(123).subscribe(reservations => {
  console.log('User reservations:', reservations);
});

// Create reservation
const reservation: EventReservation = {
  eventId: 1,
  userId: 123,
  numberOfParticipants: 3,
  reservationDate: new Date().toISOString(),
  status: 'CONFIRMED'
};
this.eventService.createReservation(reservation).subscribe(created => {
  console.log('Reservation created:', created);
});

// Get event reservations
this.eventService.getEventReservations(1).subscribe(reservations => {
  console.log('Event reservations:', reservations);
});
```

## 📚 Available Events Methods

### GET Methods
- `getAllEvents()` - Get all events
- `getEventById(id)` - Get event by ID
- `getUpcomingEvents()` - Get upcoming events
- `getAvailableEvents()` - Get events with available seats
- `getEventsByCategory(category)` - Filter by category
- `getEventsByStatus(status)` - Filter by status
- `getEventsByOrganizer(organizerId)` - Filter by organizer
- `getEventsByLocation(location)` - Filter by location
- `getEventsByDateRange(startDate, endDate)` - Filter by date range
- `getAvailableSeats(eventId)` - Get available seats count
- `getParticipantCount(eventId)` - Get participant count
- `getWaitlistCount(eventId)` - Get waitlist count
- `getEventRevenue(eventId)` - Get event revenue
- `searchEvents(query)` - Search events

### POST Methods
- `createEvent(event)` - Create new event

### PUT Methods
- `updateEvent(id, event)` - Update event
- `startEvent(id)` - Start event
- `postponeEvent(id, newDate)` - Postpone event
- `completeEvent(id)` - Complete event
- `cancelEvent(id)` - Cancel event

### DELETE Methods
- `deleteEvent(id)` - Delete event

## 📝 Available Reservations Methods

### GET Methods
- `getAllReservations()` - Get all reservations
- `getReservationById(id)` - Get reservation by ID
- `getUserReservations(userId)` - Get user's reservations
- `getEventReservations(eventId)` - Get event's reservations
- `getUserCancelledReservations(userId)` - Get cancelled reservations
- `getPendingReservations()` - Get pending reservations
- `getUnpaidReservations()` - Get unpaid reservations
- `getRefundableReservations()` - Get refundable reservations
- `getEventWaitlist(eventId)` - Get event waitlist
- `isUserOnWaitlist(userId, eventId)` - Check waitlist status
- `calculateReservationPrice(eventId, participants)` - Calculate price
- `getConfirmedReservationsCount(eventId)` - Get confirmed count
- `getReservationRevenue(eventId)` - Get revenue

### POST Methods
- `createReservation(reservation)` - Create new reservation
- `refundReservation(id)` - Refund reservation
- `processPayment(paymentData)` - Process payment

### PUT Methods
- `updateReservation(id, reservation)` - Update reservation
- `confirmReservation(id)` - Confirm reservation
- `rejectReservation(id)` - Reject reservation
- `markAsNoShow(id)` - Mark as no-show
- `processWaitlist(eventId)` - Process waitlist

### DELETE Methods
- `cancelReservation(id)` - Cancel reservation

## 🔗 Integration Points

### Already Using the API:
1. **Event List Component** (`event-list.component.ts`)
   - Loads all events using `getAllEvents()`
   - Delete events with `deleteEvent()`

2. **Event Edit Component** (`event-edit.component.ts`)
   - Load event with `getEventById()`
   - Update with `updateEvent()`

3. **Event Details Component** (`event-details.component.ts`)
   - Display event info with `getEventById()`
   - Create reservations with `createReservation()`

4. **Public Events List** (`events-list.component.ts`)
   - Load all events with `getAllEvents()`
   - Filter by category with `getEventsByCategory()`

## 🧪 Testing Steps

1. **Start Backend** (ensure it's running on http://localhost:8080)
   - Verify Swagger UI at: http://localhost:8080/api/swagger-ui/index.html

2. **Start Frontend**
   - `npm start` (already running)
   - Frontend available at: http://localhost:4200

3. **Access Components**
   - **Admin Events**: http://localhost:4200/admin/events
   - **Admin API Demo**: http://localhost:4200/admin/events/api-demo
   - **Public Events**: http://localhost:4200/public/events

4. **Test the API Demo**
   - Go to `/admin/events/api-demo`
   - Click different endpoint buttons to see live results
   - Use the input fields to customize queries

## ⚙️ Configuration

### Backend URL
- Default: `http://localhost:8080/api`
- Located in: `EventService` constructor
- Change if needed in: `src/app/features/public/events/services/event.service.ts`

### Models
- **Event Interface**: `src/app/features/public/events/models/event.model.ts`
- **EventReservation Interface**: Same file
- Update these if backend schema changes

## 🐛 Troubleshooting

### CORS Issues
If you see CORS errors, ensure your backend has CORS enabled for `http://localhost:4200`

### 404 Errors
- Verify backend is running on http://localhost:8080
- Check API endpoint paths in EventService
- Review backend Swagger documentation

### No Data Loading
- Open browser DevTools (F12)
- Check Network tab for API calls
- Check Console for error messages
- Verify user authentication if needed

## 📖 For Full Documentation
See: `src/app/features/admin/events/API-REFERENCE.md`

This file contains:
- Complete endpoint reference
- Data model schemas
- Usage examples
- Error handling patterns

---

**You're all set!** 🎉 Your Events and Reservations API is fully integrated and ready to use across your CampConnect application.
