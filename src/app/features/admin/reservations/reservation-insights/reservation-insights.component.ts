import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { catchError, combineLatest, forkJoin, of } from 'rxjs';

import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { ToastMessageHost } from '../../../../core/utils/toast-message-host';
import { EventResponseDTO, PaymentStatus, ReservationResponseDTO, ReservationStatus } from '../../../public/events/models/event.model';
import { EventService } from '../../../public/events/services/event.service';

interface ReservationMetricCard {
  label: string;
  value: string;
  note: string;
  icon: string;
  toneClass: string;
}

interface ReservationStage {
  label: string;
  count: number;
  share: number;
  toneClass: string;
}

interface ReservationTrendPoint {
  label: string;
  count: number;
  paidCount: number;
  revenue: number;
}

interface ReservationEventLoadRow {
  eventId: number;
  title: string;
  dateLabel: string;
  reservations: number;
  guests: number;
  revenue: number;
  waitlistGuests: number;
}

interface ReservationFeedbackSnapshot {
  reservationId: number;
  eventTitle: string;
  guestName: string;
  submittedAt?: string;
  rating: number;
  comment: string;
}

type DoughnutChartData = ChartData<'doughnut', number[], string>;
type BarChartData = ChartData<'bar', number[], string>;
type LineChartData = ChartData<'line', number[], string>;

@Component({
  selector: 'app-reservation-insights',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminIconComponent, BaseChartDirective],
  templateUrl: './reservation-insights.component.html',
  styleUrl: './reservation-insights.component.css'
})
export class ReservationInsightsComponent extends ToastMessageHost implements OnInit {
  readonly maxHorizontalChartRows = 5;

  isLoading = false;
  reservations: ReservationResponseDTO[] = [];
  eventById = new Map<number, EventResponseDTO>();
  focusReservationId: number | null = null;
  navigationSource: 'dashboard' | 'reservations' = 'dashboard';

  bookingTrendChartData: LineChartData = { labels: [], datasets: [] };
  stageMixChartData: DoughnutChartData = { labels: [], datasets: [] };
  paymentMixChartData: DoughnutChartData = { labels: [], datasets: [] };
  eventLoadChartData: BarChartData = { labels: [], datasets: [] };
  feedbackMixChartData: DoughnutChartData = { labels: [], datasets: [] };
  downloadingReservationReport = false;
  downloadingRevenueReport = false;

  readonly lineChartOptions: ChartOptions<'line'> = {
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
      const queryFocusId = Number(queryParams.get('focusReservationId'));

      this.focusReservationId = Number.isFinite(routeId) && routeId > 0
        ? routeId
        : (Number.isFinite(queryFocusId) && queryFocusId > 0 ? queryFocusId : null);

      this.navigationSource = queryParams.get('from') === 'reservations' ? 'reservations' : 'dashboard';
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
    return '/admin/reservations';
  }

  get contextLabel(): string {
    return this.navigationSource === 'reservations' ? 'Back to Reservations' : 'Manage Reservations';
  }

  get metricCards(): ReservationMetricCard[] {
    return [
      {
        label: 'Total Reservations',
        value: String(this.reservations.length),
        note: `${this.approvalBacklog.length} bookings still need approval follow-up`,
        icon: 'reservations',
        toneClass: 'forest'
      },
      {
        label: 'Collected Revenue',
        value: this.formatCurrency(this.totalRevenue),
        note: `${this.paidReservationsCount} reservations completed payment`,
        icon: 'wallet',
        toneClass: 'ocean'
      },
      {
        label: 'Check-in Queue',
        value: String(this.checkInQueue.length),
        note: this.checkInQueue.length > 0
          ? 'Ready for attended or no-show recording'
          : 'No bookings are waiting for check-in right now',
        icon: 'check',
        toneClass: 'gold'
      },
      {
        label: 'No-show Rate',
        value: `${this.formatPercent(this.noShowRate)}%`,
        note: `${this.waitlistGuests} guests are currently on waitlists`,
        icon: 'warning',
        toneClass: 'coral'
      }
    ];
  }

