import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { catchError, combineLatest, forkJoin, of } from 'rxjs';

import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { ToastMessageHost } from '../../../../core/utils/toast-message-host';
import { EventResponseDTO, ReservationResponseDTO } from '../../../public/events/models/event.model';
import { EventService } from '../../../public/events/services/event.service';

interface EventMetricCard {
  label: string;
  value: string;
  note: string;
  icon: string;
  toneClass: string;
}

interface EventStatusMixItem {
  label: string;
  count: number;
  share: number;
  toneClass: string;
}

interface EventTrendPoint {
  label: string;
  reservations: number;
  participants: number;
  revenue: number;
}

interface CategoryPerformanceRow {
  label: string;
  events: number;
  reservations: number;
  participants: number;
  revenue: number;
  occupancyRate: number;
}

interface EventLeaderboardRow {
  id: number;
  title: string;
  location: string;
  dateLabel: string;
  reservations: number;
  participants: number;
  revenue: number;
  occupancyRate: number;
  waitlistCount: number;
}

interface AttentionEventRow {
  id: number;
  title: string;
  note: string;
  severityClass: string;
}

interface LaunchBoardRow {
  id: number;
  title: string;
  dateLabel: string;
  revenue: number;
  occupancyRate: number;
  waitlistCount: number;
}

interface FeedbackEventRow {
  id: number;
  title: string;
  averageRating: number;
  responseRate: number;
  responses: number;
}

type DoughnutChartData = ChartData<'doughnut', number[], string>;
type BarChartData = ChartData<'bar', number[], string>;

@Component({
  selector: 'app-event-insights',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminIconComponent, BaseChartDirective],
  templateUrl: './event-insights.component.html',
  styleUrl: './event-insights.component.css'
})
export class EventInsightsComponent extends ToastMessageHost implements OnInit {
  readonly maxHorizontalChartRows = 5;

  isLoading = false;
  events: EventResponseDTO[] = [];
  reservations: ReservationResponseDTO[] = [];
  focusEventId: number | null = null;
  navigationSource: 'dashboard' | 'events' = 'dashboard';

  demandChartData: BarChartData = { labels: [], datasets: [] };
  statusMixChartData: DoughnutChartData = { labels: [], datasets: [] };
  categoryRevenueChartData: BarChartData = { labels: [], datasets: [] };
  leaderboardChartData: BarChartData = { labels: [], datasets: [] };
  feedbackMixChartData: DoughnutChartData = { labels: [], datasets: [] };
  downloadingGuestList = false;
  downloadingAttendanceSheet = false;

