import { Component , OnInit } from '@angular/core';
import { CommandeRepas } from './models/commande-repas.model';
import { CommandeRepasService } from './commande-repas.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-commandes-admin',
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './commandes-admin.component.html',
  styleUrl: './commandes-admin.component.css'
})
export class CommandesAdminComponent implements OnInit {
  commandes: CommandeRepas[] = [];
  loading = false;
  errorMessage = '';

  constructor(private commandeRepasService: CommandeRepasService) {}

  ngOnInit(): void {
    this.loadCommandes();
  }

  loadCommandes(): void {
    this.loading = true;
    this.commandeRepasService.getAllCommandes().subscribe({
      next: (data) => {
        this.commandes = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load meal orders.';
        this.loading = false;
      }
    });
  }

  deleteCommande(id: number): void {
    if (confirm('Are you sure you want to delete this order?')) {
      this.commandeRepasService.deleteCommande(id).subscribe({
        next: () => this.loadCommandes(),
        error: () => {
          this.errorMessage = 'Failed to delete meal order.';
        }
      });
    }
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
}