  get featuredReservation(): ReservationResponseDTO | null {
    if (this.focusReservationId) {
      const focused = this.reservations.find((reservation) => reservation.id === this.focusReservationId);
      if (focused) {
        return focused;
      }
    }

    return this.checkInQueue[0]
      || this.approvalBacklog[0]
      || [...this.reservations].sort((left, right) => this.parseDate(right.dateCreation) - this.parseDate(left.dateCreation))[0]
      || null;
  }

  get reservationStages(): ReservationStage[] {
    const stageDefinitions: Array<{ label: string; count: number; toneClass: string }> = [
      { label: 'Pending approval', count: this.approvalBacklog.length, toneClass: 'gold' },
      { label: 'Confirmed', count: this.confirmedReservations.length, toneClass: 'forest' },
      { label: 'Attended', count: this.statusCount('ATTENDED'), toneClass: 'ocean' },
      { label: 'No-show', count: this.statusCount('NO_SHOW'), toneClass: 'coral' },
      { label: 'Cancelled', count: this.statusCount('CANCELLED'), toneClass: 'slate' },
      { label: 'Refunded', count: this.refundedReservations.length, toneClass: 'violet' },
      { label: 'Waitlist', count: this.waitlistReservations.length, toneClass: 'gold' }
    ];

    const total = Math.max(1, this.reservations.length);
    return stageDefinitions
      .filter((item) => item.count > 0)
      .map((item) => ({
        ...item,
        share: (item.count / total) * 100
      }));
  }

  get paymentMix(): ReservationStage[] {
    const total = Math.max(1, this.reservations.length);
    const definitions: Array<{ label: string; count: number; toneClass: string }> = [
      { label: 'Paid', count: this.paymentCount('PAID'), toneClass: 'forest' },
      { label: 'Pending', count: this.paymentCount('PENDING'), toneClass: 'gold' },
      { label: 'Unpaid', count: this.paymentCount('UNPAID'), toneClass: 'coral' },
      {
        label: 'Refunded',
        count: this.paymentCount('REFUNDED') + this.paymentCount('PARTIALLY_REFUNDED'),
        toneClass: 'violet'
      }
    ];

    return definitions
      .filter((item) => item.count > 0)
      .map((item) => ({
        ...item,
        share: (item.count / total) * 100
      }));
  }

  get trendPoints(): ReservationTrendPoint[] {
    const end = new Date();
    end.setHours(0, 0, 0, 0);

    return Array.from({ length: 14 }, (_, index) => {
      const start = new Date(end);
      start.setDate(end.getDate() - (13 - index));
      const next = new Date(start);
      next.setDate(start.getDate() + 1);

      const dayReservations = this.reservations.filter((reservation) => {
        const createdAt = this.parseDate(reservation.dateCreation);
        return createdAt >= start.getTime() && createdAt < next.getTime();
      });

      return {
        label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dayReservations.length,
        paidCount: dayReservations.filter((reservation) => reservation.statutPaiement === 'PAID').length,
        revenue: dayReservations.reduce((sum, reservation) => sum + this.getReservationRevenue(reservation), 0)
      };
    });
  }

  get eventLoadRows(): ReservationEventLoadRow[] {
    const rows = new Map<number, ReservationEventLoadRow>();

    this.reservations.forEach((reservation) => {
      const event = this.eventById.get(reservation.eventId);
      const existing = rows.get(reservation.eventId) ?? {
        eventId: reservation.eventId,
        title: reservation.eventTitre,
        dateLabel: event?.dateDebut || reservation.eventDateDebut,
        reservations: 0,
        guests: 0,
        revenue: 0,
        waitlistGuests: 0
      };

      existing.reservations += 1;
      existing.guests += Number(reservation.nombreParticipants || 0);
      existing.revenue += this.getReservationRevenue(reservation);
      if (reservation.estEnAttente) {
        existing.waitlistGuests += Number(reservation.nombreParticipants || 0);
      }

      rows.set(reservation.eventId, existing);
    });

    return [...rows.values()]
      .sort((left, right) => right.revenue - left.revenue || right.reservations - left.reservations)
      .slice(0, 6);
  }

  get checkInQueue(): ReservationResponseDTO[] {
    return this.reservations
      .filter((reservation) => this.canRecordAttendance(reservation))
      .sort((left, right) => this.parseDate(left.eventDateDebut) - this.parseDate(right.eventDateDebut))
      .slice(0, 8);
  }