  readonly demandChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          color: '#64756d'
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64756d' }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(23, 49, 40, 0.08)' },
        ticks: {
          color: '#64756d',
          precision: 0
        }
      }
    }
  };

  readonly doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        display: false
      }
    }
  };

  readonly horizontalBarChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(23, 49, 40, 0.08)' },
        ticks: { color: '#64756d' }
      },
      y: {
        grid: { display: false },
        ticks: { color: '#42564c' }
      }
    }
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eventService: EventService
  ) {
    super();
  }

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, queryParams]) => {
      const routeId = Number(params.get('id'));
      const queryFocusId = Number(queryParams.get('focusEventId'));

      this.focusEventId = Number.isFinite(routeId) && routeId > 0
        ? routeId
        : (Number.isFinite(queryFocusId) && queryFocusId > 0 ? queryFocusId : null);

      this.navigationSource = queryParams.get('from') === 'events' ? 'events' : 'dashboard';
      this.loadDashboard();
    });
  }

  get backLink(): string {
    return '/admin/dashboard';
  }

  get backLabel(): string {
    return 'Back to Dashboard';
  }

  get contextLink(): string {
    return '/admin/events';
  }

  get contextLabel(): string {
    return this.navigationSource === 'events' ? 'Back to Events' : 'Manage Events';
  }

  get metricCards(): EventMetricCard[] {
    return [
      {
        label: 'Upcoming Events',
        value: String(this.upcomingEvents.length),
        note: `${this.publishedEvents.length} events are currently visible to guests`,
        icon: 'calendar',
        toneClass: 'forest'
      },
      {
        label: 'Paid Revenue',
        value: this.formatCurrency(this.totalRevenue),
        note: `${this.paidReservationsCount} bookings have completed payment`,
        icon: 'wallet',
        toneClass: 'ocean'
      },
      {
        label: 'Network Fill',
        value: `${this.formatPercent(this.overallOccupancyRate)}%`,
        note: `${this.totalParticipants} guests across ${this.totalCapacity} seats`,
        icon: 'users',
        toneClass: 'gold'
      },
      {
        label: 'Waitlist Guests',
        value: String(this.waitlistGuests),
        note: this.waitlistGuests > 0
          ? `${this.attentionEvents.length} launches need follow-up`
          : 'No waitlist pressure right now',
        icon: 'warning',
        toneClass: 'coral'
      }
    ];
  }

  get featuredEvent(): EventLeaderboardRow | null {
    if (this.leaderboardRows.length === 0) {
      return null;
    }

    if (this.focusEventId) {
      const focusedRow = this.leaderboardRows.find((row) => row.id === this.focusEventId);
      if (focusedRow) {
        return focusedRow;
      }
    }

    const nextUpcoming = this.upcomingEvents
      .map((event) => this.createLeaderboardRow(event))
      .filter((row): row is EventLeaderboardRow => row !== null)
      .sort((left, right) => this.parseDate(left.dateLabel) - this.parseDate(right.dateLabel))[0];

    return nextUpcoming || this.leaderboardRows[0];
  }

  get statusMix(): EventStatusMixItem[] {
    const total = Math.max(1, this.events.length);
    const statusLabels: Record<string, { label: string; toneClass: string }> = {
      SCHEDULED: { label: 'Scheduled', toneClass: 'forest' },
      ONGOING: { label: 'Ongoing', toneClass: 'ocean' },
      COMPLETED: { label: 'Completed', toneClass: 'slate' },
      POSTPONED: { label: 'Postponed', toneClass: 'gold' },
      CANCELLED: { label: 'Cancelled', toneClass: 'coral' }
    };

    return Object.entries(statusLabels)
      .map(([status, config]) => {
        const count = this.events.filter((event) => event.statut === status).length;
        return {
          label: config.label,
          count,
          share: (count / total) * 100,
          toneClass: config.toneClass
        };
      })
      .filter((item) => item.count > 0);
  }

  get trendPoints(): EventTrendPoint[] {
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);

    return Array.from({ length: 6 }, (_, index) => {
      const start = new Date(now);
      start.setMonth(now.getMonth() - (5 - index));
      const end = new Date(start);
      end.setMonth(start.getMonth() + 1);

      const monthReservations = this.reservations.filter((reservation) => {
        const createdAt = this.parseDate(reservation.dateCreation);
        return createdAt >= start.getTime() && createdAt < end.getTime();
      });

      return {
        label: start.toLocaleDateString('en-US', { month: 'short' }),
        reservations: monthReservations.length,
        participants: monthReservations.reduce(
          (sum, reservation) => sum + Number(reservation.nombreParticipants || 0),
          0
        ),
        revenue: monthReservations.reduce((sum, reservation) => sum + this.getReservationRevenue(reservation), 0)
      };
    });
  }

  get categoryRows(): CategoryPerformanceRow[] {
    const categoryMap = new Map<string, CategoryPerformanceRow>();

    this.events.forEach((event) => {
      const key = event.categorie;
      const existing = categoryMap.get(key) ?? {
        label: this.formatEnumLabel(key),
        events: 0,
        reservations: 0,
        participants: 0,
        revenue: 0,
        occupancyRate: 0
      };

      const eventReservations = this.getReservationsForEvent(event.id);
      existing.events += 1;
      existing.reservations += eventReservations.length;
      existing.participants += Number(event.participantsCount || 0);
      existing.revenue += eventReservations.reduce((sum, reservation) => sum + this.getReservationRevenue(reservation), 0);
      existing.occupancyRate += this.getEventOccupancyRate(event);
      categoryMap.set(key, existing);
    });

    return [...categoryMap.values()]
      .map((row) => ({
        ...row,
        occupancyRate: row.events ? row.occupancyRate / row.events : 0
      }))
      .sort((left, right) => right.revenue - left.revenue || right.participants - left.participants);
  }

  get leaderboardRows(): EventLeaderboardRow[] {
    return this.events
      .map((event) => this.createLeaderboardRow(event))
      .filter((row): row is EventLeaderboardRow => row !== null)
      .sort((left, right) =>
        right.revenue - left.revenue
        || right.participants - left.participants
        || right.reservations - left.reservations
      )
      .slice(0, 6);
  }

  get launchBoardRows(): LaunchBoardRow[] {
    return this.upcomingEvents
      .slice()
      .sort((left, right) => this.parseDate(left.dateDebut) - this.parseDate(right.dateDebut))
      .slice(0, 5)
      .map((event) => ({
        id: event.id,
        title: event.titre,
        dateLabel: event.dateDebut,
        revenue: this.getReservationsForEvent(event.id).reduce((sum, reservation) => sum + this.getReservationRevenue(reservation), 0),
        occupancyRate: this.getEventOccupancyRate(event),
        waitlistCount: Number(event.waitlistCount || 0)
      }));
  }

  get topRevenueEvent(): EventLeaderboardRow | null {
    return this.leaderboardRows[0] || null;
  }

  get categoryRevenueChartHeight(): number {
    return this.getHorizontalChartHeight(Math.min(this.categoryRows.length, this.maxHorizontalChartRows));
  }

  get leaderboardChartHeight(): number {
    return this.getHorizontalChartHeight(Math.min(this.leaderboardRows.length, this.maxHorizontalChartRows), 320);
  }

  get topOccupancyEvent(): EventLeaderboardRow | null {
    return [...this.events]
      .map((event) => this.createLeaderboardRow(event))
      .filter((row): row is EventLeaderboardRow => row !== null)
      .sort((left, right) => right.occupancyRate - left.occupancyRate || right.waitlistCount - left.waitlistCount)[0] || null;
  }

  get averageRevenuePerEvent(): number {
    return this.events.length ? this.totalRevenue / this.events.length : 0;
  }

  get averageReservationsPerEvent(): number {
    return this.events.length ? this.reservations.length / this.events.length : 0;
  }

  get paidConversionRate(): number {
    return this.reservations.length ? (this.paidReservationsCount / this.reservations.length) * 100 : 0;
  }

  get attendedReservations(): ReservationResponseDTO[] {
    return this.reservations.filter((reservation) => reservation.statut === 'ATTENDED');
  }

  get feedbackReservations(): ReservationResponseDTO[] {
    return this.reservations.filter((reservation) => Number(reservation.feedbackRating || 0) > 0);
  }

  get averageFeedbackRating(): number {
    const ratedReservations = this.feedbackReservations;
    return ratedReservations.length
      ? ratedReservations.reduce((sum, reservation) => sum + Number(reservation.feedbackRating || 0), 0) / ratedReservations.length
      : 0;
  }

  get feedbackResponseRate(): number {
    const denominator = Math.max(this.attendedReservations.length, this.feedbackReservations.length);
    return denominator ? (this.feedbackReservations.length / denominator) * 100 : 0;
  }

  get highRatingShare(): number {
    return this.feedbackReservations.length
      ? (this.feedbackReservations.filter((reservation) => Number(reservation.feedbackRating || 0) >= 4).length / this.feedbackReservations.length) * 100
      : 0;
  }

  get feedbackEventRows(): FeedbackEventRow[] {
    const rows = new Map<number, FeedbackEventRow>();

    this.feedbackReservations.forEach((reservation) => {
      const existing = rows.get(reservation.eventId) ?? {
        id: reservation.eventId,
        title: reservation.eventTitre,
        averageRating: 0,
        responseRate: 0,
        responses: 0
      };

      const attendedCount = this.attendedReservations.filter((item) => item.eventId === reservation.eventId).length;
      const nextResponses = existing.responses + 1;
      const nextAverage = ((existing.averageRating * existing.responses) + Number(reservation.feedbackRating || 0)) / nextResponses;

      existing.responses = nextResponses;
      existing.averageRating = nextAverage;
      existing.responseRate = attendedCount ? (nextResponses / attendedCount) * 100 : 100;
      rows.set(reservation.eventId, existing);
    });

    return [...rows.values()]
      .sort((left, right) => right.averageRating - left.averageRating || right.responses - left.responses)
      .slice(0, 4);
  }

  get upcomingAverageFillRate(): number {
    return this.upcomingEvents.length
      ? this.upcomingEvents.reduce((sum, event) => sum + this.getEventOccupancyRate(event), 0) / this.upcomingEvents.length
      : 0;
  }

  get attentionEvents(): AttentionEventRow[] {
    const now = Date.now();

    return this.events
      .map((event) => {
        const startsAt = this.parseDate(event.dateDebut);
        const daysUntilStart = (startsAt - now) / (1000 * 60 * 60 * 24);
        const occupancyRate = this.getEventOccupancyRate(event);

        if (event.published === false && daysUntilStart <= 7 && daysUntilStart >= 0) {
          return {
            id: event.id,
            title: event.titre,
            note: 'Starts soon but is still held as a draft.',
            severityClass: 'critical'
          };
        }

        if (event.waitlistCount > 0) {
          return {
            id: event.id,
            title: event.titre,
            note: `${event.waitlistCount} guests are waiting for seats. Capacity may need intervention.`,
            severityClass: 'watch'
          };
        }

        if (daysUntilStart <= 10 && daysUntilStart >= 0 && occupancyRate < 30) {
          return {
            id: event.id,
            title: event.titre,
            note: `Fill is only ${this.formatPercent(occupancyRate)}% with less than 10 days to go.`,
            severityClass: 'critical'
          };
        }

        if (daysUntilStart <= 14 && daysUntilStart >= 0 && occupancyRate >= 80) {
          return {
            id: event.id,
            title: event.titre,
            note: `Demand is strong at ${this.formatPercent(occupancyRate)}% occupancy.`,
            severityClass: 'good'
          };
        }

        return null;
      })
      .filter((item): item is AttentionEventRow => item !== null)
      .slice(0, 6);
  }

  get upcomingEvents(): EventResponseDTO[] {
    const now = Date.now();
    return this.events.filter((event) => this.parseDate(event.dateDebut) > now);
  }

  get publishedEvents(): EventResponseDTO[] {
    return this.events.filter((event) => event.published !== false);
  }

  get totalParticipants(): number {
    return this.events.reduce((sum, event) => sum + Number(event.participantsCount || 0), 0);
  }

  get totalCapacity(): number {
    return this.events.reduce((sum, event) => sum + Number(event.capaciteMax || 0), 0);
  }

  get overallOccupancyRate(): number {
    return this.totalCapacity ? (this.totalParticipants / this.totalCapacity) * 100 : 0;
  }

  get waitlistGuests(): number {
    return this.events.reduce((sum, event) => sum + Number(event.waitlistCount || 0), 0);
  }

  get totalRevenue(): number {
    return this.reservations.reduce((sum, reservation) => sum + this.getReservationRevenue(reservation), 0);
  }

  get paidReservationsCount(): number {
    return this.reservations.filter((reservation) => reservation.statutPaiement === 'PAID').length;
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      events: this.eventService.getAllEvents().pipe(catchError(() => of([] as EventResponseDTO[]))),
      reservations: this.eventService.getAllReservations().pipe(catchError(() => of([] as ReservationResponseDTO[])))
    }).subscribe({
      next: ({ events, reservations }) => {
        this.events = events.sort((left, right) => this.parseDate(right.dateDebut) - this.parseDate(left.dateDebut));
        this.reservations = reservations;
        this.refreshCharts();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'We could not load the event BI dashboard right now.';
        this.events = [];
        this.reservations = [];
        this.refreshCharts();
        this.isLoading = false;
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Number(amount || 0));
  }

  formatPercent(value: number): string {
    return Number.isFinite(value) ? value.toFixed(value >= 10 ? 0 : 1) : '0';
  }

  formatDateTime(value?: string | null): string {
    const timestamp = this.parseDate(value);
    if (!timestamp) {
      return '-';
    }

    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  formatEnumLabel(value?: string | null): string {
    if (!value) {
      return '-';
    }

    return value
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  downloadFeaturedGuestList(): void {
    const spotlight = this.featuredEvent;
    if (!spotlight || this.downloadingGuestList) {
      return;
    }

    this.downloadingGuestList = true;
    this.errorMessage = '';

    this.eventService.downloadGuestList(spotlight.id, 'csv').subscribe({
      next: (blob) => {
        this.saveBlob(blob, this.buildEventExportFileName('guest-list', spotlight.title, 'csv'));
        this.downloadingGuestList = false;
        this.showSuccessToast('Guest list downloaded successfully.', 'Export ready');
      },
      error: (error) => {
        this.downloadingGuestList = false;
        this.errorMessage = 'We could not export the guest list right now.';
        console.error('Error downloading guest list:', error);
      }
    });
  }

  downloadFeaturedAttendanceSheet(): void {
    const spotlight = this.featuredEvent;
    if (!spotlight || this.downloadingAttendanceSheet) {
      return;
    }

    this.downloadingAttendanceSheet = true;
    this.errorMessage = '';

    this.eventService.downloadAttendanceSheet(spotlight.id, 'pdf').subscribe({
      next: (blob) => {
        this.saveBlob(blob, this.buildEventExportFileName('attendance-sheet', spotlight.title, 'pdf'));
        this.downloadingAttendanceSheet = false;
        this.showSuccessToast('Attendance sheet downloaded successfully.', 'Export ready');
      },
      error: (error) => {
        this.downloadingAttendanceSheet = false;
        this.errorMessage = 'We could not export the attendance sheet right now.';
        console.error('Error downloading attendance sheet:', error);
      }
    });
  }

  private refreshCharts(): void {
    this.demandChartData = {
      labels: this.trendPoints.map((point) => point.label),
      datasets: [
        {
          label: 'Bookings',
          data: this.trendPoints.map((point) => point.reservations),
          backgroundColor: '#2f7a55',
          borderRadius: 12,
          maxBarThickness: 28
        },
        {
          label: 'Guests',
          data: this.trendPoints.map((point) => point.participants),
          backgroundColor: '#d49a2a',
          borderRadius: 12,
          maxBarThickness: 28
        }
      ]
    };

    this.statusMixChartData = {
      labels: this.statusMix.map((item) => item.label),
      datasets: [
        {
          data: this.statusMix.map((item) => item.count),
          backgroundColor: this.statusMix.map((item) => this.colorForTone(item.toneClass)),
          hoverBackgroundColor: this.statusMix.map((item) => this.colorForTone(item.toneClass))
        }
      ]
    };

    const feedbackDistribution = [
      { label: '5 stars', count: this.feedbackReservations.filter((reservation) => reservation.feedbackRating === 5).length, toneClass: 'forest' },
      { label: '4 stars', count: this.feedbackReservations.filter((reservation) => reservation.feedbackRating === 4).length, toneClass: 'ocean' },
      { label: '3 stars', count: this.feedbackReservations.filter((reservation) => reservation.feedbackRating === 3).length, toneClass: 'gold' },
      { label: '2 stars', count: this.feedbackReservations.filter((reservation) => reservation.feedbackRating === 2).length, toneClass: 'coral' },
      { label: '1 star', count: this.feedbackReservations.filter((reservation) => reservation.feedbackRating === 1).length, toneClass: 'slate' }
    ].filter((item) => item.count > 0);

    this.feedbackMixChartData = {
      labels: feedbackDistribution.map((item) => item.label),
      datasets: [
        {
          data: feedbackDistribution.map((item) => item.count),
          backgroundColor: feedbackDistribution.map((item) => this.colorForTone(item.toneClass)),
          hoverBackgroundColor: feedbackDistribution.map((item) => this.colorForTone(item.toneClass))
        }
      ]
    };

    const categoryRows = this.categoryRows.slice(0, this.maxHorizontalChartRows);
    this.categoryRevenueChartData = {
      labels: categoryRows.map((row) => this.truncateChartLabel(row.label)),
      datasets: [
        {
          label: 'Revenue',
          data: categoryRows.map((row) => Number(row.revenue.toFixed(2))),
          backgroundColor: ['#275f8a', '#2f7a55', '#d49a2a', '#d36c58', '#7a63c7'],
          borderRadius: 12,
          maxBarThickness: 38
        }
      ]
    };

    const leaderboardRows = this.leaderboardRows.slice(0, this.maxHorizontalChartRows);
    this.leaderboardChartData = {
      labels: leaderboardRows.map((row) => this.truncateChartLabel(row.title)),
      datasets: [
        {
          label: 'Revenue',
          data: leaderboardRows.map((row) => Number(row.revenue.toFixed(2))),
          backgroundColor: '#173128',
          borderRadius: 14,
          maxBarThickness: 26
        }
      ]
    };
  }

  private colorForTone(toneClass: string): string {
    const palette: Record<string, string> = {
      forest: '#2f7a55',
      ocean: '#275f8a',
      gold: '#d49a2a',
      coral: '#d36c58',
      slate: '#6e7d86',
      violet: '#7a63c7'
    };

    return palette[toneClass] || '#5f7067';
  }

  private getHorizontalChartHeight(rowCount: number, maxHeight = 300): number {
    const normalizedRowCount = Math.max(1, rowCount);
    return Math.min(maxHeight, Math.max(220, 88 + normalizedRowCount * 44));
  }

  private truncateChartLabel(label?: string | null, limit = 28): string {
    const normalizedLabel = label?.replace(/\s+/g, ' ').trim() || '-';

    if (normalizedLabel.length <= limit) {
      return normalizedLabel;
    }

    return `${normalizedLabel.slice(0, limit - 1).trimEnd()}…`;
  }

  private createLeaderboardRow(event: EventResponseDTO): EventLeaderboardRow | null {
    if (!event?.id) {
      return null;
    }

    const eventReservations = this.getReservationsForEvent(event.id);
    return {
      id: event.id,
      title: event.titre,
      location: event.lieu,
      dateLabel: event.dateDebut,
      reservations: eventReservations.length,
      participants: Number(event.participantsCount || 0),
      revenue: eventReservations.reduce((sum, reservation) => sum + this.getReservationRevenue(reservation), 0),
      occupancyRate: this.getEventOccupancyRate(event),
      waitlistCount: Number(event.waitlistCount || 0)
    };
  }

  private getReservationsForEvent(eventId: number): ReservationResponseDTO[] {
    return this.reservations.filter((reservation) => reservation.eventId === eventId);
  }

  private getEventOccupancyRate(event: EventResponseDTO): number {
    const capacity = Number(event.capaciteMax || 0);
    return capacity ? (Number(event.participantsCount || 0) / capacity) * 100 : 0;
  }

  private getReservationRevenue(reservation: ReservationResponseDTO): number {
    if (reservation.statutPaiement === 'REFUNDED') {
      return 0;
    }

    if (reservation.statutPaiement === 'PARTIALLY_REFUNDED') {
      return Number(
        reservation.netPaidAmount
        ?? (reservation.prixTotal || 0) - (reservation.refundAmount || 0)
      );
    }

    if (reservation.statutPaiement === 'PAID') {
      return Number(reservation.netPaidAmount ?? reservation.prixTotal ?? 0);
    }

    return 0;
  }

  private parseDate(value?: string | null): number {
    if (!value) {
      return 0;
    }

    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const downloadUrl = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = fileName;
    downloadLink.click();
    window.URL.revokeObjectURL(downloadUrl);
  }

  private buildEventExportFileName(prefix: string, eventTitle: string, extension: string): string {
    const safeTitle = eventTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${prefix}-${safeTitle || 'event'}.${extension}`;
  }
}
