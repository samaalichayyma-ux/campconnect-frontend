import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { buildAutoCloseAlert } from '../../../../core/utils/auto-close-alert.util';
import { CampingService } from '../../../public/services/camping.service';
import { CampingNavbarComponent } from '../camping-navbar/camping-navbar.component';
import { CampingSite } from '../../../public/models/camping-site.model';
import { CampingSiteCreatePayload } from '../models/camping-site-create.model';

@Component({
  selector: 'app-camping-site-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CampingNavbarComponent],
  templateUrl: './camping-site-edit.component.html',
  styleUrl: './camping-site-edit.component.css'
})
export class CampingSiteEditComponent implements OnInit {
  siteId!: number;
  isLoading = false;
  errorMessage = '';

  selectedFile: File | null = null;
  currentImageUrl = '';

  site: CampingSiteCreatePayload = {
    nom: '',
    localisation: '',
    capacite: 1,
    prixParNuit: 0,
    description: '',
    statutDispo: 'AVAILABLE'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campingService: CampingService
  ) {}

  ngOnInit(): void {
    this.siteId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSite();
  }

  loadSite(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.campingService.getCampingSiteById(this.siteId).subscribe({
      next: (data: CampingSite) => {
        this.site = {
          nom: data.nom,
          localisation: data.localisation,
          capacite: data.capacite,
          prixParNuit: data.prixParNuit,
          description: data.description || '',
          statutDispo: data.statutDispo
        };

        this.currentImageUrl = data.imageUrl || '';
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Failed to load camping site.';
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit(): void {
    const formData = new FormData();

    formData.append('nom', this.site.nom);
    formData.append('localisation', this.site.localisation);
    formData.append('capacite', this.site.capacite.toString());
    formData.append('prixParNuit', this.site.prixParNuit.toString());
    formData.append('description', this.site.description);
    formData.append('statutDispo', this.site.statutDispo);

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.campingService.updateCampingSite(this.siteId, formData).subscribe({
      next: () => {
        void Swal.fire(buildAutoCloseAlert('success', 'Updated!', 'Camping site updated successfully.'))
          .then(() => {
            this.router.navigate(['/admin/camping-sites']);
          });
      },
      error: (error) => {
        console.error('Update error:', error);

        void Swal.fire(
          buildAutoCloseAlert('error', 'Error', error?.error?.message || 'Failed to update camping site.')
        );
      }
    });
  }
}
