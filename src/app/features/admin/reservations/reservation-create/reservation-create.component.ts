import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminUserService } from '../../../../core/services/admin-user.service';
import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { AdminUser } from '../../users/models/user.model';
import { Event, ReservationRequestDTO } from '../../../public/events/models/event.model';
import { EventService } from '../../../public/events/services/event.service';

@Component({
  selector: 'app-reservation-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminIconComponent],
  templateUrl: './reservation-create.component.html',
  styleUrl: './reservation-create.component.css'
})
export class ReservationCreateComponent implements OnInit {
  private readonly fieldLabels: Record<string, string> = {
    utilisateurId: 'User',
    eventId: 'Event',
    nombreParticipants: 'Participants',
    remarques: 'Remarks'
  };

  reservationForm: FormGroup;
  users: AdminUser[] = [];
  events: Event[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private adminUserService: AdminUserService,
    private eventService: EventService,
    private router: Router
  ) {
    this.reservationForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadReferenceData();
  }

  createForm(): FormGroup {
    return this.fb.group({
      utilisateurId: ['', Validators.required],
      eventId: ['', Validators.required],
      nombreParticipants: [1, [Validators.required, Validators.min(1), Validators.max(100), Validators.pattern(/^\d+$/)]],
      remarques: ['', [Validators.maxLength(500)]]
    });
  }

  loadReferenceData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      users: this.adminUserService.getAllUsers(),
      events: this.eventService.getAllEvents()
    }).subscribe({
      next: ({ users, events }) => {
        this.users = [...users].sort((a, b) => a.nom.localeCompare(b.nom));
        this.events = [...events].sort((a, b) =>
          new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()
        );
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = this.extractErrorMessage(error) || 'Failed to load reservation form data.';
        console.error('Error loading reservation reference data:', error);
      }
    });
  }

  submitForm(): void {
    if (!this.reservationForm.valid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.buildPayload();
    this.eventService.createReservation(payload).subscribe({
      next: () => {
        this.successMessage = 'Reservation created successfully!';
        this.isSubmitting = false;
        setTimeout(() => {
          this.router.navigate(['/admin/reservations']);
        }, 1200);
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.errorMessage = this.extractErrorMessage(error) || 'Failed to create reservation.';
        console.error('Error creating reservation:', error);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/reservations']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.reservationForm.get(fieldName);
    if (!control || !control.errors) {
      return '';
    }

    const label = this.fieldLabels[fieldName] || fieldName;

    if (control.errors['required']) return `${label} is required.`;
    if (control.errors['min']) return `${label} must be at least 1.`;
    if (control.errors['max']) return `${label} must not exceed 100.`;
    if (control.errors['maxlength']) return `${label} must not exceed 500 characters.`;
    if (control.errors['pattern']) return `${label} format is invalid.`;

    return 'Invalid field';
  }

  get selectedEvent(): Event | null {
    const eventId = Number(this.reservationForm.get('eventId')?.value);
    return this.events.find((event) => event.id === eventId) || null;
  }

  get selectedUser(): AdminUser | null {
    const userId = Number(this.reservationForm.get('utilisateurId')?.value);
    return this.users.find((user) => user.id === userId) || null;
  }

  get estimatedTotal(): number {
    const selectedEvent = this.selectedEvent;
    const participants = Number(this.reservationForm.get('nombreParticipants')?.value || 0);
    if (!selectedEvent || !participants) {
      return 0;
    }

    return Number(selectedEvent.prix || 0) * participants;
  }

  get availableSeats(): number {
    const selectedEvent = this.selectedEvent;
    if (!selectedEvent) {
      return 0;
    }

    return selectedEvent.availableSeats ?? Math.max(0, selectedEvent.capaciteMax - (selectedEvent.participantsCount || 0));
  }

  get willBeWaitlisted(): boolean {
    const participants = Number(this.reservationForm.get('nombreParticipants')?.value || 0);
    return !!this.selectedEvent && participants > this.availableSeats;
  }

  get remarksLength(): number {
    return String(this.reservationForm.get('remarques')?.value || '').length;
  }

  formatStatusLabel(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return value
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private buildPayload(): ReservationRequestDTO {
    const remarks = String(this.reservationForm.value.remarques || '').trim();

    return {
      utilisateurId: Number(this.reservationForm.value.utilisateurId),
      eventId: Number(this.reservationForm.value.eventId),
      nombreParticipants: Number(this.reservationForm.value.nombreParticipants),
      remarques: remarks || undefined
    };
  }

  private extractErrorMessage(error: any): string | null {
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

    return null;
  }
}
