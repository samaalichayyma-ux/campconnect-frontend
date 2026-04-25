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
    dateAcceptation: null as string | null,
    image: '' // ajoute un champ pour le nom de l'image
  };

  submitted = false;
  showDeclaration = false;

  constructor(private reclamationService: ReclamationService) {}

  // Gestion du fichier sélectionné : on ne garde que le nom
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.reclamation.image = file.name; // on stocke juste le nom
    }
  }

  // Sauvegarde de la réclamation
  save() {
    this.submitted = true;

    // Validation
    if (!this.reclamation.description.trim()) {
      alert('Veuillez saisir la description.');
      return;
    }

    if (!this.reclamation.acceptationDeclaration) {
      alert('Vous devez accepter le traitement des données personnelles.');
      return;
    }

    // Date acceptation
    this.reclamation.dateAcceptation = new Date().toISOString();

    // Envoi vers le backend (JSON classique)
    this.reclamationService.create(this.reclamation).subscribe({
      next: () => {
        alert('Réclamation ajoutée avec succès');

        // Reset du formulaire
        this.reclamation = {
          description: '',
          statut: 'EN_COURS',
          acceptationDeclaration: false,
          dateAcceptation: null,
          image: ''
        };
        this.submitted = false;
      },
      error: () => {
        alert('Erreur lors de l’ajout');
      }
    });
  }

  // Affichage du modal de déclaration
  ouvrirDeclaration() {
    this.showDeclaration = true;
  }

  // Fermeture du modal de déclaration
  fermerDeclaration() {
    this.showDeclaration = false;
  }
}