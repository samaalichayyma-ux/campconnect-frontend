import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AssuranceService } from '../../../../core/services/assurance.service';
import {
  ReclamationLight,
  Sinistre,
  StatutSinistre,
  TYPE_SINISTRE_LABELS,
  TypeSinistre
} from '../../../../core/models/assurance.models';
import { WeatherVerificationResponse } from '../../../../core/models/assurance.models';

@Component({
  selector: 'app-sinistre-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './sinistre-form.component.html',
  styleUrls: ['./sinistre-form.component.scss']
})
export class SinistreFormComponent implements OnInit {
  form!: FormGroup;
  souscriptionId!: number;

  reclamations: ReclamationLight[] = [];

  submitting = false;
  successMessage = '';
  errorMessage = '';
  aiLoading = false;
aiResult = '';

weatherResult?: WeatherVerificationResponse;
weatherLoading = false;
weatherError = '';

  typeOptions = Object.values(TypeSinistre);
  typeLabels = TYPE_SINISTRE_LABELS;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private assuranceService: AssuranceService
  ) {}

  ngOnInit(): void {
    this.souscriptionId = Number(this.route.snapshot.queryParamMap.get('souscriptionId'));
    this.initForm();
    this.loadReclamations();
  }

  initForm(): void {
    this.form = this.fb.group({
      typeSinistre: [TypeSinistre.ACCIDENT, Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      lieuIncident: ['', [Validators.required, Validators.minLength(3)]],
      montantEstime: [0, [Validators.required, Validators.min(0)]],
      reclamationId: [null]
    });
  }

  loadReclamations(): void {
    this.assuranceService.getMyReclamations().subscribe({
      next: (data) => {
        this.reclamations = data;
      },
      error: (error) => {
        console.error(error);
        this.reclamations = [];
      }
    });
  }

  submit(): void {
    if (!this.souscriptionId) {
      this.errorMessage = 'Aucune souscription sélectionnée.';
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const reclamationId = this.form.value.reclamationId;

    const payload: Sinistre = {
      typeSinistre: this.form.value.typeSinistre,
      description: this.form.value.description,
      lieuIncident: this.form.value.lieuIncident,
      montantEstime: this.form.value.montantEstime,
      statut: StatutSinistre.EN_ATTENTE
    };

    this.submitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const request = reclamationId
      ? this.assuranceService.addSinistreFromReclamation(this.souscriptionId, Number(reclamationId), payload)
      : this.assuranceService.addSinistre(this.souscriptionId, payload);

    request.subscribe({
      next: () => {
        this.successMessage = 'Le sinistre a été déclaré avec succès.';
        this.submitting = false;
        setTimeout(() => this.router.navigate(['/public/assurances/mes-sinistres']), 1200);
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de déclarer le sinistre.';
        this.submitting = false;
      }
    });
  }

  analyserDescriptionAvecIA(): void {
  const description = this.form.value.description;

  if (!description || description.length < 10) {
    this.errorMessage = 'Veuillez écrire une description plus détaillée avant l’analyse IA.';
    return;
  }

  this.aiLoading = true;
  this.aiResult = '';
  this.errorMessage = '';

  this.assuranceService.analyseSinistreAi(description).subscribe({
    next: (result) => {
      this.aiResult = result;
      this.aiLoading = false;
    },
    error: (error) => {
      console.error(error);
      this.errorMessage = 'Impossible d’analyser le sinistre avec l’IA.';
      this.aiLoading = false;
    }
  });
}

verifierMeteoAvantDeclaration(): void {
  const lieu = this.form.get('lieuIncident')?.value;
  const date = this.form.get('dateDeclaration')?.value;
  const description = this.form.get('description')?.value;

  if (!lieu || !date || !description) {
    this.weatherError = 'Veuillez remplir le lieu, la date et la description avant la vérification météo.';
    return;
  }

  this.weatherLoading = true;
  this.weatherError = '';
  this.weatherResult = undefined;

  this.assuranceService.verifierMeteoSinistre({
    lieu,
    date,
    description
  }).subscribe({
    next: (result) => {
      this.weatherResult = result;
      this.weatherLoading = false;
    },
    error: (error) => {
      console.error('Erreur météo', error);
      this.weatherError =
        error?.error?.message ||
        'Impossible de vérifier la météo pour ce sinistre.';
      this.weatherLoading = false;
    }
  });
}
}