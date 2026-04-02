import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ProduitService } from '../service/produit.service';
import { Product } from '../models/product.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-list-product',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list-product.component.html',
  styleUrls: ['./list-product.component.css']
})
export class ListProductComponent implements OnInit {
  private produitAdminService = inject(ProduitService);
  private router = inject(Router);

  products: Product[] = [];
  pagedProducts: Product[] = [];

  loading = false;
  errorMessage = '';

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  showDeleteModal = false;
  deleteProductId: number | null = null;

  ngOnInit(): void {
    this.loadProduits();
  }

  loadProduits(): void {
    this.loading = true;
    this.errorMessage = '';

    this.produitAdminService.getAllProduits().subscribe({
      next: (data: Product[]) => {
        console.log('All admin products:', data);
        this.products = data;
        this.currentPage = 1;
        this.updatePagedProducts();
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading admin products:', err);
        this.errorMessage = 'Error loading products';
        this.loading = false;
      }
    });
  }

  updatePagedProducts(): void {
    this.totalPages = Math.ceil(this.products.length / this.itemsPerPage) || 1;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.pagedProducts = this.products.slice(startIndex, endIndex);
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagedProducts();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedProducts();
    }
  }

  viewProduct(product: Product): void {
    if (product.idProduit == null) return;
    this.router.navigate(['/public/detailP', product.idProduit]);
  }

  editProduct(product: Product): void {
    if (product.idProduit == null) return;
    this.router.navigate(['/admin/products/edit', product.idProduit]);
  }

  deactivateProduit(id: number): void {
    this.produitAdminService.deactivateProduit(id).subscribe({
      next: () => this.loadProduits(),
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.errorMessage = 'Error deactivating product';
      }
    });
  }

  activateProduit(id: number): void {
    this.produitAdminService.activateProduit(id).subscribe({
      next: () => this.loadProduits(),
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.errorMessage = 'Error activating product';
      }
    });
  }

  openDeleteModal(): void {
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteProductId = null;
  }

  confirmDelete(): void {
    if (!this.deleteProductId) {
      alert('Please enter a valid product ID');
      return;
    }

    this.produitAdminService.deleteProduit(this.deleteProductId).subscribe({
      next: () => {
        alert('Deleted with success');
        this.closeDeleteModal();
        this.loadProduits();
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        alert('Error deleting product');
      }
    });
  }
}
