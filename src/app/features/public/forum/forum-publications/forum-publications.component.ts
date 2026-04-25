import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { Commentaire, Forum, ForumService, Publication } from '../services/forum.service';
import { AiService, AiTextQuality } from '../../publication/services/ai.service';
import { EngagementService } from '../../publication/services/engagement.service';

type ForumSort = 'recent' | 'smart' | 'likes' | 'vues';
type ForumFilter = 'all' | 'mine' | 'popular';
type CommentTone = 'friendly' | 'curious' | 'expert';

@Component({
  selector: 'app-forum-publications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminIconComponent],
  templateUrl: './forum-publications.component.html',
  styleUrl: './forum-publications.component.css'
})
export class ForumPublicationsComponent implements OnInit {
  forum?: Forum;
  forumId = 0;
  private targetPublicationId: number | null = null;

  publications: Publication[] = [];
  similaires: Publication[] = [];

  topViewed?: Publication;
  topLiked?: Publication;
  topCommented?: Publication;

  tri: ForumSort = 'smart';
  filterMode: ForumFilter = 'all';
  searchTerm = '';
  showFilters = false;
  isLoadingPublications = false;

  // Nouveau post
  nouveauTitre = '';
  nouveauContenu = '';
  aiTheme = '';
  showForm = false;

  aiLoading = false;
  aiTitleLoading = false;
  aiSummaryLoading = false;
  aiAnalysisLoading = false;

  draftSummary = '';
  draftQuality?: AiTextQuality;

  successMsg = '';
  formError = '';
  publishing = false;

  currentUserEmail = '';
  isAdmin = false;

  // Commentaires
  commentTone: CommentTone = 'friendly';
  commentAiLoadingId: number | null = null;
  commentErrors: Record<number, string> = {};

  editingPublicationId: number | null = null;
  editPublicationTitre = '';
  editPublicationContenu = '';

  editingCommentKey = '';
  editCommentContenu = '';

