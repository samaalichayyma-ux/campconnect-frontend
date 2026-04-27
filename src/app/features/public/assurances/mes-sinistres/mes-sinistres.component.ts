import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AssuranceService } from '../../../../core/services/assurance.service';
import {
  Sinistre,
  DocumentAssurance,
  STATUT_SINISTRE_LABELS,
  TYPE_SINISTRE_LABELS,
  TypeDocumentAssurance,
  TYPE_DOCUMENT_ASSURANCE_LABELS
} from '../../../../core/models/assurance.models';

@Component({
  selector: 'app-mes-sinistres',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './mes-sinistres.component.html',
  styleUrls: ['./mes-sinistres.component.css']
})
export class MesSinistresComponent implements OnInit {
  sinistres: Sinistre[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  selectedSinistreId: number | null = null;
  documents: DocumentAssurance[] = [];
  documentsLoading = false;
  submittingDocument = false;

  documentForm!: FormGroup;

  readonly statusLabels = STATUT_SINISTRE_LABELS;
  readonly typeLabels = TYPE_SINISTRE_LABELS;
  readonly typeDocumentOptions = Object.values(TypeDocumentAssurance);
  readonly typeDocumentLabels = TYPE_DOCUMENT_ASSURANCE_LABELS;

  constructor(
    private assuranceService: AssuranceService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSinistres();
  }

  initForm(): void {
    this.documentForm = this.fb.group({
      nomFichier: ['', Validators.required],
      typeDocument: [TypeDocumentAssurance.JUSTIFICATIF, Validators.required],
      url: ['', Validators.required]
    });
  }

  loadSinistres(): void {
    this.loading = true;
    this.errorMessage = '';

    this.assuranceService.getMySinistres().subscribe({
      next: (data) => {
        this.sinistres = data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de charger vos sinistres.';
        this.loading = false;
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
    this.errorMessage = '';
    this.successMessage = '';

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

  addDocument(): void {
    if (!this.selectedSinistreId) return;

    if (this.documentForm.invalid) {
      this.documentForm.markAllAsTouched();
      return;
    }

    this.submittingDocument = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.assuranceService.addDocumentAssurance(this.selectedSinistreId, this.documentForm.value).subscribe({
      next: () => {
        this.successMessage = 'Document ajouté avec succès.';
        this.submittingDocument = false;

        this.documentForm.reset({
          nomFichier: '',
          typeDocument: TypeDocumentAssurance.JUSTIFICATIF,
          url: ''
        });

        this.openDocuments(this.selectedSinistreId!);
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible d’ajouter le document.';
        this.submittingDocument = false;
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