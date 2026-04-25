import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { AuthService } from '../../../../core/services/auth.service';
import { EventResponseDTO } from '../models/event.model';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AdminIconComponent],
  templateUrl: './events-list.component.html',
  styleUrl: './events-list.component.css'
})
export class EventsListComponent implements OnInit, OnDestroy {
  readonly fallbackImageUrl = 'assets/images/default-image.jpg';
  private readonly successMessageDurationMs = 5 * 1000;

  allEvents: EventResponseDTO[] = [];
  filteredEvents: EventResponseDTO[] = [];
  paginatedEvents: EventResponseDTO[] = [];

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  noResultsMessage = '';
  showFavoritesOnly = false;

  searchQuery = '';
  selectedCategory = 'all';
  selectedStatus = 'all';
  selectedLocation = '';
  priceRange = { min: 0, max: 10000 };
  dateRange = { start: '', end: '' };

  categories = [
    { value: 'all', label: 'All Events' },
    { value: 'GUIDED_TOUR', label: 'Guided Tour' },
    { value: 'CAMPING_ACTIVITY', label: 'Camping Activity' },
    { value: 'WORKSHOP', label: 'Workshop' },
    { value: 'RESTORATION', label: 'Restoration' },
    { value: 'SOCIAL_EVENT', label: 'Social Event' },
    { value: 'ADVENTURE', label: 'Adventure' },
    { value: 'WELLNESS', label: 'Wellness' },
    { value: 'EDUCATIONAL', label: 'Educational' }
  ];

  statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'ONGOING', label: 'Ongoing' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  currentPage = 1;
  totalPages = 1;
  readonly gridPageSize = 6;
  readonly compactPageSize = 12;

  sortBy = 'recent';
  showFilters = false;
  isFilterSpotlightVisible = false;
  viewMode: 'grid' | 'list' = 'grid';
  isMobileView = false;
  favoriteEventIds = new Set<number>();
  favoriteActionEventIds = new Set<number>();
  private filterSpotlightTimeoutId: number | null = null;
  private successMessageTimeoutId: number | null = null;

  get pageSize(): number {
    return this.viewMode === 'list' ? this.compactPageSize : this.gridPageSize;
  }

