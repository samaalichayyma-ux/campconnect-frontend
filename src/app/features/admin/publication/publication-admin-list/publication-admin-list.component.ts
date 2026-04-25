import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Publication, PublicationAdminService } from '../publication-admin.service';

interface PublicationAdminStats {
  totalPublications: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  averageLikes: number;
  averageViews: number;
  topLikedTitle: string;
  topLikedCount: number;
  topViewedTitle: string;
  topViewedCount: number;
  topCommentedTitle: string;
  topCommentedCount: number;
  mostActiveAuthorEmail: string;
  mostActiveAuthorCount: number;
  newestPublisherEmail: string;
  newestPublicationDate: string;
}

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

  stats: PublicationAdminStats = {
    totalPublications: 0,
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0,
    averageLikes: 0,
    averageViews: 0,
    topLikedTitle: '-',
    topLikedCount: 0,
    topViewedTitle: '-',
    topViewedCount: 0,
    topCommentedTitle: '-',
    topCommentedCount: 0,
    mostActiveAuthorEmail: '-',
    mostActiveAuthorCount: 0,
    newestPublisherEmail: '-',
    newestPublicationDate: '-'
  };

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
        this.publications = data || [];
        this.computeStats();
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

  getPublicationTitle(publication?: Publication): string {
    if (!publication) {
      return '-';
    }

    const title = (publication.titre || '').trim();
    if (title) {
      return title;
    }

    const content = (publication.contenu || '').trim();
    if (!content) {
      return 'Publication';
    }

    return content.length > 90 ? `${content.slice(0, 90).trim()}...` : content;
  }

  formatPublicationDate(value: string): string {
    const time = this.toDateTime(value);
    if (!time) {
      return '-';
    }
    return new Date(time).toLocaleString();
  }

  private computeStats(): void {
    const publications = this.publications || [];
    const totalPublications = publications.length;
    const totalLikes = publications.reduce((sum, publication) => sum + (publication.likesCount || 0), 0);
    const totalViews = publications.reduce((sum, publication) => sum + (publication.vuesCount || 0), 0);
    const totalComments = publications.reduce((sum, publication) => sum + (publication.commentairesCount || 0), 0);

    const averageLikes = totalPublications > 0 ? totalLikes / totalPublications : 0;
    const averageViews = totalPublications > 0 ? totalViews / totalPublications : 0;

    const topLiked = [...publications].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))[0];
    const topViewed = [...publications].sort((a, b) => (b.vuesCount || 0) - (a.vuesCount || 0))[0];
    const topCommented = [...publications].sort((a, b) => (b.commentairesCount || 0) - (a.commentairesCount || 0))[0];

    const authors = publications
      .map((publication) => (publication.auteurEmail || '').trim().toLowerCase())
      .filter((email) => !!email);
    const authorCounts = authors.reduce<Record<string, number>>((acc, email) => {
      acc[email] = (acc[email] || 0) + 1;
      return acc;
    }, {});

    const mostActiveAuthor = Object.entries(authorCounts).sort((left, right) => right[1] - left[1])[0];
    const newestPublication = [...publications].sort(
      (left, right) => this.toDateTime(right.dateCreation) - this.toDateTime(left.dateCreation)
    )[0];

    this.stats = {
      totalPublications,
      totalLikes,
      totalViews,
      totalComments,
      averageLikes,
      averageViews,
      topLikedTitle: this.getPublicationTitle(topLiked),
      topLikedCount: topLiked?.likesCount || 0,
      topViewedTitle: this.getPublicationTitle(topViewed),
      topViewedCount: topViewed?.vuesCount || 0,
      topCommentedTitle: this.getPublicationTitle(topCommented),
      topCommentedCount: topCommented?.commentairesCount || 0,
      mostActiveAuthorEmail: mostActiveAuthor?.[0] || '-',
      mostActiveAuthorCount: mostActiveAuthor?.[1] || 0,
      newestPublisherEmail: (newestPublication?.auteurEmail || '').trim() || '-',
      newestPublicationDate: newestPublication?.dateCreation || ''
    };
  }

  private toDateTime(value?: string): number {
    if (!value) {
      return 0;
    }
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
