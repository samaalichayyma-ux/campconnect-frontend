import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AssuranceService } from '../../../../core/services/assurance.service';
import { Garantie } from '../../../../core/models/assurance.models';

@Component({
  selector: 'app-garanties-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './garanties-admin.component.html',
  styleUrls: ['./garanties-admin.component.css']
})
export class GarantiesAdminComponent implements OnInit {
  assuranceId!: number;
  garanties: Garantie[] = [];
  form!: FormGroup;

  loading = false;
  submitting = false;
  editingId: number | null = null;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private assuranceService: AssuranceService
  ) {}

  ngOnInit(): void {
    this.assuranceId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.loadGaranties();
  }

  initForm(): void {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      plafond: [0, [Validators.required, Validators.min(0)]],
      franchise: [0, [Validators.required, Validators.min(0)]]
    });
  }

  loadGaranties(): void {
    this.loading = true;
    this.errorMessage = '';

    this.assuranceService.getGarantiesByAssurance(this.assuranceId).subscribe({
      next: (data) => {
        this.garanties = data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de charger les garanties.';
        this.loading = false;
      }
    });
  }

  editGarantie(garantie: Garantie): void {
    this.editingId = garantie.id ?? null;
    this.form.patchValue({
      nom: garantie.nom,
      description: garantie.description,
      plafond: garantie.plafond,
      franchise: garantie.franchise
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm(): void {
    this.editingId = null;
    this.successMessage = '';
    this.errorMessage = '';
    this.form.reset({
      nom: '',
      description: '',
      plafond: 0,
      franchise: 0
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: Garantie = {
      id: this.editingId ?? undefined,
      ...this.form.value
    };

    const request = this.editingId
      ? this.assuranceService.updateGarantie(payload)
      : this.assuranceService.addGarantie(this.assuranceId, payload);

    request.subscribe({
      next: () => {
        this.successMessage = this.editingId
          ? 'Garantie modifiée avec succès.'
          : 'Garantie ajoutée avec succès.';
        this.submitting = false;
        this.resetForm();
        this.loadGaranties();
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible d’enregistrer cette garantie.';
        this.submitting = false;
      }
    });
  }

  deleteGarantie(id?: number): void {
    if (!id) return;

    const confirmed = confirm('Supprimer cette garantie ?');
    if (!confirmed) return;

    this.assuranceService.deleteGarantie(id).subscribe({
      next: () => this.loadGaranties(),
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Suppression impossible.';
      }
    });
  }
}