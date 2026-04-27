import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AssuranceService } from '../../../../core/services/assurance.service';
import {
  Sinistre,
  DocumentAssurance,
  Remboursement,
  StatutSinistre,
  TYPE_SINISTRE_LABELS,
  STATUT_SINISTRE_LABELS,
  TYPE_DOCUMENT_ASSURANCE_LABELS,
  StatutRemboursement
} from '../../../../core/models/assurance.models';

@Component({
  selector: 'app-sinistres-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './sinistres-admin.component.html',
  styleUrls: ['./sinistres-admin.component.css']
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

  readonly statusOptions = Object.values(StatutSinistre);
  readonly statusLabels = STATUT_SINISTRE_LABELS;
  readonly typeLabels = TYPE_SINISTRE_LABELS;
  readonly typeDocumentLabels = TYPE_DOCUMENT_ASSURANCE_LABELS;

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

    this.assuranceService.getAllSinistres().subscribe({
      next: (data) => {
        this.sinistres = data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de charger les sinistres.';
        this.loading = false;
      }
    });
  }

  updateSinistreStatus(sinistre: Sinistre, statut: StatutSinistre): void {
    const payload: Sinistre = { ...sinistre, statut };

    this.assuranceService.updateSinistre(payload).subscribe({
      next: () => {
        sinistre.statut = statut;
        this.successMessage = 'Statut du sinistre mis à jour.';
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de modifier le statut.';
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
        this.errorMessage = 'Impossible de charger les documents.';
        this.documentsLoading = false;
      }
    });
  }

  deleteDocument(id?: number): void {
    if (!id) return;

    const confirmed = confirm('Supprimer ce document ?');
    if (!confirmed) return;

    this.assuranceService.deleteDocumentAssurance(id).subscribe({
      next: () => {
        this.successMessage = 'Document supprimé.';
        if (this.selectedSinistreId) {
          this.openDocuments(this.selectedSinistreId);
        }
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de supprimer le document.';
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
        this.successMessage = 'Remboursement créé avec succès.';
        this.submittingRemboursement = false;
        this.remboursementForm.reset({
          montant: 0,
          motif: ''
        });
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible d’ajouter le remboursement.';
        this.submittingRemboursement = false;
      }
    });
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'ACCEPTE':
      case 'INDEMNISE':
        return 'badge-accepte';
      case 'DECLARE':
      case 'EN_COURS':
        return 'badge-en-cours';
      case 'REJETE':
        return 'badge-rejete';
      default:
        return 'badge-pending';
    }
  }
}