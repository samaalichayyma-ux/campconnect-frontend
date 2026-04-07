import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Forum, ForumService } from '../forum.service';
import { Publication, PublicationAdminService } from '../../../admin/publication/publication-admin.service';

@Component({
  selector: 'app-forum-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forum-list.component.html',
  styleUrl: './forum-list.component.css'
})
export class ForumListComponent implements OnInit {
  forums: Forum[] = [];
  publications: Publication[] = [];

  constructor(
    private forumService: ForumService,
    private publicationService: PublicationAdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadForums();
    this.loadPublications();
  }

  loadForums(): void {
    this.forumService.getAll().subscribe({
      next: (data) => {
        this.forums = data;
      },
      error: (error) => {
        console.error('Erreur chargement forums :', error);
      }
    });
  }

  loadPublications(): void {
    this.publicationService.getAll().subscribe({
      next: (data) => {
        this.publications = data;
      },
      error: (error) => {
        console.error('Erreur chargement publications :', error);
      }
    });
  }

  goToCreate(): void {
    this.router.navigate(['/public/forums/create']);
  }

  goToEdit(id?: number): void {
    if (!id) return;
    this.router.navigate(['/public/forums/edit', id]);
  }

  deleteForum(id?: number): void {
    if (!id) return;
    this.forumService.delete(id).subscribe(() => {
      this.loadForums();
    });
  }

  goToPublicationEdit(id?: number): void {
    if (!id) return;
    this.router.navigate(['/public/publications/edit', id]);
  }

  deletePublication(id?: number): void {
    if (!id) return;
    this.publicationService.delete(id).subscribe(() => {
      this.loadPublications();
    });
  }
}