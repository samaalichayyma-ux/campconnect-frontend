import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AssuranceService } from '../../../../core/services/assurance.service';
import {
  Assurance,
  TypeAssurance
} from '../../../../core/models/assurance.models';

@Component({
  selector: 'app-assurance-form-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './assurance-form-admin.component.html',
  styleUrls: ['./assurance-form-admin.component.scss']
})
export class AssuranceFormAdminComponent implements OnInit {
  form!: FormGroup;
  assuranceId: number | null = null;
  isEditMode = false;

  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  readonly typeOptions = Object.values(TypeAssurance);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private assuranceService: AssuranceService
  ) {}

  ngOnInit(): void {
    this.initForm();

    const idParam = this.route.snapshot.paramMap.get('id');
    this.assuranceId = idParam ? Number(idParam) : null;
    this.isEditMode = !!this.assuranceId;

    if (this.isEditMode && this.assuranceId) {
      this.loadAssurance(this.assuranceId);
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      typeAssurance: [TypeAssurance.ACCIDENT, Validators.required],
      montantCouverture: [0, [Validators.required, Validators.min(0)]],
      prime: [0, [Validators.required, Validators.min(0)]],
      dureeValidite: [30, [Validators.required, Validators.min(1)]],
      conditionsGenerales: ['', [Validators.required, Validators.minLength(10)]],
      active: [true]
    });
  }

  loadAssurance(id: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.assuranceService.getAssuranceById(id).subscribe({
      next: (assurance) => {
        this.form.patchValue(assurance);
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to load this insurance offer.';
        this.loading = false;
      }
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

    const payload: Assurance = {
      ...(this.isEditMode ? { id: this.assuranceId! } : {}),
      ...this.form.value
    };

    const request = this.isEditMode
      ? this.assuranceService.updateAssurance(payload)
      : this.assuranceService.addAssurance(payload);

    request.subscribe({
      next: () => {
        this.successMessage = this.isEditMode
          ? 'Insurance offer updated successfully.'
          : 'Insurance offer created successfully.';

        this.submitting = false;

        setTimeout(() => {
          this.router.navigate(['/admin/assurances']);
        }, 1000);
      },
      error: (error) => {
        console.error(error);

        this.errorMessage = this.isEditMode
          ? 'Unable to update this insurance offer.'
          : 'Unable to create this insurance offer.';

        this.submitting = false;
      }
    });
  }

  getTypeLabel(type?: string): string {
    switch (type) {
      case 'ANNULATION':
        return 'Cancellation';
      case 'ACCIDENT':
        return 'Accident';
      case 'RESPONSABILITE_CIVILE':
        return 'Civil Liability';
      case 'VOL_EQUIPEMENT':
        return 'Equipment Theft';
      case 'DOMMAGE_MATERIEL':
        return 'Material Damage';
      case 'ASSISTANCE_VOYAGE':
        return 'Travel Assistance';
      default:
        return type || 'Insurance';
    }
  }

  get f() {
    return this.form.controls;
  }
}