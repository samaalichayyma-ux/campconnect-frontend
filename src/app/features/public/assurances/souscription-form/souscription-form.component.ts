import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AssuranceService } from '../../../../core/services/assurance.service';
import { Assurance, SouscriptionAssurance, StatutSouscription, TYPE_ASSURANCE_LABELS } from '../../../../core/models/assurance.models';


@Component({
  selector: 'app-souscription-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './souscription-form.component.html',
  styleUrls: ['./souscription-form.component.css']
})
export class SouscriptionFormComponent implements OnInit {
  form!: FormGroup;
  assuranceId!: number;
  assurance?: Assurance;

  loading = false;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  readonly typeLabels = TYPE_ASSURANCE_LABELS;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private assuranceService: AssuranceService
  ) {}

  ngOnInit(): void {
    this.assuranceId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.loadAssurance();
  }

  initForm(): void {
    this.form = this.fb.group({
      numeroContrat: ['', [Validators.required, Validators.minLength(4)]],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      montantPaye: [0, [Validators.required, Validators.min(0)]],
      beneficiaireNom: ['', [Validators.required, Validators.minLength(2)]],
      beneficiaireTelephone: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  loadAssurance(): void {
    this.loading = true;

    this.assuranceService.getAssuranceById(this.assuranceId).subscribe({
      next: (assurance) => {
        this.assurance = assurance;
        this.form.patchValue({
          montantPaye: assurance.prime
        });
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de charger l’assurance.';
        this.loading = false;
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: SouscriptionAssurance = {
      ...this.form.value,
      statut: StatutSouscription.EN_ATTENTE
    };

    this.submitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.assuranceService.addSouscription(this.assuranceId, payload).subscribe({
      next: () => {
        this.successMessage = 'Votre demande de souscription a été enregistrée avec succès.';
        this.submitting = false;
        setTimeout(() => this.router.navigate(['/public/assurances/mes-souscriptions']), 1200);
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Échec de la souscription. Veuillez réessayer.';
        this.submitting = false;
      }
    });
  }

  get f() {
    return this.form.controls;
  }
}