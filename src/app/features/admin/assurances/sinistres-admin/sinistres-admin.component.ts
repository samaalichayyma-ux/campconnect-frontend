import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AssuranceService } from '../../../../core/services/assurance.service';
import {
  Sinistre,
  DocumentAssurance,
  Remboursement,
  StatutSinistre,
  StatutRemboursement
} from '../../../../core/models/assurance.models';
import { WeatherVerificationResponse } from '../../../../core/models/assurance.models';

interface AiFraudeResult {
  scoreFraude: number;
  niveauRisque: 'FAIBLE' | 'MOYEN' | 'ELEVE';
  raisons: string[];
  recommandationAdmin: string;
}

@Component({
  selector: 'app-sinistres-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './sinistres-admin.component.html',
  styleUrls: ['./sinistres-admin.component.scss']
})
export class SinistresAdminComponent implements OnInit {
  sinistres: Sinistre[] = [];
  selectedSinistreId: number | null = null;

  documents: DocumentAssurance[] = [];
  remboursementForm!: FormGroup;

  loading = false;
  documentsLoading = false;
  submittingRemboursement = false;

  errorMessage = '';
  successMessage = '';

  weatherResults: Record<number, WeatherVerificationResponse> = {};
  weatherErrors: Record<number, string> = {};
  weatherLoadings: Record<number, boolean> = {};

  fraudeResults: Record<number, AiFraudeResult> = {};
  fraudeErrors: Record<number, string> = {};
  fraudeLoadings: Record<number, boolean> = {};

  resumeResults: Record<number, string> = {};
  resumeErrors: Record<number, string> = {};
  resumeLoadings: Record<number, boolean> = {};

  readonly statusOptions = Object.values(StatutSinistre);

  readonly statusLabels: Record<string, string> = {
    DECLARE: 'Declared',
    EN_COURS: 'In progress',
    ACCEPTE: 'Accepted',
    REJETE: 'Rejected',
    INDEMNISE: 'Compensated'
  };

  readonly typeLabels: Record<string, string> = {
    ACCIDENT: 'Accident',
    ANNULATION: 'Cancellation',
    VOL: 'Theft',
    DOMMAGE: 'Damage',
    BLESSURE: 'Injury',
    AUTRE: 'Other'
  };

  readonly typeDocumentLabels: Record<string, string> = {
    JUSTIFICATIF: 'Supporting document',
    FACTURE: 'Invoice',
    PHOTO: 'Photo',
    RAPPORT: 'Report',
    AUTRE: 'Other'
  };

  constructor(
    private assuranceService: AssuranceService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadSinistres();
  }

