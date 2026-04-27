import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { AuthService } from '../../../../core/services/auth.service';
import { Forum, ForumService, Publication } from '../services/forum.service';

type ForumTab = 'categories' | 'recents' | 'top';

@Component({
  selector: 'app-forum-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminIconComponent],
  templateUrl: './forum-list.component.html',
  styleUrl: './forum-list.component.css'
})
export class ForumListComponent implements OnInit, OnDestroy {
  forums: Forum[] = [];
  filteredForums: Forum[] = [];
  filteredPublications: Publication[] = [];

  allPublications: Publication[] = [];
  forumPublicationCounts: Record<number, number> = {};

  searchTerm = '';
  activeTab: ForumTab = 'categories';
  isSearching = false;

  topViewed?: Publication;
  topCommented?: Publication;
  topLiked?: Publication;

  recentPublications: Publication[] = [];
  topPublications: Publication[] = [];

  suggestions: string[] = [];
  showSuggestions = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  currentUserEmail = '';
  isAdmin = false;

  constructor(
    private forumService: ForumService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserEmail = this.authService.getUserEmail();
    this.isAdmin = this.authService.isAdmin();
    this.loadData();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((term) => this.performSearch(term));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getScore(pub: Publication): number {
    return Math.round(this.forumService.getSmartScore(pub) * 100) / 100;
  }

  loadData(): void {
    this.forumService.getAll().subscribe((forums: Forum[]) => {
      this.forums = this.sortForums(forums || []);
      this.filteredForums = this.forums;
    });

    this.forumService.getAllPublications().subscribe((pubs: Publication[]) => {
      this.allPublications = pubs || [];
      this.filteredPublications = this.allPublications;
      this.forumPublicationCounts = this.buildForumPublicationCounts(this.allPublications);

      this.topViewed = [...this.allPublications].sort((a, b) => (b.vuesCount || 0) - (a.vuesCount || 0))[0];
      this.topCommented = [...this.allPublications].sort((a, b) => (b.commentairesCount || 0) - (a.commentairesCount || 0))[0];
      this.topLiked = [...this.allPublications].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))[0];

      this.recentPublications = [...this.allPublications]
        .sort((a, b) => new Date(b.dateCreation || '').getTime() - new Date(a.dateCreation || '').getTime())
        .slice(0, 6);

      this.topPublications = [...this.allPublications]
        .sort((a, b) => this.forumService.getSmartScore(b) - this.forumService.getSmartScore(a))
        .slice(0, 6);
    });
  }

  setTab(tab: ForumTab): void {
    this.activeTab = tab;
  }

  onSearch(): void {
    const term = this.searchTerm.trim();
    const normalizedTerm = this.normalizeText(term);

    if (!normalizedTerm) {
      this.suggestions = [];
      this.showSuggestions = false;
    } else {
      this.suggestions = this.forums
        .map((forum) => forum.nom)
        .filter((name) => this.normalizeText(name).startsWith(normalizedTerm))
        .slice(0, 6);
      this.showSuggestions = this.suggestions.length > 0;
    }

    this.isSearching = !!term;
    this.searchSubject.next(this.searchTerm);
  }

  selectSuggestion(suggestion: string): void {
    this.searchTerm = suggestion;
    this.showSuggestions = false;
    this.performSearch(this.searchTerm);
  }

  hideSuggestions(): void {
    setTimeout(() => (this.showSuggestions = false), 150);
  }

  deleteForum(id: number): void {
    this.forumService.deleteForum(id).subscribe({
      next: () => {
        this.forums = this.forums.filter((forum) => forum.id !== id);
        this.filteredForums = this.filteredForums.filter((forum) => forum.id !== id);
        delete this.forumPublicationCounts[id];
      },
      error: (err) => {
        console.error('Erreur suppression', err);
      }
    });
  }

  canDeleteForum(forum: Forum): boolean {
    return this.isAdmin || this.authService.ownsResource(forum.auteurEmail);
  }

  editForum(id?: number): void {
    if (!id) return;
    this.router.navigate(['/public/forums/edit', id]);
  }

  openForum(id?: number): void {
    if (!id) return;
    this.router.navigate(['/public/forums', id, 'publications']);
  }

  openPublication(publication?: Publication): void {
    if (!publication) return;

    if (publication.id) {
      this.forumService.incrementVues(publication.id).subscribe({
        next: () => {},
        error: () => {}
      });
    }

    const forumId = Number(publication.forumId || publication.forum?.id);
    if (Number.isFinite(forumId) && forumId > 0) {
      const publicationId = Number(publication.id);
      const queryParams = Number.isFinite(publicationId) && publicationId > 0
        ? { publicationId }
        : undefined;

      this.router.navigate(['/public/forums', forumId, 'publications'], { queryParams });
      return;
    }

    this.router.navigate(['/public/forums']);
  }

  getForumPublicationCount(forum: Forum): number {
    const forumId = Number(forum.id);
    if (!Number.isFinite(forumId) || forumId <= 0) {
      return forum.publications?.length || 0;
    }
    return this.forumPublicationCounts[forumId] || 0;
  }

  private performSearch(term: string): void {
    const normalizedTerm = this.normalizeText(term);
    this.isSearching = !!normalizedTerm;

    if (!normalizedTerm) {
      this.filteredForums = this.sortForums(this.forums);
      this.filteredPublications = this.allPublications;
      return;
    }

    // Regle demandee: afficher seulement les forums qui commencent par ce que l'utilisateur ecrit.
    this.filteredForums = this.sortForums(
      this.forums.filter((forum) => this.normalizeText(forum.nom).startsWith(normalizedTerm))
    );

    // Les onglets publications gardent une recherche classique.
    this.filteredPublications = this.allPublications.filter((pub) =>
      this.normalizeText(pub.titre).includes(normalizedTerm) ||
      this.normalizeText(pub.contenu).includes(normalizedTerm)
    );
  }

  private sortForums(forums: Forum[]): Forum[] {
    return [...forums].sort((left, right) => {
      const leftTime = left.dateCreation ? new Date(left.dateCreation).getTime() : 0;
      const rightTime = right.dateCreation ? new Date(right.dateCreation).getTime() : 0;

      if (rightTime !== leftTime) {
        return rightTime - leftTime;
      }

      return left.nom.localeCompare(right.nom, 'fr', { sensitivity: 'base' });
    });
  }

  private normalizeText(value: string): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private buildForumPublicationCounts(publications: Publication[]): Record<number, number> {
    const counts: Record<number, number> = {};

    (publications || []).forEach((publication) => {
      const forumId = Number(publication.forumId || publication.forum?.id);
      if (!Number.isFinite(forumId) || forumId <= 0) {
        return;
      }
      counts[forumId] = (counts[forumId] || 0) + 1;
    });

    return counts;
  }
}