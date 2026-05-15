import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Commande } from '../models/commande';
import { CommandeService } from '../service/commande.service';

@Component({
  selector: 'app-listcommande', // 🔥 change selector
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './listcommande.component.html', // 🔥 corrige nom
  styleUrls: ['./listcommande.component.css']   // 🔥 corrige nom
})
export class ListcommandeComponent implements OnInit { // 🔥 change class

  commandes: Commande[] = [];
  loading = false;
  errorMessage = '';

  private apiUrl = 'http://localhost:8082/api/commandes';

  constructor(
    private http: HttpClient,
    private router: Router,
      private commandeService: CommandeService

  ) {}

  ngOnInit(): void {
    this.loadCommandes();
  }

  telechargerPdfCommandes(): void {
  this.commandeService.telechargerPdfCommandes();
} 
  /* ===== LOAD COMMANDES ===== */

  loadCommandes(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<Commande[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.commandes = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement commandes', err);
        this.errorMessage = 'Impossible de charger les commandes.';
        this.loading = false;
      }
    });
  }

  /* ===== NOM CLIENT ===== */

  getClientName(cmd: Commande): string {
    const user = cmd.utilisateur;

    if (!user) return 'Client';

    return user.nom || user.email || 'Client';
  }

  /* ===== CHANGER STATUT ===== */


  changerStatut(cmd: Commande): void {
    this.http.put(
      `${this.apiUrl}/${cmd.idCommande}/statut`,
      { statut: cmd.statut },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        console.log('Statut mis à jour');
      },
      error: (err) => {
        console.error('Erreur update statut', err);
        this.errorMessage = 'Erreur lors de la mise à jour du statut.';
        this.loadCommandes();
      }
    });
  }

  /* ===== NAVIGATION ===== */

voirDetails(idCommande: number): void {
  this.router.navigate(['/admin/Market/commandes', idCommande, 'details']);
}

 changerEtatLivraison(cmd: Commande): void {
  this.http.put<Commande>(
    `${this.apiUrl}/${cmd.idCommande}/livraison`,
    { etatLivraison: cmd.etatLivraison }
  ).subscribe({
    next: (updatedCmd) => {
      cmd.etatLivraison = updatedCmd.etatLivraison;
      console.log('Livraison mise à jour');
    },
    error: () => {
      this.errorMessage = 'Erreur mise à jour livraison.';
      this.loadCommandes();
    }
  });
}

isAdminOrLivreur(): boolean {
  const role = localStorage.getItem('role');
  return role === 'ADMIN' || role === 'LIVREUR';
}


}