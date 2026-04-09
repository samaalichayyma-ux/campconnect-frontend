import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastMessageHost } from '../../../../core/utils/toast-message-host';
import { EventService } from '../../../public/events/services/event.service';
import { Event, EventReservation } from '../../../public/events/models/event.model';

@Component({
  selector: 'app-api-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './api-demo.component.html',
  styleUrl: './api-demo.component.css'
})
export class ApiDemoComponent extends ToastMessageHost implements OnInit {
  events: Event[] = [];
  reservations: EventReservation[] = [];
  upcomingEvents: Event[] = [];
  availableEvents: Event[] = [];
  pendingReservations: EventReservation[] = [];

  loading = false;
  selectedEventId: number | null = null;
  selectedReservationId: number | null = null;
  selectedUserId: number = 1;
  selectedCategory: string = 'Workshop';
  searchQuery: string = '';
  participantCount: number = 1;
  selectedDateRange = { start: '', end: '' };

  results: any = null;
  resultType: string = '';
  constructor(private eventService: EventService) {
    super();
  }

  ngOnInit(): void {
    this.loadAllDemo();
  }

  loadAllDemo(): void {
    this.eventService.getAllEvents().subscribe({
      next: (data: Event[]) => {
        this.events = data;
        this.resultType = 'Events';
        this.results = data;
      },
      error: (err: any) => {
        this.handleError('Failed to load all events', err);
      }
    });

    this.eventService.getUpcomingEvents().subscribe({
      next: (data: Event[]) => {
        this.upcomingEvents = data;
      },
      error: (err: any) => console.error('Error loading upcoming events:', err)
    });

    this.eventService.getAvailableEvents().subscribe({
      next: (data: Event[]) => {
        this.availableEvents = data;
      },
      error: (err: any) => console.error('Error loading available events:', err)
    });

    this.eventService.getPendingReservations().subscribe({
      next: (data: EventReservation[]) => {
        this.pendingReservations = data;
      },
      error: (err: any) => console.error('Error loading pending reservations:', err)
    });
  }
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
        this.successMessage = 'Event loaded successfully.';
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get event', err)
    });
  }

  getByCategory(): void {
    this.loading = true;
    this.eventService.getEventsByCategory(this.selectedCategory).subscribe({
      next: (events: Event[]) => {
        this.results = events;
        this.resultType = `Events by Category: ${this.selectedCategory}`;
        this.successMessage = `Found ${events.length} events in ${this.selectedCategory}.`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get events by category', err)
    });
  }

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
        this.successMessage = `Found ${events.length} events.`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Search failed', err)
    });
  }

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
        this.successMessage = `Event has ${seats} available seats.`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get available seats', err)
    });
  }

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
        this.successMessage = `Event has ${count} participants.`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get participant count', err)
    });
  }

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
        this.successMessage = `Total revenue: $${this.formatPrice(revenue)}.`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get event revenue', err)
    });
  }

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
        this.successMessage = `Found ${events.length} events.`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get events by date range', err)
    });
  }

  loadUpcomingEvents(): void {
    this.eventService.getUpcomingEvents().subscribe({
      next: (data: Event[]) => {
        this.results = data;
        this.resultType = 'Upcoming Events';
        this.successMessage = 'Loaded upcoming events.';
      },
      error: (err: any) => this.handleError('Failed to load upcoming events', err)
    });
  }

  loadAvailableEvents(): void {
    this.eventService.getAvailableEvents().subscribe({
      next: (data: Event[]) => {
        this.results = data;
        this.resultType = 'Available Events';
        this.successMessage = 'Loaded available events.';
      },
      error: (err: any) => this.handleError('Failed to load available events', err)
    });
  }

  loadUnpaidReservations(): void {
    this.eventService.getUnpaidReservations().subscribe({
      next: (data: EventReservation[]) => {
        this.results = data;
        this.resultType = 'Unpaid Reservations';
        this.successMessage = 'Loaded unpaid reservations.';
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
        this.successMessage = 'Loaded waitlist count.';
      },
      error: (err: any) => this.handleError('Failed to load waitlist count', err)
    });
  }

  getAllReservationsDemo(): void {
    this.loading = true;
    this.eventService.getAllReservations().subscribe({
      next: (reservations: EventReservation[]) => {
        this.results = reservations;
        this.resultType = 'All Reservations';
        this.successMessage = `Found ${reservations.length} reservations.`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get all reservations', err)
    });
  }

  getUserReservationsDemo(): void {
    this.loading = true;
    this.eventService.getUserReservations(this.selectedUserId).subscribe({
      next: (reservations: EventReservation[]) => {
        this.results = reservations;
        this.resultType = `User ${this.selectedUserId} Reservations`;
        this.successMessage = `User has ${reservations.length} reservations.`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get user reservations', err)
    });
  }

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
        this.successMessage = `Event has ${reservations.length} reservations.`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get event reservations', err)
    });
  }

  getPendingReservationsDemo(): void {
    this.loading = true;
    this.eventService.getPendingReservations().subscribe({
      next: (reservations: EventReservation[]) => {
        this.results = reservations;
        this.resultType = 'Pending Reservations';
        this.successMessage = `Found ${reservations.length} pending reservations.`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get pending reservations', err)
    });
  }

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
        this.successMessage = `Total price for ${this.participantCount} participant(s): $${this.formatPrice(price)}.`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to calculate price', err)
    });
  }

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
        this.successMessage = `User ${this.selectedUserId} ${message}.`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to check waitlist status', err)
    });
  }

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
        this.successMessage = `Event has ${count} confirmed reservations.`;
        this.loading = false;
      },
      error: (err: any) => this.handleError('Failed to get confirmed reservations count', err)
    });
  }

  clearResults(): void {
    this.results = null;
    this.resultType = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  handleError(message: string, error: any): void {
    this.errorMessage = message;
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

