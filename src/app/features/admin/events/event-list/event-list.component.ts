import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { Event } from '../../../public/events/models/event.model';
import { EventService } from '../../../public/events/services/event.service';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminIconComponent],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.css'
})
export class EventListComponent implements OnInit {
  readonly fallbackImageUrl = 'assets/images/default-image.jpg';
  events: Event[] = [];
  paginatedEvents: Event[] = [];
  isLoading = false;
  errorMessage = '';
  deleteConfirmId: number | null = null;
  currentPage = 1;
  pageSize = 8;
  totalPages = 1;

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.eventService.getAllEvents().subscribe({
      next: (data: Event[]) => {
        this.events = data.sort((a: Event, b: Event) =>
          new Date(b.dateCreation || 0).getTime() - new Date(a.dateCreation || 0).getTime()
        );
        this.updatePagination(true);
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load events.';
        this.isLoading = false;
        console.error('Error loading events:', error);
      }
    });
  }

  confirmDelete(id: number): void {
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  deleteEvent(id: number): void {
    this.eventService.deleteEvent(id).subscribe({
      next: () => {
        this.events = this.events.filter(e => e.id !== id);
        this.deleteConfirmId = null;
        this.updatePagination();
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to delete event.';
        console.error('Error deleting event:', error);
      }
    });
  }

  getAvailableSeats(event: Event): number {
    return Math.max(0, (event.capaciteMax || 0) - (event.participantsCount || 0));
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getEventImageUrl(event: Event): string {
    return this.eventService.getEventPrimaryImageUrl(event, this.fallbackImageUrl);
  }

  onImageError(event: globalThis.Event): void {
    const imageElement = event.target as HTMLImageElement | null;
    if (!imageElement || imageElement.dataset['fallbackApplied'] === 'true') {
      return;
    }

    imageElement.dataset['fallbackApplied'] = 'true';
    imageElement.src = this.fallbackImageUrl;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      GUIDED_TOUR: 'Guided Tour',
      CAMPING_ACTIVITY: 'Camping Activity',
      WORKSHOP: 'Workshop',
      WELLNESS: 'Wellness',
      RESTORATION: 'Restoration',
      SOCIAL_EVENT: 'Social Event',
      ADVENTURE: 'Adventure',
      EDUCATIONAL: 'Educational'
    };

    return labels[category] || category;
  }

  get paginationStart(): number {
    if (this.events.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.events.length);
  }

  get visiblePageNumbers(): number[] {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    startPage = Math.max(1, endPage - maxVisiblePages + 1);

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  }

  previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage--;
    this.updatePagination();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage++;
    this.updatePagination();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.updatePagination();
  }

  private updatePagination(resetPage = false): void {
    this.totalPages = Math.max(1, Math.ceil(this.events.length / this.pageSize));

    if (resetPage) {
      this.currentPage = 1;
    } else if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedEvents = this.events.slice(start, end);
  }
}
