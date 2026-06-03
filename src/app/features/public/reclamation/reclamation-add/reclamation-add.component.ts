import { Component } from '@angular/core';
import { ReclamationService } from '../reclamation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reclamation-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reclamation-add.component.html',
  styleUrl: './reclamation-add.component.css'
})
export class ReclamationAddComponent {

  description = '';
  acceptationDeclaration = false;
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;
  submitted = false;
  showDeclaration = false;

  constructor(
    private reclamationService: ReclamationService,
    private authService: AuthService,
    private router: Router
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (this.imagePreview) {
      URL.revokeObjectURL(this.imagePreview);
      this.imagePreview = null;
    }

    if (!file) {
      this.selectedImageFile = null;
      return;
    }

    if (file.size > 5_000_000) {
      alert("L'image doit faire moins de 5 Mo");
      return;
    }

    this.selectedImageFile = file;
    this.imagePreview = URL.createObjectURL(file);
  }

  save() {
    this.submitted = true;

    if (!this.description.trim()) {
      alert('Veuillez saisir la description.');
      return;
    }

    if (!this.acceptationDeclaration) {
      alert('Vous devez accepter le traitement des données personnelles.');
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) {
      alert('Vous devez être connecté.');
      return;
    }

    const formData = new FormData();
    formData.append('description', this.description);
    formData.append('acceptationDeclaration', String(this.acceptationDeclaration));
    formData.append('utilisateurId', String(userId));

    if (this.selectedImageFile) {
      formData.append('image', this.selectedImageFile);
    }

    this.reclamationService.create(formData).subscribe({
      next: () => {
        alert('Réclamation ajoutée avec succès ✅');
        this.router.navigate(['/public/reclamation']);
      },
      error: () => {
        alert('Erreur lors de l\'ajout ❌');
      }
    });
  }

  ouvrirDeclaration() { this.showDeclaration = true; }
  fermerDeclaration() { this.showDeclaration = false; }
}