  constructor(
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService
  ) {}

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkMobileView();
  }

  ngOnInit(): void {
    this.showFavoritesOnly = ['1', 'true'].includes(this.route.snapshot.queryParamMap.get('saved') ?? '');
    this.searchQuery = this.route.snapshot.queryParamMap.get('search') ?? '';
    this.checkMobileView();
    if (this.authService.isLoggedIn()) {
      this.loadFavoriteEvents();
    }
    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.clearSuccessMessageTimeout();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.noResultsMessage = '';

    this.eventService.getAllEvents().subscribe({
      next: (data) => {
        this.allEvents = data;
        if (this.searchQuery.trim()) {
          this.searchEvents();
          return;
        }
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load events. Please try again later.';
        console.error('Error loading events:', error);
        this.isLoading = false;
      }
    });
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  searchEvents(): void {
    if (!this.searchQuery.trim()) {
      this.loadEvents();
      return;
    }

    this.isLoading = true;
    this.eventService.searchEvents(this.searchQuery).subscribe({
      next: (data) => {
        this.allEvents = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Search failed. Please try again.';
        console.error('Error searching events:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allEvents];

    if (this.selectedCategory && this.selectedCategory !== 'all') {
      filtered = filtered.filter((event) => {
        const eventCategory = event.categorie?.toUpperCase() || '';
        const selectedCategory = this.selectedCategory?.toUpperCase() || '';
        return eventCategory === selectedCategory;
      });
    }

    if (this.selectedStatus && this.selectedStatus !== 'all') {
      filtered = filtered.filter((event) => {
        const eventStatus = event.statut?.toUpperCase() || '';
        const selectedStatus = this.selectedStatus?.toUpperCase() || '';
        return eventStatus === selectedStatus;
      });
    }

    if (this.selectedLocation.trim()) {
      filtered = filtered.filter((event) =>
        event.lieu?.toLowerCase().includes(this.selectedLocation.toLowerCase())
      );
    }

    filtered = filtered.filter((event) => {
      const price = event.prix || 0;
      return price >= this.priceRange.min && price <= this.priceRange.max;
    });

    if (this.dateRange.start) {
      const startDate = new Date(this.dateRange.start);
      filtered = filtered.filter((event) => new Date(event.dateDebut) >= startDate);
    }

    if (this.dateRange.end) {
      const endDate = new Date(this.dateRange.end);
      filtered = filtered.filter((event) => new Date(event.dateFin) <= endDate);
    }

    if (this.showFavoritesOnly) {
      filtered = filtered.filter((event) => this.favoriteEventIds.has(event.id));
    }

    this.sortEvents(filtered);

    this.filteredEvents = filtered;
    this.refreshPagination(true);

    if (filtered.length === 0) {
      if (this.showFavoritesOnly && this.favoriteEventIds.size === 0) {
        this.noResultsMessage = 'You have not saved any events yet.';
      } else if (this.showFavoritesOnly) {
        this.noResultsMessage = 'No saved events match your current filters.';
      } else {
        this.noResultsMessage = 'No events found matching your criteria.';
      }
      return;
    }

    this.noResultsMessage = '';
  }

  sortEvents(events: EventResponseDTO[]): void {
    switch (this.sortBy) {
      case 'price-low':
        events.sort((a, b) => a.prix - b.prix);
        break;
      case 'price-high':
        events.sort((a, b) => b.prix - a.prix);
        break;
      case 'date':
        events.sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
        break;
      case 'availability':
        events.sort((a, b) => b.availableSeats - a.availableSeats);
        break;
      case 'recent':
      default:
        events.sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
        break;
    }
  }

  updatePaginatedEvents(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedEvents = this.filteredEvents.slice(start, end);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedEvents();
      this.scrollToTop();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedEvents();
      this.scrollToTop();
    }
  }

  viewEventDetails(eventId: number): void {
    this.router.navigate(['/public/events', eventId], {
      queryParams: this.showFavoritesOnly ? { saved: '1' } : undefined
    });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.showFavoritesOnly = false;
    this.selectedCategory = 'all';
    this.selectedStatus = 'all';
    this.selectedLocation = '';
    this.priceRange = { min: 0, max: 10000 };
    this.dateRange = { start: '', end: '' };
    this.sortBy = 'recent';
    this.currentPage = 1;
    this.applyFilters();
  }

  toggleFavoritesOnly(): void {
    if (!this.authService.isLoggedIn()) {
      this.authService.setReturnUrl(this.router.url);
      this.router.navigate(['/login']);
      return;
    }

    this.showFavoritesOnly = !this.showFavoritesOnly;
    this.currentPage = 1;
    this.applyFilters();
  }

  isFavorite(eventId: number): boolean {
    return this.favoriteEventIds.has(eventId);
  }

  isFavoriteActionPending(eventId: number): boolean {
    return this.favoriteActionEventIds.has(eventId);
  }

  toggleFavorite(eventId: number, domEvent: globalThis.Event): void {
    domEvent.stopPropagation();

    if (!this.authService.isLoggedIn()) {
      this.authService.setReturnUrl(this.router.url);
      this.router.navigate(['/login']);
      return;
    }

    if (this.favoriteActionEventIds.has(eventId)) {
      return;
    }

    this.favoriteActionEventIds.add(eventId);
    const request$ = this.isFavorite(eventId)
      ? this.eventService.removeFavorite(eventId)
      : this.eventService.addFavorite(eventId);

    request$.subscribe({
      next: () => {
        if (this.favoriteEventIds.has(eventId)) {
          this.favoriteEventIds.delete(eventId);
          this.showSuccessMessage('Event removed from your saved list.');
        } else {
          this.favoriteEventIds.add(eventId);
          this.showSuccessMessage('Event saved to your favorites.');
        }

        this.favoriteActionEventIds.delete(eventId);
        this.applyFilters();
      },
      error: (error) => {
        this.favoriteActionEventIds.delete(eventId);
        this.errorMessage = 'Could not update favorites right now.';
        console.error('Error updating favorites:', error);
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
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

  getEventImageUrl(event: EventResponseDTO): string {
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
    const categoryOption = this.categories.find((item) => item.value === category);
    return categoryOption ? categoryOption.label : category;
  }

  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      all: 'star',
      GUIDED_TOUR: 'guides',
      CAMPING_ACTIVITY: 'tent',
      OUTDOOR: 'mountain',
      WORKSHOP: 'formations',
      RESTORATION: 'restaurants',
      SOCIAL_EVENT: 'users',
      WATER_SPORTS: 'waves',
      CULTURAL: 'palette',
      ADVENTURE: 'mountain',
      WELLNESS: 'leaf',
      SPORTS: 'users',
      EDUCATIONAL: 'formations',
      NIGHT_LIFE: 'music'
    };

    return iconMap[category] || 'events';
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      SCHEDULED: 'Scheduled',
      ONGOING: 'Ongoing',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled'
    };

    return statusMap[status] || status;
  }

  getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      SCHEDULED: 'calendar',
      ONGOING: 'clock',
      COMPLETED: 'check',
      CANCELLED: 'close'
    };

    return iconMap[status] || 'events';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'SCHEDULED':
        return 'status-scheduled';
      case 'ONGOING':
        return 'status-ongoing';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  getAvailabilityText(event: EventResponseDTO): string {
    if (event.isFullyBooked) {
      return event.waitlistCount > 0
        ? `Fully booked • ${event.waitlistCount} on the waitlist`
        : 'Fully booked';
    }

    if (event.isAlmostFull) {
      return `Almost full • ${event.availableSeats} spot${event.availableSeats === 1 ? '' : 's'} left`;
    }

    if (event.availableSeats <= 3) {
      return `Only ${event.availableSeats} seats left`;
    }

    return `${event.availableSeats} seats available`;
  }

  getUrgencyLabel(event: EventResponseDTO): string {
    if (event.isFullyBooked) {
      return 'Waitlist open';
    }

    if (event.isAlmostFull) {
      return 'Almost full';
    }

    return 'Seats available';
  }

  getUrgencyClass(event: EventResponseDTO): string {
    if (event.isFullyBooked) {
      return 'urgency-full';
    }

    if (event.isAlmostFull) {
      return 'urgency-almost';
    }

    return 'urgency-open';
  }

  hasWaitlistDemand(event: EventResponseDTO): boolean {
    return Number(event.waitlistCount || 0) > 0;
  }

  getWaitlistLabel(event: EventResponseDTO): string {
    const waitlistCount = Number(event.waitlistCount || 0);
    return `${waitlistCount} waiting`;
  }

  getAveragePrice(): string {
    if (this.filteredEvents.length === 0) {
      return '0';
    }

    const total = this.filteredEvents.reduce((sum, event) => sum + event.prix, 0);
    return (total / this.filteredEvents.length).toFixed(0);
  }

  toggleFilters(): void {
    if (!this.isMobileView) {
      this.showFilters = true;
      this.scrollFiltersIntoView();
      this.spotlightFilters();
      return;
    }

    this.showFilters = !this.showFilters;
  }

  closeFilters(): void {
    this.showFilters = false;
  }

  switchToGridView(): void {
    this.viewMode = 'grid';
    this.refreshPagination();
  }

  switchToListView(): void {
    this.viewMode = 'list';
    this.refreshPagination();
  }

  checkMobileView(): void {
    const previousViewMode = this.viewMode;
    this.isMobileView = window.innerWidth <= 480;
    if (this.isMobileView) {
      this.viewMode = 'list';
    }

    if (previousViewMode !== this.viewMode) {
      this.refreshPagination();
    }
  }

  private scrollToTop(): void {
    window.scrollTo(0, 0);
  }

  private scrollFiltersIntoView(): void {
    const filtersSidebar = document.getElementById('events-filters-panel');
    filtersSidebar?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private spotlightFilters(): void {
    this.isFilterSpotlightVisible = false;

    if (this.filterSpotlightTimeoutId) {
      window.clearTimeout(this.filterSpotlightTimeoutId);
    }

    window.setTimeout(() => {
      this.isFilterSpotlightVisible = true;
      this.filterSpotlightTimeoutId = window.setTimeout(() => {
        this.isFilterSpotlightVisible = false;
        this.filterSpotlightTimeoutId = null;
      }, 1600);
    }, 40);
  }

  private refreshPagination(resetToFirstPage = false): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredEvents.length / this.pageSize));
    this.currentPage = resetToFirstPage ? 1 : Math.min(this.currentPage, this.totalPages);
    this.updatePaginatedEvents();
  }

  private loadFavoriteEvents(): void {
    this.eventService.getFavoriteEvents().subscribe({
      next: (favorites) => {
        this.favoriteEventIds = new Set(favorites.map((event) => event.id));
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading favorite events:', error);
      }
    });
  }

  clearSuccessMessage(): void {
    this.successMessage = '';
    this.clearSuccessMessageTimeout();
  }

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.clearSuccessMessageTimeout();
    this.successMessageTimeoutId = window.setTimeout(() => {
      this.successMessage = '';
      this.successMessageTimeoutId = null;
    }, this.successMessageDurationMs);
  }

  private clearSuccessMessageTimeout(): void {
    if (this.successMessageTimeoutId !== null) {
      window.clearTimeout(this.successMessageTimeoutId);
      this.successMessageTimeoutId = null;
    }
  }
}