  expandedPublicationIds = new Set<number>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    private aiService: AiService,
    private authService: AuthService,
    private engagementService: EngagementService
  ) {}

  ngOnInit(): void {
    this.refreshSessionContext();

    this.forumId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.forumId || Number.isNaN(this.forumId)) {
      this.formError = 'Identifiant forum invalide.';
      return;
    }

    this.targetPublicationId = this.parsePositiveInt(this.route.snapshot.queryParamMap.get('publicationId'));

    // Evite de bloquer l affichage si les metadonnees forum ne chargent pas.
    this.forum = {
      id: this.forumId,
      nom: `Forum #${this.forumId}`,
      description: '',
      categorie: ''
    };

    this.loadDraft();
    if (this.targetPublicationId) {
      this.showForm = false;
    }

    this.forumService.getById(this.forumId).subscribe({
      next: (forum) => {
        this.forum = forum;
      },
      error: (err) => {
        console.error('Erreur getById forum', err);
        this.formError = 'Infos forum indisponibles. Les publications restent accessibles.';
      }
    });

    this.chargerPublications(this.forumId);
  }

  get draftWordCount(): number {
    return this.nouveauContenu.trim().split(/\s+/).filter(Boolean).length;
  }

  get publicationsView(): Publication[] {
    const query = this.searchTerm.trim().toLowerCase();
    const base = this.publications.filter((pub) => {
      if (this.filterMode === 'mine' && !this.authService.ownsResource(pub.auteurEmail)) {
        return false;
      }

      if (this.filterMode === 'popular' && (pub.likesCount || 0) < 2 && (pub.commentairesCount || 0) < 2) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (`${pub.titre} ${pub.contenu} ${pub.auteurNom || ''} ${pub.auteurEmail || ''}`)
        .toLowerCase()
        .includes(query);
    });

    return this.trier(base);
  }

  setTri(t: ForumSort): void {
    this.tri = t;
    this.closeFiltersOnMobile();
  }

  setFilter(mode: ForumFilter): void {
    this.filterMode = mode;
    this.closeFiltersOnMobile();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  closeFilters(): void {
    this.showFilters = false;
  }

  getScore(pub: Publication): number {
    return Math.round(this.forumService.getSmartScore(pub) * 100) / 100;
  }

  trier(pubs: Publication[]): Publication[] {
    switch (this.tri) {
      case 'smart':
        return [...pubs].sort((a, b) => this.forumService.getSmartScore(b) - this.forumService.getSmartScore(a));
      case 'likes':
        return [...pubs].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
      case 'vues':
        return [...pubs].sort((a, b) => (b.vuesCount || 0) - (a.vuesCount || 0));
      default:
        return [...pubs].sort((a, b) => {
          const left = new Date(b.dateCreation || '').getTime();
          const right = new Date(a.dateCreation || '').getTime();
          return left - right;
        });
    }
  }

  suggestIA(): void {
    const source = this.nouveauTitre.trim() || this.aiTheme.trim() || this.forum?.nom || '';
    if (!source) {
      this.formError = 'Ajoute un titre ou un theme pour lancer la suggestion IA.';
      return;
    }

    this.formError = '';
    this.aiLoading = true;

    this.aiService.suggestContent(source, this.forum?.nom || '', this.nouveauTitre.trim()).subscribe({
      next: (txt) => {
        this.aiLoading = false;
        this.nouveauContenu = txt || this.nouveauContenu;
        this.saveDraft();

        if (!this.nouveauTitre.trim() && this.nouveauContenu.trim()) {
          this.suggestTitleIA();
        }
      },
      error: () => {
        this.aiLoading = false;
        this.formError = 'Erreur IA pendant la generation de contenu.';
      }
    });
  }

  improveIA(): void {
    if (!this.nouveauContenu.trim()) {
      this.formError = 'Ecris le contenu avant l amelioration IA.';
      return;
    }

    this.formError = '';
    this.aiLoading = true;

    this.aiService.improveContent(this.nouveauContenu).subscribe({
      next: (txt) => {
        this.aiLoading = false;
        if (txt) {
          this.nouveauContenu = txt;
          this.saveDraft();
        }
      },
      error: () => {
        this.aiLoading = false;
        this.formError = 'Erreur IA pendant l amelioration du contenu.';
      }
    });
  }

  suggestTitleIA(): void {
    if (!this.nouveauContenu.trim() && !this.aiTheme.trim() && !this.nouveauTitre.trim()) {
      this.formError = 'Ajoute un titre, un contenu ou un theme pour proposer un titre IA.';
      return;
    }

    this.formError = '';
    this.aiTitleLoading = true;

    this.aiService.suggestTitle(this.nouveauContenu, this.aiTheme, this.nouveauTitre).subscribe({
      next: (title) => {
        this.aiTitleLoading = false;
        if (title) {
          this.nouveauTitre = title;
          this.saveDraft();
        }
      },
      error: () => {
        this.aiTitleLoading = false;
        this.formError = 'Erreur IA pendant la generation du titre.';
      }
    });
  }

  summarizeDraftIA(): void {
    if (!this.nouveauContenu.trim()) {
      this.formError = 'Ecris le contenu avant de demander un resume.';
      return;
    }

    this.formError = '';
    this.aiSummaryLoading = true;

    this.aiService.summarizeContent(this.nouveauContenu, 45).subscribe({
      next: (summary) => {
        this.aiSummaryLoading = false;
        this.draftSummary = summary;
      },
      error: () => {
        this.aiSummaryLoading = false;
        this.formError = 'Erreur IA pendant le resume.';
      }
    });
  }

  analyzeDraftIA(): void {
    const content = `${this.nouveauTitre}\n${this.nouveauContenu}`.trim();
    if (!content) {
      this.formError = 'Ajoute du contenu avant une analyse IA.';
      return;
    }

    this.formError = '';
    this.aiAnalysisLoading = true;

    this.aiService.analyzeTextQuality(content).subscribe({
      next: (quality) => {
        this.aiAnalysisLoading = false;
        this.draftQuality = quality;
      },
      error: () => {
        this.aiAnalysisLoading = false;
        this.formError = 'Erreur IA pendant l analyse.';
      }
    });
  }

  onDraftChange(): void {
    this.formError = '';
    this.saveDraft();
  }

  publier(): void {
    if (!this.requireSession()) {
      return;
    }

    if (!this.forum) {
      this.formError = 'Forum non charge.';
      return;
    }

    const title = this.normalizeForBackend(this.nouveauTitre.trim());
    const content = this.normalizeForBackend(this.nouveauContenu.trim());

    if (title.length < 5) {
      this.formError = 'Le titre doit contenir au moins 5 caracteres.';
      return;
    }

    if (content.length < 30) {
      this.formError = 'Le contenu doit contenir au moins 30 caracteres.';
      return;
    }

    const probe: Publication = {
      id: -1,
      titre: title,
      contenu: content,
      auteurEmail: this.currentUserEmail
    };

    const similar = this.forumService.getSimilarPublications(probe, this.publications, 1)[0];
    if (similar) {
      const ok = confirm(`Publication proche detectee: "${similar.titre}". Publier quand meme ?`);
      if (!ok) {
        return;
      }
    }

    this.formError = '';
    this.publishing = true;

    this.aiService.moderateComment(`${title}\n${content}`).subscribe({
      next: (approved) => {
        if (!approved) {
          this.publishing = false;
          this.formError = 'Le contenu semble inapproprie. Reformule et reessaie.';
          return;
        }

        const payload: any = {
          titre: title,
          contenu: content,
          auteurEmail: this.currentUserEmail,
          auteurNom: this.authService.getUserName() || 'Utilisateur',
          forum: { id: this.forum?.id }
        };

        this.forumService.createPublication(payload).subscribe({
          next: () => {
            this.publishing = false;
            this.successMsg = 'Publication ajoutee.';
            this.resetDraftState();
            this.showForm = false;
            setTimeout(() => (this.successMsg = ''), 2600);
            this.chargerPublications(this.forumId);
          },
          error: (err) => {
            this.publishing = false;
            console.error('Erreur createPublication', err);
            this.formError = this.resolveActionError(err, 'Erreur lors de la publication.');
          }
        });
      },
      error: () => {
        this.publishing = false;
        this.formError = 'Erreur de moderation IA.';
      }
    });
  }

  liker(pub: Publication): void {
    if (!this.requireSession()) {
      return;
    }

    if (!pub.id) return;
    if (this.hasLikedPublication(pub)) {
      this.formError = 'Tu as deja aime cette publication.';
      return;
    }

    this.forumService.likePublication(pub.id).subscribe({
      next: (updated) => {
        const previousLikes = pub.likesCount || 0;
        const serverLikes = Number(updated?.likesCount);
        pub.likesCount = Number.isFinite(serverLikes) && serverLikes > previousLikes
          ? serverLikes
          : previousLikes + 1;
        this.engagementService.markPublicationLike(pub.id!, this.currentUserEmail);
        this.calculerTopStats(this.publications);
      },
      error: (err) => {
        if (this.isParsingErrorWithSuccessStatus(err)) {
          pub.likesCount = (pub.likesCount || 0) + 1;
          this.engagementService.markPublicationLike(pub.id!, this.currentUserEmail);
          this.calculerTopStats(this.publications);
          return;
        }

        console.error('Erreur like', err);
        this.formError = this.resolveActionError(err, 'Impossible de liker cette publication.');
      }
    });
  }

  supprimer(pub: Publication): void {
    if (!this.requireSession()) {
      return;
    }

    if (!pub.id) return;
    if (!this.canDeletePublication(pub)) return;
    if (!confirm('Supprimer cette publication ?')) return;

    const targetAuthorEmail = this.isAdmin
      ? (pub.auteurEmail || this.currentUserEmail)
      : this.currentUserEmail;

    this.forumService.deletePublication(pub.id, targetAuthorEmail).subscribe({
      next: () => this.chargerPublications(this.forumId),
      error: (err) => {
        console.error('Erreur suppression publication', err);
        this.formError = this.resolveActionError(err, 'Impossible de supprimer cette publication.');
      }
    });
  }

  canDeletePublication(pub: Publication): boolean {
    return this.isAdmin || this.authService.ownsResource(pub.auteurEmail);
  }

  canEditPublication(pub: Publication): boolean {
    return this.canDeletePublication(pub);
  }

  isEditingPublication(pub: Publication): boolean {
    return !!pub.id && this.editingPublicationId === pub.id;
  }

  startPublicationEdit(pub: Publication, event: Event): void {
    event.stopPropagation();
    if (!this.canEditPublication(pub) || !pub.id) return;

    this.editingPublicationId = pub.id;
    this.editPublicationTitre = pub.titre || '';
    this.editPublicationContenu = pub.contenu || '';
  }

  cancelPublicationEdit(event?: Event): void {
    event?.stopPropagation();
    this.editingPublicationId = null;
    this.editPublicationTitre = '';
    this.editPublicationContenu = '';
  }

  savePublicationEdit(pub: Publication, event: Event): void {
    event.stopPropagation();
    if (!pub.id || !this.isEditingPublication(pub)) return;

    const titre = this.editPublicationTitre.trim();
    const contenu = this.editPublicationContenu.trim();
    if (!titre || !contenu) {
      this.formError = 'Titre et contenu sont obligatoires pour modifier la publication.';
      return;
    }

    const targetAuthorEmail = this.isAdmin
      ? (pub.auteurEmail || this.currentUserEmail)
      : this.currentUserEmail;

    this.forumService.updatePublication(pub.id, { titre, contenu }, targetAuthorEmail).subscribe({
      next: (updated) => {
        pub.titre = updated?.titre || titre;
        pub.contenu = updated?.contenu || contenu;
        this.cancelPublicationEdit();
        this.chargerPublications(this.forumId);
      },
      error: (err) => {
        console.error('Erreur update publication', err);
        this.formError = this.resolveActionError(err, 'Impossible de modifier cette publication.');
      }
    });
  }

  ouvrir(pub: Publication): void {
    if (!pub.id) return;
    if (!this.authService.isLoggedIn()) return;
    const previousViews = pub.vuesCount || 0;
    pub.vuesCount = previousViews + 1;
    this.formError = '';
    this.calculerTopStats(this.publications);

    this.forumService.incrementVues(pub.id).subscribe({
      next: (updated) => {
        const serverViews = Number(updated?.vuesCount);
        pub.vuesCount = Number.isFinite(serverViews) && serverViews > (pub.vuesCount || 0)
          ? serverViews
          : (pub.vuesCount || 0);
        this.engagementService.markPublicationView(pub.id!, this.currentUserEmail);
        this.similaires = this.forumService.getSimilarPublications(pub, this.publications, 3);
        this.calculerTopStats(this.publications);
      },
      error: (err: unknown) => {
        if (this.isParsingErrorWithSuccessStatus(err)) {
          pub.vuesCount = previousViews + 1;
          this.engagementService.markPublicationView(pub.id!, this.currentUserEmail);
          this.similaires = this.forumService.getSimilarPublications(pub, this.publications, 3);
          this.calculerTopStats(this.publications);
          return;
        }

        const status = Number((err as { status?: unknown })?.status);
        if (status === 401 || status === 403) {
          return;
        }
        // Vue deja incrementee localement: on evite d'afficher une alerte rouge bloquante.
        console.error('Erreur vues (ignoree UI)', err);
      }
    });
  }

  toggleExpand(pub: Publication, event: Event): void {
    event.stopPropagation();
    if (!pub.id) return;

    if (this.expandedPublicationIds.has(pub.id)) {
      this.expandedPublicationIds.delete(pub.id);
    } else {
      this.expandedPublicationIds.add(pub.id);
    }
  }

  isExpanded(pub: Publication): boolean {
    return !!pub.id && this.expandedPublicationIds.has(pub.id);
  }

  getContentPreview(pub: Publication): string {
    const content = pub.contenu || '';
    if (this.isExpanded(pub) || content.length <= 260) {
      return content;
    }
    return `${content.slice(0, 260).trim()}...`;
  }

  suggestCommentIA(pub: Publication): void {
    if (!pub.id) return;

    this.commentErrors[pub.id] = '';
    this.commentAiLoadingId = pub.id;
    const existingDraft = (pub.nouveauCommentaire || '').trim();
    const request$ = existingDraft
      ? this.aiService.improveCommentText(existingDraft, this.commentTone)
      : this.aiService.suggestCommentForPublication(pub.titre || '', pub.contenu || '', this.commentTone);

    request$.subscribe({
      next: (result) => {
        this.commentAiLoadingId = null;
        pub.nouveauCommentaire = result;
      },
      error: () => {
        this.commentAiLoadingId = null;
        this.commentErrors[pub.id!] = 'Impossible de corriger/generer le commentaire IA.';
      }
    });
  }

  ajouterCommentaire(pub: Publication): void {
    if (!this.requireSession()) {
      return;
    }

    if (!pub.id) return;

    const content = (pub.nouveauCommentaire || '').trim();
    this.commentErrors[pub.id] = '';

    if (!content) {
      this.commentErrors[pub.id] = 'Commentaire vide.';
      return;
    }

    const duplicate = (pub.commentaires || []).some(
      (c) =>
        (c.auteurEmail || '').trim().toLowerCase() === this.currentUserEmail.trim().toLowerCase() &&
        c.contenu.trim().toLowerCase() === content.toLowerCase()
    );

    if (duplicate) {
      this.commentErrors[pub.id] = 'Tu as deja publie ce commentaire.';
      return;
    }

    this.aiService.moderateComment(content).subscribe({
      next: (approved) => {
        if (!approved) {
          this.commentErrors[pub.id!] = 'Commentaire refuse par la moderation IA.';
          return;
        }

        const commentaire = {
          contenu: content,
          auteurEmail: this.currentUserEmail,
          auteurNom: this.authService.getUserName() || 'Utilisateur'
        };

        this.forumService.addCommentaire(pub.id!, commentaire).subscribe({
          next: () => {
            pub.nouveauCommentaire = '';
            this.chargerCommentaires(pub);
          },
          error: (err) => {
            if (this.isParsingErrorWithSuccessStatus(err)) {
              pub.nouveauCommentaire = '';
              this.chargerCommentaires(pub);
              return;
            }

            console.error('Erreur commentaire', err);
            const status = Number((err as { status?: unknown })?.status);
            if (status === 401) {
              this.commentErrors[pub.id!] = 'Session invalide ou expiree. Reconnecte-toi puis reessaie.';
              return;
            }
            if (status === 403) {
              this.commentErrors[pub.id!] = 'Action interdite: tu peux modifier/supprimer seulement ton propre contenu.';
              return;
            }

            const fallback = Number.isFinite(status) && status > 0
              ? `Erreur lors de l envoi du commentaire (code ${status}).`
              : 'Erreur lors de l envoi du commentaire.';
            this.commentErrors[pub.id!] = this.resolveActionError(err, fallback);
          }
        });
      },
      error: () => {
        this.commentErrors[pub.id!] = 'Erreur de moderation IA sur le commentaire.';
      }
    });
  }

  onCommentInput(pub: Publication): void {
    if (!pub.id) return;
    this.commentErrors[pub.id] = '';
  }

  canManageComment(commentaire: Commentaire): boolean {
    return this.isAdmin || this.authService.ownsResource(commentaire.auteurEmail);
  }

  private getCommentKey(publicationId?: number, commentId?: number): string {
    return `${publicationId || 0}-${commentId || 0}`;
  }

  isEditingComment(pub: Publication, commentaire: Commentaire): boolean {
    return this.editingCommentKey === this.getCommentKey(pub.id, commentaire.id);
  }

  startCommentEdit(pub: Publication, commentaire: Commentaire, event: Event): void {
    event.stopPropagation();
    if (!this.canManageComment(commentaire)) return;
    this.editingCommentKey = this.getCommentKey(pub.id, commentaire.id);
    this.editCommentContenu = commentaire.contenu;
  }

  cancelCommentEdit(event?: Event): void {
    event?.stopPropagation();
    this.editingCommentKey = '';
    this.editCommentContenu = '';
  }

  saveCommentEdit(pub: Publication, commentaire: Commentaire, event: Event): void {
    event.stopPropagation();
    if (!commentaire.id || !this.isEditingComment(pub, commentaire)) return;

    const contenu = this.editCommentContenu.trim();
    if (!contenu) {
      this.commentErrors[pub.id || 0] = 'Le commentaire ne peut pas etre vide.';
      return;
    }

    const targetAuthorEmail = this.isAdmin
      ? (commentaire.auteurEmail || this.currentUserEmail)
      : this.currentUserEmail;

    this.forumService.updateCommentaire(
      commentaire.id,
      { contenu },
      targetAuthorEmail
    ).subscribe({
      next: () => {
        commentaire.contenu = contenu;
        this.cancelCommentEdit();
        this.chargerCommentaires(pub);
      },
      error: (err) => {
        console.error('Erreur modification commentaire', err);
        this.commentErrors[pub.id || 0] = 'Impossible de modifier ce commentaire.';
      }
    });
  }

  deleteComment(pub: Publication, commentaire: Commentaire, event: Event): void {
    if (!this.requireSession()) {
      return;
    }

    event.stopPropagation();
    if (!commentaire.id || !this.canManageComment(commentaire)) return;
    if (!confirm('Supprimer ce commentaire ?')) return;

    const targetAuthorEmail = this.isAdmin
      ? (commentaire.auteurEmail || this.currentUserEmail)
      : this.currentUserEmail;

    this.forumService.deleteCommentaire(commentaire.id, targetAuthorEmail).subscribe({
      next: () => this.chargerCommentaires(pub),
      error: (err) => {
        console.error('Erreur suppression commentaire', err);
        this.commentErrors[pub.id || 0] = this.resolveActionError(err, 'Impossible de supprimer ce commentaire.');
      }
    });
  }

  likeComment(pub: Publication, commentaire: Commentaire, event: Event): void {
    if (!this.requireSession()) {
      return;
    }

    event.stopPropagation();
    if (!commentaire.id) return;
    if (this.hasLikedComment(commentaire)) {
      this.commentErrors[pub.id || 0] = 'Tu as deja like ce commentaire.';
      return;
    }

    this.forumService.likeCommentaire(commentaire.id).subscribe({
      next: (updated) => {
        commentaire.likesCount = updated?.likesCount ?? ((commentaire.likesCount || 0) + 1);
        this.engagementService.markCommentLike(commentaire.id!, this.currentUserEmail);
      },
      error: (err) => {
        if (this.isParsingErrorWithSuccessStatus(err)) {
          commentaire.likesCount = (commentaire.likesCount || 0) + 1;
          this.engagementService.markCommentLike(commentaire.id!, this.currentUserEmail);
          return;
        }

        console.error('Erreur like commentaire', err);
        this.commentErrors[pub.id || 0] = this.resolveActionError(err, 'Erreur lors du like du commentaire.');
      }
    });
  }

  score(pub: Publication): string {
    return this.forumService.getSmartScore(pub).toFixed(1);
  }

  openPublicationFromInsight(pub?: Publication): void {
    if (!pub) return;
    this.ouvrir(pub);
  }

  hasLikedPublication(pub: Publication): boolean {
    return !!pub.id && this.engagementService.hasPublicationLike(pub.id, this.currentUserEmail);
  }

  hasViewedPublication(pub: Publication): boolean {
    return !!pub.id && this.engagementService.hasPublicationView(pub.id, this.currentUserEmail);
  }

  hasLikedComment(commentaire: Commentaire): boolean {
    return !!commentaire.id && this.engagementService.hasCommentLike(commentaire.id, this.currentUserEmail);
  }

  retour(): void {
    this.router.navigate(['/public/forums']);
  }

  chargerPublications(forumId = this.forum?.id ?? 0): void {
    this.isLoadingPublications = true;
    this.forumService.getByForum(forumId).subscribe({
      next: (pubs) => {
        const forumPubs = (pubs || []).map((pub) => this.normalizePublication(pub));
        this.applyLoadedPublications(forumPubs);
      },
      error: (err) => {
        console.error('Erreur getByForum', err);
        this.formError = this.resolveActionError(err, 'Impossible de charger les publications de ce forum.');
        this.isLoadingPublications = false;
      }
    });
  }

  get emptyStateMessage(): string {
    if (this.isLoadingPublications) {
      return 'Chargement des publications...';
    }

    if (this.searchTerm.trim()) {
      return 'Aucune publication ne correspond a la recherche.';
    }

    if (this.filterMode !== 'all') {
      return 'Aucune publication pour ce filtre.';
    }

    return 'Ce forum ne contient pas encore de publications. Sois le premier a publier.';
  }

  chargerCommentaires(pub: Publication): void {
    if (!pub.id) return;

    this.forumService.getCommentaires(pub.id).subscribe({
      next: (data) => {
        pub.commentaires = data;
        pub.commentairesCount = data.length;
        this.calculerTopStats(this.publications);
      },
      error: (err) => console.error('Erreur getCommentaires', err)
    });
  }

  trackByPublication(_: number, pub: Publication): number | string {
    return pub.id || pub.titre;
  }

  getPublicationCardId(pub: Publication): string | null {
    const publicationId = Number(pub.id);
    if (!Number.isFinite(publicationId) || publicationId <= 0) {
      return null;
    }
    return `publication-${publicationId}`;
  }

  calculerTopStats(pubs: Publication[]): void {
    if (!pubs.length) {
      this.topViewed = undefined;
      this.topLiked = undefined;
      this.topCommented = undefined;
      return;
    }

    this.topViewed = [...pubs].sort((a, b) => (b.vuesCount || 0) - (a.vuesCount || 0))[0];
    this.topLiked = [...pubs].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))[0];
    this.topCommented = [...pubs].sort((a, b) => (b.commentairesCount || 0) - (a.commentairesCount || 0))[0];
  }

  private normalizePublication(pub: Publication): Publication {
    return {
      ...pub,
      titre: pub.titre || 'Publication',
      contenu: pub.contenu || '',
      commentaires: pub.commentaires || [],
      nouveauCommentaire: pub.nouveauCommentaire || ''
    };
  }

  private applyLoadedPublications(pubs: Publication[]): void {
    this.publications = pubs;
    this.calculerTopStats(this.publications);

    this.publications.forEach((pub) => {
      pub.nouveauCommentaire = pub.nouveauCommentaire || '';
      this.chargerCommentaires(pub);
    });

    this.similaires = this.publications.length > 0
      ? this.forumService.getSimilarPublications(this.publications[0], this.publications, 3)
      : [];
    this.isLoadingPublications = false;
    this.focusTargetPublication();
  }

  private loadDraft(): void {
    const key = this.getDraftKey();
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const draft = JSON.parse(raw) as { title?: string; content?: string; theme?: string };
      this.nouveauTitre = draft.title || '';
      this.nouveauContenu = draft.content || '';
      this.aiTheme = draft.theme || '';
      this.showForm = !!(this.nouveauTitre || this.nouveauContenu || this.aiTheme);
    } catch {
      localStorage.removeItem(key);
    }
  }

  private saveDraft(): void {
    const key = this.getDraftKey();
    const payload = {
      title: this.nouveauTitre,
      content: this.nouveauContenu,
      theme: this.aiTheme
    };
    localStorage.setItem(key, JSON.stringify(payload));
  }

  private resetDraftState(): void {
    this.nouveauTitre = '';
    this.nouveauContenu = '';
    this.aiTheme = '';
    this.draftSummary = '';
    this.draftQuality = undefined;
    localStorage.removeItem(this.getDraftKey());
  }

  private getDraftKey(): string {
    return `forum-draft-${this.forumId || 0}`;
  }

  private requireSession(): boolean {
    this.refreshSessionContext();
    if (this.authService.isLoggedIn()) {
      return true;
    }

    this.formError = 'Session invalide ou expiree. Reconnecte-toi pour utiliser cette action.';
    this.router.navigate(['/login']);
    return false;
  }

  private resolveActionError(error: unknown, fallback: string): string {
    const backendMessage = this.extractBackendMessage(error);
    const status = Number((error as { status?: unknown })?.status);
    if (status === 0) {
      return 'Backend inaccessible. Verifie que le serveur Spring tourne sur le bon port.';
    }
    if (backendMessage && /invalid utf-8|utf-8/i.test(backendMessage)) {
      return 'Le texte contient des caracteres non supportes (emoji/symboles). Supprime-les puis reessaie.';
    }
    if (status === 400) {
      return 'Donnees invalides envoyees au backend. Verifie le commentaire et reessaie.';
    }
    if (status === 401) {
      return 'Session invalide ou expiree. Reconnecte-toi puis reessaie.';
    }
    if (status === 403) {
      return 'Action interdite: tu peux modifier/supprimer seulement ton propre contenu.';
    }
    if (status === 500) {
      if (backendMessage) {
        return `Erreur serveur: ${backendMessage}`;
      }
      return 'Erreur serveur pendant l action. Reessaie dans quelques secondes.';
    }
    if (backendMessage) {
      return backendMessage;
    }
    return fallback;
  }

  private isParsingErrorWithSuccessStatus(error: unknown): boolean {
    const status = Number((error as { status?: unknown })?.status);
    return status === 200;
  }

  private refreshSessionContext(): void {
    this.currentUserEmail = this.authService.getUserEmail();
    this.isAdmin = this.authService.isAdmin();
  }

  private normalizeForBackend(value: string): string {
    if (!value) {
      return '';
    }

    // Remove problematic Unicode ranges (emoji/non-BMP) to avoid backend UTF-8 parse errors.
    return value
      .normalize('NFC')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
      .replace(/[\u{10000}-\u{10FFFF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractBackendMessage(error: unknown): string {
    const payload = (error as { error?: unknown })?.error;

    if (typeof payload === 'string' && payload.trim()) {
      try {
        const parsed = JSON.parse(payload) as { message?: string };
        if (typeof parsed?.message === 'string' && parsed.message.trim()) {
          return parsed.message.trim();
        }
      } catch {
        return payload.trim();
      }
    }

    const message = (payload as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }

    return '';
  }

  private closeFiltersOnMobile(): void {
    if (!this.showFilters) {
      return;
    }

    try {
      if (window.matchMedia('(max-width: 1100px)').matches) {
        this.closeFilters();
      }
    } catch {
      // No-op: window peut etre indisponible dans certains contextes.
    }
  }

  private parsePositiveInt(value: string | null): number | null {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }

  private focusTargetPublication(): void {
    const publicationId = this.targetPublicationId;
    if (!publicationId) {
      return;
    }

    const existsInCurrentForum = this.publications.some(
      (publication) => Number(publication.id) === publicationId
    );
    this.targetPublicationId = null;

    if (!existsInCurrentForum) {
      return;
    }

    this.expandedPublicationIds.add(publicationId);

    setTimeout(() => {
      const element = document.getElementById(`publication-${publicationId}`);
      if (!element) {
        return;
      }

      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('target-publication');
      setTimeout(() => element.classList.remove('target-publication'), 1800);
    }, 0);
  }
}
