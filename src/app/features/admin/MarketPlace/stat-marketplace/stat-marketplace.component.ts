import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MarketplaceStatService } from '../service/marketplace-stat.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-stat-marketplace',
  standalone: true,
imports: [CommonModule, RouterModule],  templateUrl: './stat-marketplace.component.html',
  styleUrls: ['./stat-marketplace.component.css']
})
export class StatMarketplaceComponent implements OnInit {

  statsProduits: any[] = [];
  resume: any = null;

  loading = false;
  errorMessage = '';

  constructor(private statService: MarketplaceStatService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;

    this.statService.getStatsProduits().subscribe({
      next: (data) => {
        this.statsProduits = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement des statistiques.';
        this.loading = false;
      }
    });

    this.statService.getResume().subscribe({
      next: (data) => {
        this.resume = data;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  getMaxQuantite(): number {
    if (this.statsProduits.length === 0) return 0;
    return Math.max(...this.statsProduits.map(p => p.quantiteVendue));
  }

  getBarWidth(quantite: number): string {
    const max = this.getMaxQuantite();

    if (max === 0) return '0%';

    return `${(quantite / max) * 100}%`;
  }
}