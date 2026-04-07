import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PublicationAdminService } from '../publication-admin.service';

@Component({
  selector: 'app-publication-admin-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publication-admin-edit.component.html',
  styleUrl: './publication-admin-edit.component.css'
})
export class PublicationAdminEditComponent {
  publication: any = {};

  constructor(
    private route: ActivatedRoute,
    private publicationService: PublicationAdminService
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPublication(+id);
    }
  }

  loadPublication(id: number): void {
    this.publicationService.getById(id).subscribe({
      next: (data) => {
        this.publication = data;
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  update(): void {
    this.publicationService.update(this.publication.id, this.publication).subscribe({
      next: () => {
        alert('Publication modifiée avec succès');
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
}