import { Component, OnInit } from '@angular/core';
import { Product } from '../../models/product.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProduitService } from '../../services/MarketPlace/produit.service';
import { PanierServiceService } from '../../services/MarketPlace/panier-service.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PanierService } from '../../../../core/services/panier.service';

@Component({
  selector: 'app-detailproduit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detailproduit.component.html',
  styleUrls: ['./detailproduit.component.css']
})
export class DetailproduitComponent implements OnInit {
  selectedImageIndex = 0;

  produit!: Product;
  produitsSimilaires: Product[] = [];

  tailles: string[] = ['S', 'M', 'L', 'XL', '2XL'];
  pointures: number[] = [36, 37, 38, 39, 40, 41, 42, 43, 44];

  selectedTaille = '';
  selectedPointure: number | null = null;

  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProduitService,
    private authService: AuthService,
    private panierService: PanierServiceService, // backend API
    private panierCountService: PanierService    // compteur navbar
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));

      if (id) {
        this.selectedImageIndex = 0;
        this.selectedTaille = '';
        this.selectedPointure = null;
        this.loadProduit(id);
      }
    });
  }

  loadProduit(id: number): void {
    this.productService.getProductById(id).subscribe({
      next: (data) => {
        this.produit = data;
        this.loadProduitsSimilaires(data.categorie, data.idProduit!);
      },
      error: (err) => {
        console.error('Erreur lors du chargement du produit', err);
      }
    });
  }

  loadProduitsSimilaires(categorie: string, currentId: number): void {
    this.productService.getProduitsPourUser().subscribe({
      next: (data) => {
        this.produitsSimilaires = data.filter(
          p => p.categorie === categorie && p.idProduit !== currentId
        );
      },
      error: (err) => {
        console.error('Erreur lors du chargement des produits similaires', err);
      }
    });
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  nextImage(): void {
    if (!this.produit?.images.length) return;
    this.selectedImageIndex =
      (this.selectedImageIndex + 1) % this.produit.images.length;
  }

  previousImage(): void {
    if (!this.produit?.images.length) return;
    this.selectedImageIndex =
      (this.selectedImageIndex - 1 + this.produit.images.length) % this.produit.images.length;
  }

  isVetement(): boolean {
    return this.produit?.categorie?.toUpperCase() === 'VETEMENT';
  }

  isChaussure(): boolean {
    return this.produit?.categorie?.toUpperCase() === 'CHAUSSURE';
  }

  canBuy(): boolean {
  if (this.produit.active  === false || this.produit.stock === 0) {
    return false;
  }

  if (this.isVetement()) {
    return this.selectedTaille.trim() !== '';
  }

  if (this.isChaussure()) {
    return this.selectedPointure !== null;
  }

  return true;
}

acheter(): void {
  this.errorMessage = '';
  this.successMessage = '';

  if (!this.authService.isLoggedIn()) {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url }
    });
    return;
  }

  if (this.produit.active === false || this.produit.stock === 0) {
    this.errorMessage = 'This product is out of stock.';
    return;
  }

  if (this.isVetement() && !this.selectedTaille) {
    this.errorMessage = 'Please select a size.';
    return;
  }

  if (this.isChaussure() && this.selectedPointure === null) {
    this.errorMessage = 'Please select a shoe size.';
    return;
  }

  const userId = this.authService.getUserId();

  if (!userId) {
    this.errorMessage = 'User id not found. Please login again.';
    return;
  }

  if (!this.produit?.idProduit) {
    this.errorMessage = 'Product not found.';
    return;
  }

  this.panierService.getOrCreatePanierEnCours(userId).subscribe({
    next: (panierRes: any) => {
      const detailPayload: any = {
        panier: {
          idPanier: panierRes.idPanier
        },
        produit: {
          idProduit: this.produit.idProduit
        },
        quantite: 1
      };

      if (this.isVetement()) {
        detailPayload.taille = this.selectedTaille;
      }

      if (this.isChaussure()) {
        detailPayload.pointure = this.selectedPointure;
      }

      this.panierService.ajouterDetailPanier(detailPayload).subscribe({
        next: () => {
          this.successMessage = 'Product added to cart successfully.';
          this.panierCountService.increment();
        },
        error: (err: any) => {
          console.error('Erreur ajout detail panier :', err);
          this.errorMessage = err?.error || 'Unable to add product to cart.';
        }
      });
    },
    error: (err: any) => {
      console.error('Erreur récupération panier :', err);
      this.errorMessage = err?.error || 'Unable to get current cart.';
    }
  });
}

  voirProduit(produit: Product): void {
    this.router.navigate(['/public/detailP', produit.idProduit]);
  }
}