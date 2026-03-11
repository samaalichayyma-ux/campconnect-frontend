import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { CampingService } from '../../../public/services/camping.service';
import { CampingSite } from '../../../public/models/camping-site.model';

@Component({
  selector: 'app-camping-site-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './camping-site-list.component.html',
  styleUrl: './camping-site-list.component.css'
})
export class CampingSiteListComponent implements OnInit {
  sites: CampingSite[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private campingService: CampingService) {}

  ngOnInit(): void {
    this.loadSites();
  }

  loadSites(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.campingService.getAllCampingSites().subscribe({
      next: (data) => {
        this.sites = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load camping sites.';
        this.isLoading = false;
        console.error(error);
      }
    });
  }

  deleteSite(idSite: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This camping site will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.campingService.deleteCampingSite(idSite).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Camping site deleted successfully.', 'success');
            this.loadSites();
          },
          error: (error) => {
            console.error(error);
            Swal.fire('Error', 'Failed to delete camping site.', 'error');
          }
        });
      }
    });
  }
}