  get approvalBacklog(): ReservationResponseDTO[] {
    return this.reservations
      .filter((reservation) => reservation.statut === 'PENDING' && !reservation.estEnAttente)
      .sort((left, right) => this.parseDate(left.dateCreation) - this.parseDate(right.dateCreation))
      .slice(0, 8);
  }

  get totalRevenue(): number {
    return this.reservations.reduce((sum, reservation) => sum + this.getReservationRevenue(reservation), 0);
  }

  get paidReservationsCount(): number {
    return this.paymentCount('PAID');
  }

  get waitlistGuests(): number {
    return this.waitlistReservations.reduce((sum, reservation) => sum + Number(reservation.nombreParticipants || 0), 0);
  }

  get noShowRate(): number {
    const denominator = this.statusCount('ATTENDED') + this.statusCount('NO_SHOW');
    return denominator ? (this.statusCount('NO_SHOW') / denominator) * 100 : 0;
  }

  get paymentCollectionRate(): number {
    const eligibleCount = this.reservations.filter((reservation) => !reservation.estEnAttente).length;
    return eligibleCount ? (this.paidReservationsCount / eligibleCount) * 100 : 0;
  }

  get attendedReservations(): ReservationResponseDTO[] {
    return this.reservations.filter((reservation) => reservation.statut === 'ATTENDED');
  }

  get feedbackReservations(): ReservationResponseDTO[] {
    return this.reservations.filter((reservation) => Number(reservation.feedbackRating || 0) > 0);
  }

