import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AssuranceService } from '../../../../core/services/assurance.service';
import { Sinistre, StatutSinistre, TYPE_SINISTRE_LABELS, TypeSinistre } from '../../../../core/models/assurance.models';

@Component({
  selector: 'app-sinistre-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './sinistre-form.component.html',
  styleUrls: ['./sinistre-form.component.css']
})
export class SinistreFormComponent implements OnInit {
  form!: FormGroup;
  souscriptionId!: number;
  submitting = false;
  successMessage = '';
  errorMessage = '';

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
  }

  initForm(): void {
    this.form = this.fb.group({
      typeSinistre: [TypeSinistre.ACCIDENT, Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      lieuIncident: ['', [Validators.required, Validators.minLength(3)]],
      montantEstime: [0, [Validators.required, Validators.min(0)]]
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

    const payload: Sinistre = {
      ...this.form.value,
      statut: StatutSinistre.DECLARE
    };

    this.submitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.assuranceService.addSinistre(this.souscriptionId, payload).subscribe({
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
}