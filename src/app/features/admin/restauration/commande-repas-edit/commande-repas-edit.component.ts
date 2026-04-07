import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommandeRepas, StatutCommandeRepas } from '../commandes-admin/models/commande-repas.model';
import { CommandeRepasService } from '../commandes-admin/commande-repas.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-commande-repas-edit',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './commande-repas-edit.component.html',
  styleUrl: './commande-repas-edit.component.css'
})
export class CommandeRepasEditComponent implements OnInit {
  commande: CommandeRepas = {
    id: 0,
    dateCommande: '',
    montantTotal: 0,
    statut: StatutCommandeRepas.EN_ATTENTE,
    clientNom: '',
    lignes: []
  };

  statuts = Object.values(StatutCommandeRepas);
  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

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
        this.errorMessage = 'Failed to load order.';
        this.loading = false;
      }
    });
  }

  updateCommande(): void {
    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.commandeRepasService.updateCommande(this.commande.id, this.commande).subscribe({
      next: () => {
        this.successMessage = 'Meal order updated successfully.';
        this.submitting = false;
        setTimeout(() => {
          this.router.navigate(['/admin/commande-repas']);
        }, 1000);
      },
      error: () => {
        this.errorMessage = 'Failed to update meal order.';
        this.submitting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/commande-repas']);
  }
}