import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LivraisonService } from '../../../../core/services/livraison.service';
import { LivraisonCreateRequest, TypeCommandeLivraison } from '../../../../models/livraison.model';

@Component({
  selector: 'app-create-livraison',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-livraison.component.html',
  styleUrl: './create-livraison.component.css'
})
export class CreateLivraisonComponent {
  private fb = inject(FormBuilder);
  private livraisonService = inject(LivraisonService);

  loading = false;
  successMessage = '';
  errorMessage = '';

  typeOptions: TypeCommandeLivraison[] = ['CLASSIQUE', 'REPAS'];

  form = this.fb.group({
    commandeId: [null as number | null, [Validators.required, Validators.min(1)]],
    typeCommande: ['CLASSIQUE' as TypeCommandeLivraison, Validators.required],
    adresseLivraison: ['', [Validators.required, Validators.minLength(3)]],
    commentaire: ['']
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload: LivraisonCreateRequest = {
      commandeId: this.form.value.commandeId!,
      typeCommande: this.form.value.typeCommande!,
      adresseLivraison: this.form.value.adresseLivraison!,
      commentaire: this.form.value.commentaire || ''
    };

    this.livraisonService.createLivraison(payload).subscribe({
      next: (response) => {
        this.successMessage = `Delivery created successfully (ID: ${response.idLivraison})`;
        this.form.reset({
          commandeId: null,
          typeCommande: 'CLASSIQUE',
          adresseLivraison: '',
          commentaire: ''
        });
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while creating delivery';
        this.loading = false;
      }
    });
  }

  isInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }
}