import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ForumService } from '../forum.service';

@Component({
  selector: 'app-forum-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forum-create.component.html',
  styleUrl: './forum-create.component.css'
})
export class ForumCreateComponent {
  nom = '';
  description = '';
  successMessage = '';

  constructor(
    private forumService: ForumService,
    private router: Router
  ) {}

  create(): void {
    this.forumService.create({
      nom: this.nom,
      description: this.description
    }).subscribe({
      next: () => {
        this.successMessage = 'Forum créé avec succès';
        setTimeout(() => {
          this.router.navigate(['/public/forums']);
        }, 800);
      },
      error: (error) => {
        console.error('Erreur création forum :', error);
      }
    });
  }
}