import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampingNavbarComponent } from '../camping-navbar/camping-navbar.component';
import { CampingSite } from '../../../public/models/camping-site.model';
import { CampingService } from '../../../public/services/camping.service';

@Component({
  selector: 'app-admin-camping-site-details',
  standalone: true,
  imports: [CommonModule, RouterLink, CampingNavbarComponent],
  templateUrl: './admin-camping-site-details.component.html',
  styleUrl: './admin-camping-site-details.component.css'
})
export class AdminCampingSiteDetailsComponent implements OnInit {
  site: CampingSite | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private campingSiteService: CampingService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.isLoading = false;
      this.errorMessage = 'Invalid camping site ID.';
      return;
    }

    this.loadSite(id);
  }

  loadSite(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.campingSiteService.getCampingSiteById(id).subscribe({
      next: (res) => {
        this.site = res;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load camping site details.';
        this.isLoading = false;
      }
    });
  }
}