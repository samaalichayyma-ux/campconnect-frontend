import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PublicationAdminService } from '../../../admin/publication/publication-admin.service';

@Component({
  selector: 'app-publication-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publication-edit.component.html',
  styleUrl: './publication-edit.component.css'
})
export class PublicationEditComponent {

  publication: any = {};
  successMessage = '';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private publicationService: PublicationAdminService
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPublication(+id);
    }
  }

  loadPublication(id: number) {
    this.publicationService.getById(id).subscribe({
      next: (data) => this.publication = data,
      error: () => this.errorMessage = 'Erreur chargement'
    });
  }

  update() {
    this.publicationService.update(this.publication.id, this.publication).subscribe({
      next: () => this.successMessage = 'Modifié avec succès',
      error: () => this.errorMessage = 'Erreur modification'
    });
  }
}