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
    statut: 'EN_COURS',
    acceptationDeclaration: false,
    dateAcceptation: null as string | null
  };

  submitted = false;
  showDeclaration = false;

  constructor(private reclamationService: ReclamationService) {}

  save() {
    this.submitted = true;

    if (!this.reclamation.description.trim()) {
      alert('Veuillez saisir la description de la réclamation.');
      return;
    }

    if (!this.reclamation.acceptationDeclaration) {
      alert('Vous devez accepter le traitement des données personnelles.');
      return;
    }

    this.reclamation.dateAcceptation = new Date().toISOString();

    this.reclamationService.create(this.reclamation).subscribe({
      next: (res) => {
        console.log('Réclamation ajoutée', res);
        alert('Réclamation ajoutée avec succès');

        this.reclamation = {
          description: '',
          statut: 'EN_COURS',
          acceptationDeclaration: false,
          dateAcceptation: null
        };

        this.submitted = false;
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de l’ajout');
      }
    });
  }

  ouvrirDeclaration() {
    this.showDeclaration = true;
  }

  fermerDeclaration() {
    this.showDeclaration = false;
  }
}