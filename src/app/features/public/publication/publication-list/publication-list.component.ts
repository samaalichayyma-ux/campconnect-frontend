import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Publication, PublicationAdminService } from '../../../admin/publication/publication-admin.service';

@Component({
  selector: 'app-publication-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publication-list.component.html',
  styleUrl: './publication-list.component.css'
})
export class PublicationListComponent implements OnInit {
  publications: Publication[] = [];

  constructor(
    private publicationService: PublicationAdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPublications();
  }

  loadPublications(): void {
    this.publicationService.getAll().subscribe({
      next: (data) => {
        this.publications = data;
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  like(id?: number): void {
    if (!id) return;

    this.publicationService.like(id).subscribe({
      next: () => this.loadPublications(),
      error: (error) => console.error(error)
    });
  }

  deletePublication(id?: number): void {
    if (!id) return;

    this.publicationService.delete(id).subscribe({
      next: () => this.loadPublications(),
      error: (error) => console.error(error)
    });
  }

  goToEdit(id?: number): void {
    if (!id) return;
    this.router.navigate(['/public/publications/edit', id]);
  }

  goToDetails(id?: number): void {
    if (!id) return;
    console.log('Publication détail id:', id);
  }
}