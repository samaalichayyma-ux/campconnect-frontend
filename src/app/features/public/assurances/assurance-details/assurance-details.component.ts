import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AssuranceService } from '../../../../core/services/assurance.service';

import { Assurance, Garantie, TYPE_ASSURANCE_LABELS } from '../../../../core/models/assurance.models';
import { EventService } from '../../events/services/event.service';
import { CampingService } from '../../services/camping.service';

@Component({
  selector: 'app-assurance-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assurance-details.component.html',
  styleUrls: ['./assurance-details.component.scss']
})
export class AssuranceDetailsComponent implements OnInit {
  assuranceId!: number;
  assurance?: Assurance;
  garanties: Garantie[] = [];

  loading = false;
  errorMessage = '';

  hasReservation = false;
  hasInscriptionSite = false;
  canSubscribe = false;

  readonly typeLabels = TYPE_ASSURANCE_LABELS;

  constructor(
    private route: ActivatedRoute,
    private assuranceService: AssuranceService,
    private eventService: EventService,
    private campingService: CampingService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.assuranceId = Number(idParam);

    if (!idParam || isNaN(this.assuranceId)) {
      this.errorMessage = 'Identifiant assurance invalide.';
      return;
    }

    this.loadDetails();
    this.checkUserEligibility();
  }

  loadDetails(): void {
    this.loading = true;
    this.errorMessage = '';

    this.assuranceService.getAssuranceById(this.assuranceId).subscribe({
      next: (assurance) => {
        this.assurance = assurance;

        this.assuranceService.getGarantiesByAssurance(this.assuranceId).subscribe({
          next: (garanties) => {
            this.garanties = garanties;
            this.loading = false;
          },
          error: () => {
            this.garanties = [];
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de charger le détail de cette assurance.';
        this.loading = false;
      }
    });
  }

  checkUserEligibility(): void {
    forkJoin({
      reservations: this.eventService.getMyReservations().pipe(
        catchError(() => of([]))
      ),
      inscriptions: this.campingService.getMyBookings().pipe(
        catchError(() => of([]))
      )
    }).subscribe({
      next: ({ reservations, inscriptions }) => {
        this.hasReservation = reservations.length > 0;
        this.hasInscriptionSite = inscriptions.length > 0;
        this.canSubscribe = this.hasReservation || this.hasInscriptionSite;
      },
      error: () => {
        this.canSubscribe = false;
      }
    });
  }
}