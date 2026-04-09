import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { buildAutoCloseAlert } from '../../../../core/utils/auto-close-alert.util';
import { ReclamationService } from '../reclamation.service';

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

  save(): void {
    this.submitted = true;

    if (!this.reclamation.description.trim()) {
      void Swal.fire(
        buildAutoCloseAlert('warning', 'Attention', 'Veuillez saisir la description de la reclamation.')
      );
      return;
    }

    if (!this.reclamation.acceptationDeclaration) {
      void Swal.fire(
        buildAutoCloseAlert('warning', 'Attention', 'Vous devez accepter le traitement des donnees personnelles.')
      );
      return;
    }

    this.reclamation.dateAcceptation = new Date().toISOString();

    this.reclamationService.create(this.reclamation).subscribe({
      next: (res) => {
        console.log('Reclamation ajoutee', res);
        void Swal.fire(
          buildAutoCloseAlert('success', 'Reclamation envoyee', 'Reclamation ajoutee avec succes.')
        );

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
        void Swal.fire(buildAutoCloseAlert('error', 'Erreur', 'Erreur lors de l ajout.'));
      }
    });
  }

  ouvrirDeclaration(): void {
    this.showDeclaration = true;
  }

  fermerDeclaration(): void {
    this.showDeclaration = false;
  }
}
