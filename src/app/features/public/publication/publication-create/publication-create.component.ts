import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicationAdminService } from '../../../admin/publication/publication-admin.service';

@Component({
  selector: 'app-publication-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publication-create.component.html',
  styleUrl: './publication-create.component.css'
})
export class PublicationCreateComponent {
  contenu = '';
  successMessage = '';
  errorMessage = '';

  constructor(private publicationService: PublicationAdminService) {}

  create(): void {
    this.successMessage = '';
    this.errorMessage = '';

    const publication = {
      contenu: this.contenu
    };

    this.publicationService.create(publication).subscribe({
      next: () => {
        this.successMessage = 'Publication ajoutée avec succès.';
        this.contenu = '';
      },
      error: (error) => {
        console.error('Erreur création publication :', error);
        this.errorMessage = 'Impossible de créer la publication.';
      }
    });
  }
}