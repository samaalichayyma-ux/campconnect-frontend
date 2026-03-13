import { Component } from '@angular/core';
import { ReclamationService } from '../reclamation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reclamation-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reclamation-add.component.html',
  styleUrl: './reclamation-add.component.css'
})
export class ReclamationAddComponent {

  reclamation = {
    description: '',
    statut: 'EN_COURS'
  };

  constructor(private reclamationService: ReclamationService) {}

  save() {
    this.reclamationService.create(this.reclamation).subscribe({
      next: (res) => {
        console.log('Réclamation ajoutée', res);
        alert('Réclamation ajoutée avec succès');
        this.reclamation = {
          description: '',
          statut: 'EN_COURS'
        };
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de l’ajout');
      }
    });
  }
}
