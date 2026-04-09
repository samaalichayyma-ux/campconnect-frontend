import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ForumService } from '../forum.service';

@Component({
  selector: 'app-forum-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forum-edit.component.html',
  styleUrl: './forum-edit.component.css'
})
export class ForumEditComponent {
  forum: any = {};
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadForum(+id);
    }
  }

  loadForum(id: number): void {
    this.forumService.getById(id).subscribe({
      next: (data) => {
        if (data) this.forum = data;
      },
      error: (error) => {
        console.error('Erreur chargement forum :', error);
      }
    });
  }

  update(): void {
    this.forumService.update(this.forum.id, this.forum).subscribe({
      next: () => {
        this.successMessage = 'Forum modifié avec succès';
        setTimeout(() => {
          this.router.navigate(['/public/forums']);
        }, 800);
      },
      error: (error) => {
        console.error('Erreur modification forum :', error);
      }
    });
  }
}