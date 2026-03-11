import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { CampingService } from '../../../public/services/camping.service';
import { CampingSite } from '../../../public/models/camping-site.model';

@Component({
  selector: 'app-camping-site-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './camping-site-edit.component.html',
  styleUrl: './camping-site-edit.component.css'
})
export class CampingSiteEditComponent implements OnInit {

  siteId!: number;
  site!: CampingSite;
  isLoading = false;
  errorMessage = '';

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

    this.campingService.getCampingSiteById(this.siteId).subscribe({
      next: (data) => {
        this.site = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Failed to load camping site.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {

    this.campingService.updateCampingSite(this.siteId, this.site).subscribe({
      next: () => {
        Swal.fire(
          'Updated!',
          'Camping site updated successfully.',
          'success'
        );

        this.router.navigate(['/admin/camping-sites']);
      },
      error: (error) => {
        console.error(error);

        Swal.fire(
          'Error',
          'Failed to update camping site.',
          'error'
        );
      }
    });

  }

}