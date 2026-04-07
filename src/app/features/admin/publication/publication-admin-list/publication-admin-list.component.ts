import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Publication, PublicationAdminService } from '../publication-admin.service';

@Component({
  selector: 'app-publication-admin-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publication-admin-list.component.html',
  styleUrl: './publication-admin-list.component.css'
})
export class PublicationAdminListComponent implements OnInit {
  publications: Publication[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private publicationService: PublicationAdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPublications();
  }

  loadPublications(): void {
    this.loading = true;
    this.errorMessage = '';

    this.publicationService.getAll().subscribe({
      next: (data) => {
        this.publications = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement publications :', error);
        this.errorMessage = 'Impossible de charger les publications.';
        this.loading = false;
      }
    });
  }

  deletePublication(id?: number): void {
    if (!id) return;

    this.publicationService.delete(id).subscribe({
      next: () => this.loadPublications(),
      error: (error) => {
        console.error('Erreur suppression publication :', error);
        this.errorMessage = 'Erreur suppression.';
      }
    });
  }

  goToEdit(id?: number): void {
    if (!id) return;
    this.router.navigate(['/admin/publication/edit', id]);
  }
}