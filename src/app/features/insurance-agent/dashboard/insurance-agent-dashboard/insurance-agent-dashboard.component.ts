import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AssuranceService } from '../../../../core/services/assurance.service';
import {
  Assurance,
  SouscriptionAssurance,
  Sinistre,
  Remboursement,
  CurrentWeatherResponse
} from '../../../../core/models/assurance.models';

interface AiFraudeDashboardResult {
  scoreFraude: number;
  niveauRisque: 'FAIBLE' | 'MOYEN' | 'ELEVE';
  raisons: string[];
  recommandationAdmin: string;
}

@Component({
  selector: 'app-insurance-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './insurance-agent-dashboard.component.html',
  styleUrls: ['./insurance-agent-dashboard.component.scss']
})
export class InsuranceAgentDashboardComponent implements OnInit {
  assurances: Assurance[] = [];
  souscriptions: SouscriptionAssurance[] = [];
  sinistres: Sinistre[] = [];
  remboursements: Remboursement[] = [];

  loading = false;
  errorMessage = '';

  activeAssurancesCount = 0;
  souscriptionsCount = 0;
  sinistresAcceptesCount = 0;
  sinistresRefusesCount = 0;
  montantTotalRembourse = 0;

  assurancePlusUtilisee = 'No data available';
  assurancePlusUtiliseeCount = 0;

  fraudeLoading = false;
  fraudeError = '';
  fraudeAnalyzedCount = 0;
  fraudeHighRiskCount = 0;
  tauxFraudeIa: number | null = null;

  recentSinistres: Sinistre[] = [];

  weatherCity = 'Tabarka';
  currentWeather?: CurrentWeatherResponse;
  weatherLoading = false;
  weatherError = '';