  initForms(): void {
    this.remboursementForm = this.fb.group({
      montant: [0, [Validators.required, Validators.min(0)]],
      motif: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  loadSinistres(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.assuranceService.getAllSinistres().subscribe({
      next: (data) => {
        this.sinistres = data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to load claims.';
        this.loading = false;
      }
    });
  }

  updateSinistreStatus(sinistre: Sinistre, statut: StatutSinistre): void {
    const payload: Sinistre = { ...sinistre, statut };

    this.assuranceService.updateSinistre(payload).subscribe({
      next: () => {
        sinistre.statut = statut;
        this.successMessage = 'Claim status updated successfully.';
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to update claim status.';
      }
    });
  }

  openDocuments(sinistreId?: number): void {
    if (!sinistreId) return;

    this.selectedSinistreId = this.selectedSinistreId === sinistreId ? null : sinistreId;

    if (!this.selectedSinistreId) {
      this.documents = [];
      return;
    }

    this.documentsLoading = true;
    this.documents = [];
    this.successMessage = '';
    this.errorMessage = '';

    this.assuranceService.getDocumentsBySinistre(sinistreId).subscribe({
      next: (data) => {
        this.documents = data;
        this.documentsLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to load claim documents.';
        this.documentsLoading = false;
      }
    });
  }

  deleteDocument(id?: number): void {
    if (!id) return;

    const confirmed = confirm('Are you sure you want to delete this document?');
    if (!confirmed) return;

    this.assuranceService.deleteDocumentAssurance(id).subscribe({
      next: () => {
        this.successMessage = 'Document deleted successfully.';

        if (this.selectedSinistreId) {
          this.openDocuments(this.selectedSinistreId);
        }
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to delete this document.';
      }
    });
  }

  addRemboursement(sinistreId?: number): void {
    if (!sinistreId) return;

    if (this.remboursementForm.invalid) {
      this.remboursementForm.markAllAsTouched();
      return;
    }

    const payload: Remboursement = {
      ...this.remboursementForm.value,
      statut: StatutRemboursement.EN_ATTENTE
    };

    this.submittingRemboursement = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.assuranceService.addRemboursement(sinistreId, payload).subscribe({
      next: () => {
        this.successMessage = 'Reimbursement request created successfully.';
        this.submittingRemboursement = false;

        this.remboursementForm.reset({
          montant: 0,
          motif: ''
        });
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to create reimbursement request.';
        this.submittingRemboursement = false;
      }
    });
  }

  rembourserSinistre(sinistreId?: number): void {
    if (!sinistreId) return;

    const confirmed = confirm('Confirm reimbursement for this claim?');
    if (!confirmed) return;

    const payload: Remboursement = {
      montant: 0,
      statut: StatutRemboursement.EFFECTUE,
      motif: 'Insurance reimbursement approved.'
    };

    this.assuranceService.addRemboursement(sinistreId, payload).subscribe({
      next: () => {
        this.successMessage = 'Reimbursement completed. The customer has been notified by email.';
        this.loadSinistres();
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to reimburse this claim.';
      }
    });
  }

  detecterFraude(sinistreId?: number): void {
    if (!sinistreId) return;

    this.fraudeLoadings[sinistreId] = true;
    this.fraudeErrors[sinistreId] = '';
    delete this.fraudeResults[sinistreId];

    this.assuranceService.detectFraudeBySinistreAi(sinistreId).subscribe({
      next: (response) => {
        try {
          this.fraudeResults[sinistreId] =
            this.assuranceService.parseAiJson<AiFraudeResult>(response);
        } catch (error) {
          console.error('AI fraud response parsing error', error);
          this.fraudeErrors[sinistreId] = 'The AI fraud response could not be read.';
        }

        this.fraudeLoadings[sinistreId] = false;
      },
      error: (error) => {
        console.error('AI fraud detection error', error);

        this.fraudeErrors[sinistreId] =
          error?.error?.message ||
          'Unable to detect fraud risk.';

        this.fraudeLoadings[sinistreId] = false;
      }
    });
  }

  genererResumeSinistre(sinistreId?: number): void {
    if (!sinistreId) return;

    this.resumeLoadings[sinistreId] = true;
    this.resumeErrors[sinistreId] = '';
    this.resumeResults[sinistreId] = '';

    this.assuranceService.resumeSinistreAi(sinistreId).subscribe({
      next: (response) => {
        this.resumeResults[sinistreId] = response;
        this.resumeLoadings[sinistreId] = false;
      },
      error: (error) => {
        console.error('AI summary generation error', error);

        this.resumeErrors[sinistreId] =
          error?.error?.message ||
          'Unable to generate the AI summary.';

        this.resumeLoadings[sinistreId] = false;
      }
    });
  }

  verifierMeteoSinistre(sinistreId?: number): void {
    if (!sinistreId) return;

    this.weatherLoadings[sinistreId] = true;
    this.weatherErrors[sinistreId] = '';
    delete this.weatherResults[sinistreId];

    this.assuranceService.verifierMeteoBySinistre(sinistreId).subscribe({
      next: (result) => {
        this.weatherResults[sinistreId] = result;
        this.weatherLoadings[sinistreId] = false;
      },
      error: (error) => {
        console.error('Weather verification error', error);

        this.weatherErrors[sinistreId] =
          error?.error?.message ||
          'Unable to verify claim weather conditions.';

        this.weatherLoadings[sinistreId] = false;
      }
    });
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'ACCEPTE':
      case 'INDEMNISE':
        return 'badge-accepted';

      case 'DECLARE':
      case 'EN_COURS':
        return 'badge-progress';

      case 'REJETE':
        return 'badge-rejected';

      default:
        return 'badge-pending';
    }
  }

  getStatusLabel(status?: string): string {
    if (!status) return 'Unknown';
    return this.statusLabels[status] || status;
  }

  getTypeLabel(type?: string): string {
    if (!type) return 'Claim';
    return this.typeLabels[type] || type;
  }

  getDocumentTypeLabel(type?: string): string {
    if (!type) return 'Document';
    return this.typeDocumentLabels[type] || type;
  }

  getRiskLabel(risk?: string): string {
    switch (risk) {
      case 'FAIBLE':
        return 'Low';
      case 'MOYEN':
        return 'Medium';
      case 'ELEVE':
        return 'High';
      default:
        return risk || 'Unknown';
    }
  }

  getFraudeResult(sinistreId?: number): AiFraudeResult | null {
    if (!sinistreId) return null;
    return this.fraudeResults[sinistreId] || null;
  }

  getFraudeError(sinistreId?: number): string {
    if (!sinistreId) return '';
    return this.fraudeErrors[sinistreId] || '';
  }

  isFraudeLoading(sinistreId?: number): boolean {
    if (!sinistreId) return false;
    return !!this.fraudeLoadings[sinistreId];
  }

  getResumeResult(sinistreId?: number): string {
    if (!sinistreId) return '';
    return this.resumeResults[sinistreId] || '';
  }

  getResumeError(sinistreId?: number): string {
    if (!sinistreId) return '';
    return this.resumeErrors[sinistreId] || '';
  }

  isResumeLoading(sinistreId?: number): boolean {
    if (!sinistreId) return false;
    return !!this.resumeLoadings[sinistreId];
  }

  getWeatherResult(sinistreId?: number): WeatherVerificationResponse | null {
    if (!sinistreId) return null;
    return this.weatherResults[sinistreId] || null;
  }

  getWeatherError(sinistreId?: number): string {
    if (!sinistreId) return '';
    return this.weatherErrors[sinistreId] || '';
  }

  isWeatherLoading(sinistreId?: number): boolean {
    if (!sinistreId) return false;
    return !!this.weatherLoadings[sinistreId];
  }

  
}