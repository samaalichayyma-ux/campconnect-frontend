import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../../core/services/auth.service';
import { Commande } from '../models/commande.model';
import { CommandeUserService } from '../services/commande-user.service';

@Component({
  selector: 'app-mes-commandes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mes-commandes.component.html',
  styleUrls: ['./mes-commandes.component.css']
})
export class MesCommandesComponent implements OnInit {
  private commandeService = inject(CommandeUserService);
  private authService = inject(AuthService);

  commandes: Commande[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.errorMessage = 'Veuillez vous connecter pour consulter vos commandes.';
      this.loading = false;
      return;
    }

    this.loadMesCommandes();
  }

  loadMesCommandes(): void {
    this.loading = true;
    this.errorMessage = '';

    this.commandeService.getMesCommandes().subscribe({
      next: (data) => {
        this.commandes = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement commandes:', err);
        this.errorMessage = 'Impossible de charger les commandes';
        this.loading = false;
      }
    });
  }

  getStatutClass(statut: string): string {
    return statut ? statut.toLowerCase() : '';
  }

  getLivraisonClass(etat: string): string {
    return etat ? etat.toLowerCase() : '';
  }
}
