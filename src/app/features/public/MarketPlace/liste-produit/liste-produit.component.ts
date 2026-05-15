import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Product } from '../models/product.model';
import { ProduitService } from '../services/produit.service';

@Component({
  selector: 'app-liste-produit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './liste-produit.component.html',
  styleUrls: ['./liste-produit.component.css']
})
export class ListeProduitComponent implements OnInit {
  private produitService = inject(ProduitService);
  private router = inject(Router);
  categories: string[] = [
  'TENTE',
  'RECHAUD',
  'VETEMENT',
  'CUISINE',
  'CHAUSSURE'
];
  searchTerm: string = '';
  selectedCategory: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortOption: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 9;

  products: Product[] = [];

  ngOnInit(): void {
    this.loadProduits();
  }

  loadProduits(): void {
    this.produitService.getProduitsPourUser().subscribe({
      next: (data) => {
        this.products = data;
        this.currentPage = 1;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des produits :', err);
      }
    });
  }

  

  get filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();

    let result = this.products.filter(product => {
      const productName = product.nom?.toLowerCase() || '';
      const productCategory = product.categorie?.toLowerCase() || '';
      const productDescription = product.description?.toLowerCase() || '';

      const matchesSearch =
        !term ||
        productName.includes(term) ||
        productCategory.includes(term) ||
        productDescription.includes(term);

      const matchesCategory =
        !this.selectedCategory ||
        product.categorie === this.selectedCategory;

      const matchesMinPrice =
        this.minPrice === null ||
        this.minPrice === undefined ||
        product.prix >= this.minPrice;

      const matchesMaxPrice =
        this.maxPrice === null ||
        this.maxPrice === undefined ||
        product.prix <= this.maxPrice;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });

    switch (this.sortOption) {
      case 'priceAsc':
        result = [...result].sort((a, b) => a.prix - b.prix);
        break;

      case 'priceDesc':
        result = [...result].sort((a, b) => b.prix - a.prix);
        break;

      case 'nameAsc':
        result = [...result].sort((a, b) => a.nom.localeCompare(b.nom));
        break;

      case 'nameDesc':
        result = [...result].sort((a, b) => b.nom.localeCompare(a.nom));
        break;
    }

    return result;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  get paginatedProducts(): Product[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    return this.filteredProducts.slice(startIndex, endIndex);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortOption = '';
    this.currentPage = 1;
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  viewMore(product: Product): void {
    this.router.navigate(['/public/detailP', product.idProduit]);
  }
}