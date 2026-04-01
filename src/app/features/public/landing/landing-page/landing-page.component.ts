import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CampingService } from '../../services/camping.service';
import { CampingSite } from '../../models/camping-site.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LandingPageComponent implements OnInit {
  latestSites: CampingSite[] = [];
  isLoading = false;

  constructor(
    public authService: AuthService,
    private campingService: CampingService
  ) {}

  ngOnInit() {
    this.loadLatestSites();
  }

  loadLatestSites(): void {
    this.isLoading = true;

    this.campingService.getAllCampingSites().subscribe({
      next: (sites) => {
        this.latestSites = sites.slice(-3).reverse();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading latest sites', error);
        this.isLoading = false;
      }
    });
  }
}
