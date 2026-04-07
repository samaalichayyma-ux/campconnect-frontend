import { Component , OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommandeRepas, LigneCommandeRepas } from '../commandes-admin/models/commande-repas.model';
import { CommandeRepasService } from '../commandes-admin/commande-repas.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-commande-repas-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './commande-repas-details.component.html',
  styleUrl: './commande-repas-details.component.css'
})
export class CommandeRepasDetailsComponent implements OnInit {
  commande!: CommandeRepas;
  loading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private commandeRepasService: CommandeRepasService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadCommande(id);
    }
  }

  loadCommande(id: number): void {
    this.loading = true;
    this.commandeRepasService.getCommandeById(id).subscribe({
      next: (data) => {
        this.commande = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load order details.';
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'EN_ATTENTE':
        return 'pending';
      case 'CONFIRMEE':
        return 'confirmed';
      case 'EN_PREPARATION':
        return 'preparing';
      case 'LIVREE':
        return 'delivered';
      default:
        return '';
    }
  }

  getTotalLignes(lignes?: LigneCommandeRepas[]): number {
    if (!lignes || lignes.length === 0) return 0;
    return lignes.reduce((total, ligne) => total + (ligne.quantite * ligne.prixUnitaire), 0);
  }

  goBack(): void {
    this.router.navigate(['/admin/commande-repas']);
  }
}