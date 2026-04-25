import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { Forum, ForumService } from '../services/forum.service';

@Component({
  selector: 'app-forum-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forum-edit.component.html',
  styleUrl: './forum-edit.component.css'
})
export class ForumEditComponent implements OnInit {
  forumId = 0;
  canEdit = false;

  forum: Forum = {
    nom: '',
    description: '',
    categorie: ''
  };

  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.forumId = Number(this.route.snapshot.paramMap.get('id'));

    if (!this.forumId || Number.isNaN(this.forumId)) {
      this.errorMessage = 'Forum invalide.';
      return;
    }

    this.forumService.getById(this.forumId).subscribe({
      next: (data: Forum | undefined) => {
        if (!data) {
          this.errorMessage = 'Forum introuvable.';
          return;
        }

        this.forum = data;
        this.canEdit = this.authService.isAdmin() || this.authService.ownsResource(data.auteurEmail);

        if (!this.canEdit) {
          this.errorMessage = 'Vous ne pouvez modifier que vos forums.';
        }
      },
      error: (err) => {
        console.error('Erreur chargement forum :', err);
        this.errorMessage = 'Erreur lors du chargement du forum.';
      }
    });
  }

  update(): void {
    if (!this.canEdit) {
      this.errorMessage = 'Action non autorisee.';
      return;
    }

    if (!this.forum.nom.trim() || !this.forum.description.trim() || !this.forum.categorie.trim()) {
      this.errorMessage = 'Nom, description et categorie sont obligatoires.';
      return;
    }

    this.forumService.update(this.forumId, this.forum).subscribe({
      next: () => this.router.navigate(['/public/forums']),
      error: (err) => {
        console.error('Erreur modification forum :', err);
        this.errorMessage = 'Erreur lors de la modification du forum.';
      }
    });
  }
}
