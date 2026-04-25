import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../public/events/services/event.service';
import { Event, EventReservation } from '../../../public/events/models/event.model';

@Component({
  selector: 'app-api-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './api-demo.component.html',
  styleUrl: './api-demo.component.css'
})
export class ApiDemoComponent implements OnInit {
  // Sample data
  events: Event[] = [];
  reservations: EventReservation[] = [];
  upcomingEvents: Event[] = [];
  availableEvents: Event[] = [];
  pendingReservations: EventReservation[] = [];
  
  // UI Controls
  loading = false;
  selectedEventId: number | null = null;
  selectedReservationId: number | null = null;
  selectedUserId: number = 1;
  selectedCategory: string = 'Workshop';
  searchQuery: string = '';
  participantCount: number = 1;
  selectedDateRange = { start: '', end: '' };
  
  // Results display
  results: any = null;
  resultType: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.loadAllDemo();
  }

  // ========== DEMO: Load All Data ==========
  loadAllDemo(): void {
    console.log('ðŸš€ Starting loadAllDemo()...');
    
    // Load all events
    this.eventService.getAllEvents().subscribe({
      next: (data: Event[]) => {
        this.events = data;
        this.resultType = 'Events';
        this.results = data;
        console.log('âœ… All Events Loaded:', data);
        console.log('Total events:', data.length);
      },
      error: (err: any) => {
        console.error('âŒ Error loading events:', err);
        this.handleError('Failed to load all events', err);
      }
    });

    // Load upcoming events
    this.eventService.getUpcomingEvents().subscribe({
      next: (data: Event[]) => {
        this.upcomingEvents = data;
        console.log('âœ… Upcoming Events Loaded:', data);
      },
      error: (err: any) => console.error('Error loading upcoming events:', err)
    });

    // Load available events
    this.eventService.getAvailableEvents().subscribe({
      next: (data: Event[]) => {
        this.availableEvents = data;
        console.log('âœ… Available Events Loaded:', data);
      },
      error: (err: any) => console.error('Error loading available events:', err)
    });

    // Load pending reservations
    this.eventService.getPendingReservations().subscribe({
      next: (data: EventReservation[]) => {
        this.pendingReservations = data;
        console.log('âœ… Pending Reservations Loaded:', data);
      },
      error: (err: any) => console.error('Error loading pending reservations:', err)
    });
  }

  // ========== EVENTS API DEMOS ==========

  // Demo: Get Event by ID
  getEventDemo(): void {
    if (!this.selectedEventId) {
      this.errorMessage = 'Please select an event ID';
      return;
    }

    this.loading = true;
    this.eventService.getEventById(this.selectedEventId!).subscribe({
      next: (event: Event) => {
        this.results = event;
        this.resultType = 'Event Details';
        this.successMessage = 'âœ… Event loaded successfully!';
        this.loading = false;
        console.log('Event Details:', event);
      },
      error: (err: any) => this.handleError('Failed to get event', err)
    });
  }

  // Demo: Get Events by Category
  getByCategory(): void {
    this.loading = true;
    this.eventService.getEventsByCategory(this.selectedCategory).subscribe({
      next: (events: Event[]) => {
        this.results = events;
        this.resultType = `Events by Category: ${this.selectedCategory}`;
        this.successMessage = `âœ… Found ${events.length} events in ${this.selectedCategory}`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get events by category', err)
    });
  }

  // Demo: Search Events
  searchEvents(): void {
    if (!this.searchQuery.trim()) {
      this.errorMessage = 'Please enter a search query';
      return;
    }

    this.loading = true;
    this.eventService.searchEvents(this.searchQuery).subscribe({
      next: (events: Event[]) => {
        this.results = events;
        this.resultType = `Search Results: "${this.searchQuery}"`;
        this.successMessage = `âœ… Found ${events.length} events`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Search failed', err)
    });
  }

  // Demo: Get Available Seats
  getAvailableSeatsDemo(): void {
    if (!this.selectedEventId) {
      this.errorMessage = 'Please select an event ID';
      return;
    }

    this.loading = true;
    this.eventService.getAvailableSeats(this.selectedEventId!).subscribe({
      next: (seats: number) => {
        this.results = { availableSeats: seats };
        this.resultType = 'Available Seats';
        this.successMessage = `âœ… Event has ${seats} available seats`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get available seats', err)
    });
  }

  // Demo: Get Participant Count
  getParticipantCountDemo(): void {
    if (!this.selectedEventId) {
      this.errorMessage = 'Please select an event ID';
      return;
    }

    this.loading = true;
    this.eventService.getParticipantCount(this.selectedEventId!).subscribe({
      next: (count: number) => {
        this.results = { participantCount: count };
        this.resultType = 'Participant Count';
        this.successMessage = `âœ… Event has ${count} participants`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get participant count', err)
    });
  }

  // Demo: Get Event Revenue
  getEventRevenueDemo(): void {
    if (!this.selectedEventId) {
      this.errorMessage = 'Please select an event ID';
      return;
    }

    this.loading = true;
    this.eventService.getEventRevenue(this.selectedEventId!).subscribe({
      next: (revenue: number) => {
        this.results = { totalRevenue: revenue };
        this.resultType = 'Event Revenue';
        this.successMessage = `âœ… Total revenue: $${this.formatPrice(revenue)}`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get event revenue', err)
    });
  }

  // Demo: Get Event by Date Range
  getByDateRange(): void {
    if (!this.selectedDateRange.start || !this.selectedDateRange.end) {
      this.errorMessage = 'Please select both start and end dates';
      return;
    }

    this.loading = true;
    this.eventService.getEventsByDateRange(this.selectedDateRange.start, this.selectedDateRange.end).subscribe({
      next: (events: Event[]) => {
        this.results = events;
        this.resultType = `Events from ${this.selectedDateRange.start} to ${this.selectedDateRange.end}`;
        this.successMessage = `âœ… Found ${events.length} events`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get events by date range', err)
    });
  }

  // Simple demo methods for inline buttons
  loadUpcomingEvents(): void {
    this.eventService.getUpcomingEvents().subscribe({
      next: (data: Event[]) => {
        this.results = data;
        this.resultType = 'Upcoming Events';
        this.successMessage = 'âœ… Loaded upcoming events';
      },
      error: (err: any) => this.handleError('Failed to load upcoming events', err)
    });
  }

  loadAvailableEvents(): void {
    this.eventService.getAvailableEvents().subscribe({
      next: (data: Event[]) => {
        this.results = data;
        this.resultType = 'Available Events';
        this.successMessage = 'âœ… Loaded available events';
      },
      error: (err: any) => this.handleError('Failed to load available events', err)
    });
  }

  loadUnpaidReservations(): void {
    this.eventService.getUnpaidReservations().subscribe({
      next: (data: EventReservation[]) => {
        this.results = data;
        this.resultType = 'Unpaid Reservations';
        this.successMessage = 'âœ… Loaded unpaid reservations';
      },
      error: (err: any) => this.handleError('Failed to load unpaid reservations', err)
    });
  }

  loadWaitlistCount(): void {
    if (!this.selectedEventId) {
      this.errorMessage = 'Please select an event ID';
      return;
    }
    this.eventService.getWaitlistCount(this.selectedEventId).subscribe({
      next: (data: number) => {
        this.results = { waitlistCount: data };
        this.resultType = 'Waitlist Count';
        this.successMessage = 'âœ… Loaded waitlist count';
      },
      error: (err: any) => this.handleError('Failed to load waitlist count', err)
    });
  }

  // ========== HELPER METHODS ==========

  // Demo: Get All Reservations
  getAllReservationsDemo(): void {
    this.loading = true;
    this.eventService.getAllReservations().subscribe({
      next: (reservations: EventReservation[]) => {
        this.results = reservations;
        this.resultType = 'All Reservations';
        this.successMessage = `âœ… Found ${reservations.length} reservations`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get all reservations', err)
    });
  }

  // Demo: Get User Reservations
  getUserReservationsDemo(): void {
    this.loading = true;
    this.eventService.getUserReservations(this.selectedUserId).subscribe({
      next: (reservations: EventReservation[]) => {
        this.results = reservations;
        this.resultType = `User ${this.selectedUserId} Reservations`;
        this.successMessage = `âœ… User has ${reservations.length} reservations`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get user reservations', err)
    });
  }

  // Demo: Get Event Reservations
  getEventReservationsDemo(): void {
    if (!this.selectedEventId) {
      this.errorMessage = 'Please select an event ID';
      return;
    }

    this.loading = true;
    this.eventService.getEventReservations(this.selectedEventId!).subscribe({
      next: (reservations: EventReservation[]) => {
        this.results = reservations;
        this.resultType = `Reservations for Event ${this.selectedEventId}`;
        this.successMessage = `âœ… Event has ${reservations.length} reservations`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get event reservations', err)
    });
  }

  // Demo: Get Pending Reservations
  getPendingReservationsDemo(): void {
    this.loading = true;
    this.eventService.getPendingReservations().subscribe({
      next: (reservations: EventReservation[]) => {
        this.results = reservations;
        this.resultType = 'Pending Reservations';
        this.successMessage = `âœ… Found ${reservations.length} pending reservations`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get pending reservations', err)
    });
  }

  // Demo: Calculate Reservation Price
  calculatePriceDemo(): void {
    if (!this.selectedEventId) {
      this.errorMessage = 'Please select an event ID';
      return;
    }

    this.loading = true;
    this.eventService.calculateReservationPrice(this.selectedEventId!, this.participantCount).subscribe({
      next: (price: number) => {
        this.results = { totalPrice: price, participants: this.participantCount };
        this.resultType = 'Price Calculation';
        this.successMessage = `âœ… Total price for ${this.participantCount} participant(s): $${this.formatPrice(price)}`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to calculate price', err)
    });
  }

  // Demo: Check if User on Waitlist
  checkWaitlistDemo(): void {
    if (!this.selectedEventId) {
      this.errorMessage = 'Please select an event ID';
      return;
    }

    this.loading = true;
    this.eventService.isUserOnWaitlist(this.selectedUserId, this.selectedEventId!).subscribe({
      next: (onWaitlist: boolean) => {
        this.results = { isOnWaitlist: onWaitlist };
        this.resultType = 'Waitlist Status';
        const message = onWaitlist ? 'is on the waitlist' : 'is NOT on the waitlist';
        this.successMessage = `âœ… User ${this.selectedUserId} ${message}`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to check waitlist status', err)
    });
  }

  // Demo: Get Confirmed Reservations Count
  getConfirmedCountDemo(): void {
    if (!this.selectedEventId) {
      this.errorMessage = 'Please select an event ID';
      return;
    }

    this.loading = true;
    this.eventService.getConfirmedReservationsCount(this.selectedEventId!).subscribe({
      next: (count: number) => {
        this.results = { confirmedCount: count };
        this.resultType = 'Confirmed Reservations Count';
        this.successMessage = `âœ… Event has ${count} confirmed reservations`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get confirmed reservations count', err)
    });
  }

  // ========== HELPER METHODS ==========

  clearResults(): void {
    this.results = null;
    this.resultType = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  handleError(message: string, error: any): void {
    this.errorMessage = `âŒ ${message}`;
    this.loading = false;
    console.error(message, error);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(amount: number): string {
    return Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  getJsonString(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }
}

