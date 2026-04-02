import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CampingService } from '../../../public/services/camping.service';
import { CampingSite } from '../../../public/models/camping-site.model';

@Component({
  selector: 'app-camping-site-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './camping-site-create.component.html',
  styleUrl: './camping-site-create.component.css'
})
export class CampingSiteCreateComponent {
  site: CampingSite = {
    idSite: 0,
    nom: '',
    localisation: '',
    capacite: 1,
    prixParNuit: 0,
    statutDispo: 'AVAILABLE'
  };

  constructor(
    private campingService: CampingService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.campingService.addCampingSite(this.site).subscribe({
      next: () => {
        Swal.fire('Success', 'Camping site added successfully.', 'success');
        this.router.navigate(['/admin/camping-sites']);
      },
      error: (error) => {
        console.error(error);
        Swal.fire('Error', 'Failed to add camping site.', 'error');
      }
    });
  }
}