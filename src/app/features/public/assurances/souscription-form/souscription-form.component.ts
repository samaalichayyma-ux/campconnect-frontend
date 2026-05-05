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

  /*initForm(): void {
    this.form = this.fb.group({
      numeroContrat: ['', [Validators.required, Validators.minLength(4)]],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      montantPaye: [0, [Validators.required, Validators.min(0)]],
      beneficiaireNom: ['', [Validators.required, Validators.minLength(2)]],
      beneficiaireTelephone: ['', [Validators.required, Validators.minLength(8)]]
    });
  }*/

    initForm(): void {
  this.form = this.fb.group({
    dateDebut: ['', Validators.required],
    beneficiaireNom: ['', [Validators.required, Validators.minLength(2)]],
    beneficiaireTelephone: ['', [Validators.required, Validators.minLength(8)]]
  });
}

  loadAssurance(): void {
    this.loading = true;

    this.assuranceService.getAssuranceById(this.assuranceId).subscribe({
      next: (assurance) => {
        this.assurance = assurance;
       
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
    numeroContrat: '',
    dateDebut: this.form.value.dateDebut,
    dateFin: '',
    montantPaye: 0,
    beneficiaireNom: this.form.value.beneficiaireNom,
    beneficiaireTelephone: this.form.value.beneficiaireTelephone,
    statut: StatutSouscription.EN_ATTENTE
  };

  this.submitting = true;
  this.successMessage = '';
  this.errorMessage = '';

  this.assuranceService.addSouscription(this.assuranceId, payload).subscribe({
    next: (souscription) => {
      if (!souscription.id) {
        this.errorMessage = 'Souscription créée, mais identifiant introuvable.';
        this.submitting = false;
        return;
      }

      this.assuranceService.createAssuranceCheckoutSession(souscription.id).subscribe({
        next: (checkout) => {
          window.location.href = checkout.checkoutUrl;
        },
        error: (error) => {
          console.error(error);
          this.errorMessage = 'Souscription créée, mais impossible de lancer le paiement.';
          this.submitting = false;
        }
      });
    },
    error: (error) => {
      console.error(error);
      this.errorMessage =
        error?.error?.message ||
        'Échec de la souscription. Vérifiez que vous n’avez pas déjà une assurance active.';
      this.submitting = false;
    }
  });
}

  get f() {
    return this.form.controls;
  }
}