import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Forum, ForumService } from '../services/forum.service';

@Component({
  selector: 'app-forum-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forum-create.component.html',
  styleUrl: './forum-create.component.css'
})
export class ForumCreateComponent {
  forum: Forum = { nom: '', description: '', categorie: '', icon: '🏕️' };

  categories = [
    { value: 'Nature', label: 'Nature', icon: '🌿' },
    { value: 'Équipement', label: 'Équipement', icon: '🎒' },
    { value: 'Conseils', label: 'Conseils', icon: '💡' },
    { value: 'Famille', label: 'Famille', icon: '👨‍👩‍👧‍👦' },
    { value: 'Aventure', label: 'Aventure', icon: '🥾' },
    { value: 'Sécurité', label: 'Sécurité', icon: '🛡️' }
  ];

  icons = ['🏕️','🎒','🌿','🥾','🛡️','💡','👨‍👩‍👧‍👦','🔥','🌊','🏔️','⛺','🌙'];
  errorMessage = '';

  constructor(
    private forumService: ForumService,
    private router: Router
  ) {}

  save(): void {
    if (!this.forum.nom.trim() || !this.forum.description.trim() || !this.forum.categorie.trim()) {
      this.errorMessage = 'Nom, description et catégorie sont obligatoires.';
      return;
    }

    this.errorMessage = ''; // Clear previous errors

    this.forumService.create(this.forum).subscribe({
      next: () => {
        this.router.navigate(['/public/forums']);
      },
      error: (error) => {
        console.error('Erreur création forum:', error);
        this.errorMessage = 'Erreur lors de la création du forum. Vérifiez que le serveur backend est démarré.';
      }
    });
  }
}