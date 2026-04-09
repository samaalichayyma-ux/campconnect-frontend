import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { buildAutoCloseAlert } from '../../../../core/utils/auto-close-alert.util';
import { CampingService } from '../../../public/services/camping.service';
import { CampingNavbarComponent } from '../camping-navbar/camping-navbar.component';
import { CampingSiteCreatePayload } from '../models/camping-site-create.model';

@Component({
  selector: 'app-camping-site-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CampingNavbarComponent],
  templateUrl: './camping-site-create.component.html',
  styleUrl: './camping-site-create.component.css'
})
export class CampingSiteCreateComponent {
  constructor(
    private campingService: CampingService,
    private router: Router
  ) {}

  selectedFile: File | null = null;

  site: CampingSiteCreatePayload = {
    nom: '',
    localisation: '',
    capacite: 1,
    prixParNuit: 0,
    description: '',
    statutDispo: 'AVAILABLE'
  };

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit(): void {
    if (!this.selectedFile) {
      void Swal.fire(buildAutoCloseAlert('error', 'Error', 'Please select an image.'));
      return;
    }

    const formData = new FormData();
    formData.append('nom', this.site.nom);
    formData.append('localisation', this.site.localisation);
    formData.append('capacite', this.site.capacite.toString());
    formData.append('prixParNuit', this.site.prixParNuit.toString());
    formData.append('description', this.site.description);
    formData.append('statutDispo', this.site.statutDispo);
    formData.append('image', this.selectedFile);

    this.campingService.addCampingSite(formData).subscribe({
      next: () => {
        void Swal.fire(buildAutoCloseAlert('success', 'Success', 'Camping site added successfully.'))
          .then(() => {
            this.router.navigate(['/admin/camping-sites']);
          });
      },
      error: (error) => {
        console.error('Error:', error);
        void Swal.fire(
          buildAutoCloseAlert('error', 'Error', error?.error?.message || 'Failed to add camping site.')
        );
      }
    });
  }
}
