import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CampingSite } from '../models/camping-site.model';
import { CampingService } from '../services/camping.service';
import { AddAvisComponent } from '../avis/add-avis/add-avis.component';
import { AvisListComponent } from '../avis/avis-list/avis-list.component';

@Component({
  selector: 'app-camping-sites',
  standalone: true,
  imports: [CommonModule, RouterModule, AvisListComponent, AddAvisComponent],
  templateUrl: './camping-sites.component.html',
  styleUrl: './camping-sites.component.css'
})
export class CampingSitesComponent implements OnInit {
  sites: CampingSite[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private campingService: CampingService) {}

  ngOnInit(): void {
    this.loadCampingSites();
  }

  loadCampingSites(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.campingService.getAllCampingSites().subscribe({
      next: (data) => {
        this.sites = data;
        this.isLoading = false;
        console.log('Camping sites loaded:', data);
      },
      error: (error) => {
        this.errorMessage = 'Failed to load camping sites.';
        this.isLoading = false;
        console.error('Error loading camping sites:', error);
      }
    });
  }
}