  get averageFeedbackRating(): number {
    return this.feedbackReservations.length
      ? this.feedbackReservations.reduce((sum, reservation) => sum + Number(reservation.feedbackRating || 0), 0) / this.feedbackReservations.length
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

  get recentFeedback(): ReservationFeedbackSnapshot[] {
    return this.feedbackReservations
      .slice()
      .sort((left, right) => this.parseDate(right.feedbackSubmittedAt) - this.parseDate(left.feedbackSubmittedAt))
      .slice(0, 4)
      .map((reservation) => ({
        reservationId: reservation.id,
        eventTitle: reservation.eventTitre,
        guestName: reservation.utilisateurNom,
        submittedAt: reservation.feedbackSubmittedAt,
        rating: Number(reservation.feedbackRating || 0),
        comment: reservation.feedbackComment?.trim() || 'Rating submitted without a written comment.'
      }));
  }

  get eventLoadChartHeight(): number {
    return this.getHorizontalChartHeight(Math.min(this.eventLoadRows.length, this.maxHorizontalChartRows), 320);
  }

  get approvalRate(): number {
    const eligibleCount = this.reservations.filter((reservation) => !reservation.estEnAttente).length;
    const approvedCount = this.reservations.filter((reservation) =>
      !reservation.estEnAttente
      && (reservation.statut === 'CONFIRMED'
      || reservation.statut === 'PAID'
      || reservation.statut === 'ATTENDED'
      || reservation.statut === 'NO_SHOW')
    ).length;
    return eligibleCount ? (approvedCount / eligibleCount) * 100 : 0;
  }

  get attendanceCompletionRate(): number {
    const pastEligibleCount = this.reservations.filter((reservation) =>
      !reservation.estEnAttente && this.parseDate(reservation.eventDateDebut) <= Date.now()
    ).length;
    const attendedOrNoShowCount = this.statusCount('ATTENDED') + this.statusCount('NO_SHOW');
    return pastEligibleCount ? (attendedOrNoShowCount / pastEligibleCount) * 100 : 0;
  }

  get confirmedReservations(): ReservationResponseDTO[] {
    return this.reservations.filter((reservation) => reservation.statut === 'CONFIRMED' || reservation.statut === 'PAID');
  }

  get waitlistReservations(): ReservationResponseDTO[] {
    return this.reservations.filter((reservation) => reservation.estEnAttente);
  }

  get refundedReservations(): ReservationResponseDTO[] {
    return this.reservations.filter((reservation) =>
      reservation.statut === 'REFUNDED'
      || reservation.statutPaiement === 'REFUNDED'
      || reservation.statutPaiement === 'PARTIALLY_REFUNDED'
    );
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      reservations: this.eventService.getAllReservations().pipe(catchError(() => of([] as ReservationResponseDTO[]))),
      events: this.eventService.getAllEvents().pipe(catchError(() => of([] as EventResponseDTO[])))
    }).subscribe({
      next: ({ reservations, events }) => {
        this.reservations = reservations.sort((left, right) => this.parseDate(right.dateCreation) - this.parseDate(left.dateCreation));
        this.eventById = new Map(events.map((event) => [event.id, event]));
        this.refreshCharts();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'We could not load the reservation BI dashboard right now.';
        this.reservations = [];
        this.eventById.clear();
        this.refreshCharts();
        this.isLoading = false;
      }
    });
  }

  canRecordAttendance(reservation: ReservationResponseDTO): boolean {
    const eventStart = this.parseDate(reservation.eventDateDebut);
    return eventStart <= Date.now()
      && !reservation.estEnAttente
      && (reservation.statut === 'CONFIRMED' || reservation.statut === 'PAID');
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

  formatStatusLabel(value?: string | null): string {
    if (!value) {
      return '-';
    }

    return value
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  downloadReservationReport(): void {
    if (this.downloadingReservationReport) {
      return;
    }

    this.downloadingReservationReport = true;
    this.errorMessage = '';

    this.eventService.downloadReservationReport('csv').subscribe({
      next: (blob) => {
        this.saveBlob(blob, 'reservation-report.csv');
        this.downloadingReservationReport = false;
        this.showSuccessToast('Reservation report downloaded successfully.', 'Export ready');
      },
      error: (error) => {
        this.downloadingReservationReport = false;
        this.errorMessage = 'We could not export the reservation report right now.';
        console.error('Error downloading reservation report:', error);
      }
    });
  }

  downloadRevenueReport(): void {
    if (this.downloadingRevenueReport) {
      return;
    }

    this.downloadingRevenueReport = true;
    this.errorMessage = '';

    this.eventService.downloadRevenueReport('pdf').subscribe({
      next: (blob) => {
        this.saveBlob(blob, 'revenue-report.pdf');
        this.downloadingRevenueReport = false;
        this.showSuccessToast('Revenue report downloaded successfully.', 'Export ready');
      },
      error: (error) => {
        this.downloadingRevenueReport = false;
        this.errorMessage = 'We could not export the revenue report right now.';
        console.error('Error downloading revenue report:', error);
      }
    });
  }

  private refreshCharts(): void {
    this.bookingTrendChartData = {
      labels: this.trendPoints.map((point) => point.label),
      datasets: [
        {
          label: 'Reservations',
          data: this.trendPoints.map((point) => point.count),
          borderColor: '#275f8a',
          backgroundColor: 'rgba(39, 95, 138, 0.16)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#275f8a'
        },
        {
          label: 'Paid',
          data: this.trendPoints.map((point) => point.paidCount),
          borderColor: '#2f7a55',
          backgroundColor: 'rgba(47, 122, 85, 0.14)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#2f7a55'
        }
      ]
    };

    this.stageMixChartData = {
      labels: this.reservationStages.map((item) => item.label),
      datasets: [
        {
          data: this.reservationStages.map((item) => item.count),
          backgroundColor: this.reservationStages.map((item) => this.colorForTone(item.toneClass)),
          hoverBackgroundColor: this.reservationStages.map((item) => this.colorForTone(item.toneClass))
        }
      ]
    };

    this.paymentMixChartData = {
      labels: this.paymentMix.map((item) => item.label),
      datasets: [
        {
          data: this.paymentMix.map((item) => item.count),
          backgroundColor: this.paymentMix.map((item) => this.colorForTone(item.toneClass)),
          hoverBackgroundColor: this.paymentMix.map((item) => this.colorForTone(item.toneClass))
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

    const topEvents = this.eventLoadRows.slice(0, this.maxHorizontalChartRows);
    this.eventLoadChartData = {
      labels: topEvents.map((row) => this.truncateChartLabel(row.title)),
      datasets: [
        {
          label: 'Reservations',
          data: topEvents.map((row) => row.reservations),
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

  private statusCount(status: ReservationStatus): number {
    return this.reservations.filter((reservation) => reservation.statut === status).length;
  }

  private paymentCount(status: PaymentStatus): number {
    return this.reservations.filter((reservation) => reservation.statutPaiement === status).length;
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
}
