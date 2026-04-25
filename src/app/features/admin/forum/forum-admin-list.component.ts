import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Forum, ForumService } from '../../public/forum/services/forum.service';
import { forkJoin } from 'rxjs';
import { Publication, PublicationAdminService } from '../publication/publication-admin.service';

interface ForumAdminStats {
  totalForums: number;
  totalPublications: number;
  averagePublicationsPerForum: number;
  forumsWithoutPublications: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  mostActiveForumName: string;
  mostActiveForumCount: number;
  mostActiveAuthorEmail: string;
  mostActiveAuthorCount: number;
  newestPublisherEmail: string;
  newestPublicationDate: string;
  topLikedPublicationTitle: string;
  topLikedPublicationCount: number;
  topViewedPublicationTitle: string;
  topViewedPublicationCount: number;
  topCommentedPublicationTitle: string;
  topCommentedPublicationCount: number;
}

@Component({
  selector: 'app-forum-admin-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './forum-admin-list.component.html',
  styleUrl: './forum-admin-list.component.css'
})
export class ForumAdminListComponent implements OnInit {
  forums: Forum[] = [];
  publications: Publication[] = [];
  loading = false;
  error = '';
  forumPublicationCounts: Record<number, number> = {};

  stats: ForumAdminStats = {
    totalForums: 0,
    totalPublications: 0,
    averagePublicationsPerForum: 0,
    forumsWithoutPublications: 0,
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0,
    mostActiveForumName: '-',
    mostActiveForumCount: 0,
    mostActiveAuthorEmail: '-',
    mostActiveAuthorCount: 0,
    newestPublisherEmail: '-',
    newestPublicationDate: '-',
    topLikedPublicationTitle: '-',
    topLikedPublicationCount: 0,
    topViewedPublicationTitle: '-',
    topViewedPublicationCount: 0,
    topCommentedPublicationTitle: '-',
    topCommentedPublicationCount: 0
  };

  constructor(
    private forumService: ForumService,
    private publicationAdminService: PublicationAdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      forums: this.forumService.getAll(),
      publications: this.publicationAdminService.getAll()
    }).subscribe({
      next: ({ forums, publications }) => {
        this.forums = forums || [];
        this.publications = publications || [];
        this.computeStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement admin forums/publications :', err);
        this.error = 'Impossible de charger les statistiques des forums.';
        this.loading = false;
      }
    });
  }

  editForum(id?: number): void {
    if (!id) return;
    this.router.navigate(['/public/forums/edit', id]);
  }

  deleteForum(id?: number): void {
    if (!id) return;
    if (!confirm('Supprimer ce forum ?')) return;

    this.forumService.deleteForum(id).subscribe({
      next: () => this.loadData(),
      error: (err) => console.error('Erreur suppression forum :', err)
    });
  }

  openForum(id?: number): void {
    if (!id) return;
    this.router.navigate(['/public/forums', id, 'publications']);
  }

  getPublicationCountForForum(id?: number): number {
    if (!id) return 0;
    return this.forumPublicationCounts[id] || 0;
  }

  private computeStats(): void {
    const forums = this.forums || [];
    const publications = this.publications || [];

    const publicationCounts: Record<number, number> = {};

    publications.forEach((publication) => {
      const forumId = this.resolveForumId(publication);
      if (!forumId) return;

      publicationCounts[forumId] = (publicationCounts[forumId] || 0) + 1;
    });

    this.forumPublicationCounts = publicationCounts;

    const totalForums = forums.length;
    const totalPublications = publications.length;
    const averagePublicationsPerForum = totalForums > 0 ? totalPublications / totalForums : 0;
    const forumsWithoutPublications = forums.filter((forum) => (publicationCounts[forum.id || 0] || 0) === 0).length;
    const totalLikes = publications.reduce((sum, publication) => sum + (publication.likesCount || 0), 0);
    const totalViews = publications.reduce((sum, publication) => sum + (publication.vuesCount || 0), 0);
    const totalComments = publications.reduce((sum, publication) => sum + (publication.commentairesCount || 0), 0);

    const mostActiveForum = forums
      .map((forum) => ({
        name: forum.nom,
        count: publicationCounts[forum.id || 0] || 0
      }))
      .sort((a, b) => b.count - a.count)[0];

    const topLikedPublication = [...publications].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))[0];
    const topViewedPublication = [...publications].sort((a, b) => (b.vuesCount || 0) - (a.vuesCount || 0))[0];
    const topCommentedPublication = [...publications].sort((a, b) => (b.commentairesCount || 0) - (a.commentairesCount || 0))[0];

    const authors = publications
      .map((publication) => (publication.auteurEmail || '').trim().toLowerCase())
      .filter((email) => !!email);
    const authorCounts = authors.reduce<Record<string, number>>((acc, email) => {
      acc[email] = (acc[email] || 0) + 1;
      return acc;
    }, {});

    const mostActiveAuthorEntry = Object.entries(authorCounts).sort((left, right) => right[1] - left[1])[0];

    const newestPublication = [...publications].sort(
      (left, right) => this.toDateTime(right.dateCreation) - this.toDateTime(left.dateCreation)
    )[0];

    this.stats = {
      totalForums,
      totalPublications,
      averagePublicationsPerForum,
      forumsWithoutPublications,
      totalLikes,
      totalViews,
      totalComments,
      mostActiveForumName: mostActiveForum?.name || '-',
      mostActiveForumCount: mostActiveForum?.count || 0,
      mostActiveAuthorEmail: mostActiveAuthorEntry?.[0] || '-',
      mostActiveAuthorCount: mostActiveAuthorEntry?.[1] || 0,
      newestPublisherEmail: (newestPublication?.auteurEmail || '').trim() || '-',
      newestPublicationDate: newestPublication?.dateCreation || '',
      topLikedPublicationTitle: this.getPublicationLabel(topLikedPublication),
      topLikedPublicationCount: topLikedPublication?.likesCount || 0,
      topViewedPublicationTitle: this.getPublicationLabel(topViewedPublication),
      topViewedPublicationCount: topViewedPublication?.vuesCount || 0,
      topCommentedPublicationTitle: this.getPublicationLabel(topCommentedPublication),
      topCommentedPublicationCount: topCommentedPublication?.commentairesCount || 0
    };
  }

  formatPublicationDate(value: string): string {
    const time = this.toDateTime(value);
    if (!time) {
      return '-';
    }
    return new Date(time).toLocaleString();
  }

  private resolveForumId(publication: Publication): number | null {
    const byField = Number(publication.forumId);
    if (Number.isFinite(byField) && byField > 0) {
      return byField;
    }

    const byObject = Number(publication.forum?.id);
    if (Number.isFinite(byObject) && byObject > 0) {
      return byObject;
    }

    return null;
  }

  private getPublicationLabel(publication?: Publication): string {
    if (!publication) {
      return '-';
    }

    const title = (publication.titre || '').trim();
    if (title) {
      return title;
    }

    const content = (publication.contenu || '').trim();
    if (!content) {
      return '-';
    }

    return content.length > 70 ? `${content.slice(0, 70).trim()}...` : content;
  }

  private toDateTime(value?: string): number {
    if (!value) {
      return 0;
    }

    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
