import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StockProduitService } from '../service/stock-produit.service';

@Component({
  selector: 'app-stock-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-product.component.html',
  styleUrls: ['./stock-product.component.css']
})
export class StockProductComponent implements OnInit {

  idProduit!: number;
  stocks: any[] = [];
  produit: any = null;

  constructor(
    private route: ActivatedRoute,
    private stockService: StockProduitService
  ) {}

 ngOnInit(): void {
  this.idProduit = Number(this.route.snapshot.paramMap.get('id'));

  this.stockService.getProduitById(this.idProduit).subscribe({
    next: (produit) => {
      this.produit = produit;

      if (produit.categorie === 'VETEMENT' || produit.categorie === 'CHAUSSURE') {
        this.loadStocks();
      } else {
        this.stocks = [
          {
            id: null,
            taille: '-',
            pointure: '-',
            stock: produit.stock,
            global: true
          }
        ];
      }
    },
    error: (err) => console.error(err)
  });
}

  loadStocks(): void {
    this.stockService.getStockByProduit(this.idProduit).subscribe({
      next: (data) => this.stocks = data,
      error: (err) => console.error(err)
    });
  }

  modifierStock(stock: any): void {
  if (stock.global) {
    this.stockService.modifierStockGlobal(this.idProduit, stock.stock).subscribe({
      next: () => {
        alert('Stock modifié');
      },
      error: (err) => console.error(err)
    });
  } else {
    this.stockService.modifierStock(stock.id, stock).subscribe({
      next: () => this.loadStocks(),
      error: (err) => console.error(err)
    });
  }
}

  getEtatStock(stock: number): string {
    if (stock === 0) return 'Rupture';
    if (stock <= 5) return 'Stock faible';
    return 'Disponible';
  }
}