  constructor(private assuranceService: AssuranceService) {}

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadCurrentWeather();
  }

  loadDashboardStats(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      assurances: this.assuranceService.getAllAssurances().pipe(
        catchError((error) => {
          console.error('Error loading insurance offers', error);
          return of([] as Assurance[]);
        })
      ),

      souscriptions: this.assuranceService.getAllSouscriptions().pipe(
        catchError((error) => {
          console.error('Error loading subscriptions', error);
          return of([] as SouscriptionAssurance[]);
        })
      ),

      sinistres: this.assuranceService.getAllSinistres().pipe(
        catchError((error) => {
          console.error('Error loading claims', error);
          return of([] as Sinistre[]);
        })
      ),

      remboursements: this.assuranceService.getAllRemboursements().pipe(
        catchError((error) => {
          console.error('Error loading reimbursements', error);
          return of([] as Remboursement[]);
        })
      )
    }).subscribe({
      next: ({ assurances, souscriptions, sinistres, remboursements }) => {
        this.assurances = assurances;
        this.souscriptions = souscriptions;
        this.sinistres = sinistres;
        this.remboursements = remboursements;

        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to load insurance dashboard statistics.';
        this.loading = false;
      }
    });
  }

  loadCurrentWeather(): void {
    const city = this.weatherCity.trim();

    if (!city) {
      this.weatherError = 'Please enter a city.';
      return;
    }

    this.weatherLoading = true;
    this.weatherError = '';

    this.assuranceService.getCurrentWeather(city).subscribe({
      next: (weather) => {
        this.currentWeather = weather;
        this.weatherLoading = false;
      },
      error: (error) => {
        console.error('Error loading current weather', error);
        this.weatherError =
          error?.error?.message ||
          'Unable to load current weather data.';
        this.weatherLoading = false;
      }
    });
  }

  private calculateStats(): void {
    this.activeAssurancesCount = this.assurances.filter(
      assurance => assurance.active
    ).length;

    this.souscriptionsCount = this.souscriptions.length;

    this.sinistresAcceptesCount = this.sinistres.filter(
      sinistre =>
        sinistre.statut === 'ACCEPTE' ||
        sinistre.statut === 'REMBOURSE'
    ).length;

    this.sinistresRefusesCount = this.sinistres.filter(
      sinistre => sinistre.statut === 'REFUSE'
    ).length;

    this.montantTotalRembourse = this.calculateMontantTotalRembourse();

    this.calculateAssurancePlusUtilisee();

    this.recentSinistres = [...this.sinistres]
      .sort((a, b) => {
        const dateA = new Date(a.dateDeclaration || '').getTime() || 0;
        const dateB = new Date(b.dateDeclaration || '').getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }

  private calculateMontantTotalRembourse(): number {
    const totalRemboursementsEffectues = this.remboursements
      .filter(remboursement => remboursement.statut === 'EFFECTUE')
      .reduce(
        (sum, remboursement) => sum + Number(remboursement.montant || 0),
        0
      );

    const totalDepuisSinistres = this.sinistres
      .filter(
        sinistre =>
          sinistre.statut === 'REMBOURSE' ||
          Number(sinistre.montantRembourse || 0) > 0
      )
      .reduce(
        (sum, sinistre) => sum + Number(sinistre.montantRembourse || 0),
        0
      );

    return Math.max(totalRemboursementsEffectues, totalDepuisSinistres);
  }

  private calculateAssurancePlusUtilisee(): void {
    const counts = new Map<string, number>();

    this.souscriptions.forEach((souscription) => {
      const title = this.getAssuranceTitleFromSouscription(souscription);

      if (!title || title === 'Undefined insurance') {
        return;
      }

      counts.set(title, (counts.get(title) || 0) + 1);
    });

    let bestTitle = 'No data available';
    let bestCount = 0;

    counts.forEach((count, title) => {
      if (count > bestCount) {
        bestTitle = title;
        bestCount = count;
      }
    });

    this.assurancePlusUtilisee = bestTitle;
    this.assurancePlusUtiliseeCount = bestCount;
  }

  private getAssuranceTitleFromSouscription(
    souscription: SouscriptionAssurance
  ): string {
    const data: any = souscription;

    return (
      data?.assurance?.titre ||
      data?.assuranceSouscrite?.titre ||
      data?.assuranceTitre ||
      data?.titreAssurance ||
      data?.assurance?.nom ||
      'Undefined insurance'
    );
  }

  analyserTauxFraudeIa(): void {
    if (!this.sinistres.length) {
      this.fraudeError = 'No claims available for AI fraud analysis.';
      return;
    }

    this.fraudeLoading = true;
    this.fraudeError = '';
    this.fraudeAnalyzedCount = 0;
    this.fraudeHighRiskCount = 0;
    this.tauxFraudeIa = null;

    const requests = this.sinistres
      .filter(sinistre => !!sinistre.id)
      .map((sinistre) =>
        this.assuranceService.detectFraudeBySinistreAi(sinistre.id!).pipe(
          catchError((error) => {
            console.error('AI fraud analysis error for claim', sinistre.id, error);
            return of('');
          })
        )
      );

    if (!requests.length) {
      this.fraudeError = 'No valid claims available for analysis.';
      this.fraudeLoading = false;
      return;
    }

    forkJoin(requests).subscribe({
      next: (responses) => {
        responses.forEach((response) => {
          if (!response) {
            return;
          }

          try {
            const result =
              this.assuranceService.parseAiJson<AiFraudeDashboardResult>(
                response
              );

            this.fraudeAnalyzedCount++;

            if (
              Number(result.scoreFraude || 0) >= 70 ||
              result.niveauRisque === 'ELEVE'
            ) {
              this.fraudeHighRiskCount++;
            }
          } catch (error) {
            console.error('Unreadable AI fraud response', error);
          }
        });

        this.tauxFraudeIa =
          this.fraudeAnalyzedCount > 0
            ? Math.round(
                (this.fraudeHighRiskCount / this.fraudeAnalyzedCount) * 100
              )
            : 0;

        this.fraudeLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.fraudeError = 'Unable to calculate the AI fraud rate.';
        this.fraudeLoading = false;
      }
    });
  }

  getAcceptedRate(): number {
    if (!this.sinistres.length) {
      return 0;
    }

    return Math.round(
      (this.sinistresAcceptesCount / this.sinistres.length) * 100
    );
  }

  getRefusedRate(): number {
    if (!this.sinistres.length) {
      return 0;
    }

    return Math.round(
      (this.sinistresRefusesCount / this.sinistres.length) * 100
    );
  }

  getFraudeDisplayValue(): string {
    if (this.tauxFraudeIa === null) {
      return 'Not analyzed';
    }

    return `${this.tauxFraudeIa}%`;
  }

  getSinistreStatusClass(statut?: string): string {
    switch (statut) {
      case 'ACCEPTE':
      case 'REMBOURSE':
        return 'status-success';

      case 'REFUSE':
        return 'status-danger';

      case 'EN_ATTENTE':
      case 'EN_COURS':
        return 'status-warning';

      default:
        return 'status-neutral';
    }
  }

  getSinistreStatusLabel(statut?: string): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'Pending';

      case 'EN_COURS':
        return 'In progress';

      case 'ACCEPTE':
        return 'Accepted';

      case 'REFUSE':
        return 'Rejected';

      case 'REMBOURSE':
        return 'Reimbursed';

      default:
        return 'Unknown';
    }
  }

  getWeatherRiskClass(): string {
    if (!this.currentWeather) {
      return 'weather-normal';
    }

    if (
      this.currentWeather.windKph >= 60 ||
      this.currentWeather.precipitationMm >= 20
    ) {
      return 'weather-danger';
    }

    if (
      this.currentWeather.windKph >= 35 ||
      this.currentWeather.precipitationMm >= 5
    ) {
      return 'weather-warning';
    }

    return 'weather-normal';
  }
}