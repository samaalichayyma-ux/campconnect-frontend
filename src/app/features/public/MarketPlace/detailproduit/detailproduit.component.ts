import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { Product } from '../models/product.model';
import { PanierServiceService } from '../services/panier-service.service';
import { ProduitService } from '../services/produit.service';
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

  tailles: string[] = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
  pointures: number[] = [36, 37, 38, 39, 40, 41, 42, 43, 44];

  selectedTaille = '';
  selectedPointure: number | null = null;

  errorMessage = '';
  successMessage = '';

  detailsPanierEnCours: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProduitService,
    private authService: AuthService,
    private panierService: PanierServiceService,
    private panierCountService: PanierService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));

      if (id) {
        this.selectedImageIndex = 0;
        this.selectedTaille = '';
        this.selectedPointure = null;
        this.errorMessage = '';
        this.successMessage = '';
        this.loadProduit(id);
      }
    });
  }

  loadProduit(id: number): void {
    this.productService.getProductById(id).subscribe({
      next: (data) => {
        this.produit = data;
        this.loadProduitsSimilaires(data.categorie, data.idProduit!);

        this.loadPanierEnCours(() => {
          if (this.isVetement() && this.selectedTaille && !this.isTailleDisponible(this.selectedTaille)) {
            this.selectedTaille = '';
          }

          if (this.isChaussure() && this.selectedPointure !== null && !this.isPointureDisponible(this.selectedPointure)) {
            this.selectedPointure = null;
          }
        });
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

  loadPanierEnCours(callback?: () => void): void {
    const userId = this.authService.getUserId();

    if (!userId || userId <= 0) {
      this.detailsPanierEnCours = [];
      if (callback) callback();
      return;
    }

    this.panierService.getOrCreatePanierEnCours(userId).subscribe({
      next: (panier: any) => {
        const idPanier = panier?.idPanier;

        if (!idPanier) {
          this.detailsPanierEnCours = [];
          if (callback) callback();
          return;
        }

        this.panierService.getDetailsByPanier(idPanier).subscribe({
          next: (details: any[]) => {
            this.detailsPanierEnCours = details || [];
            if (callback) callback();
          },
          error: (err: any) => {
            console.error('Erreur chargement détails panier', err);
            this.detailsPanierEnCours = [];
            if (callback) callback();
          }
        });
      },
      error: (err: any) => {
        console.error('Erreur chargement panier en cours', err);
        this.detailsPanierEnCours = [];
        if (callback) callback();
      }
    });
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  nextImage(): void {
    if (!this.produit?.images?.length) return;
    this.selectedImageIndex =
      (this.selectedImageIndex + 1) % this.produit.images.length;
  }

  previousImage(): void {
    if (!this.produit?.images?.length) return;
    this.selectedImageIndex =
      (this.selectedImageIndex - 1 + this.produit.images.length) % this.produit.images.length;
  }

  isVetement(): boolean {
    return this.produit?.categorie === 'VETEMENT';
  }

  isChaussure(): boolean {
    return this.produit?.categorie === 'CHAUSSURE';
  }

  getQuantiteDansPanierProduitSimple(): number {
    if (!this.produit?.idProduit) return 0;

    return this.detailsPanierEnCours
      .filter(item =>
        item?.produit?.idProduit === this.produit.idProduit &&
        !item?.taille &&
        (item?.pointure === null || item?.pointure === undefined)
      )
      .reduce((sum, item) => sum + (item.quantite || 0), 0);
  }

  getQuantiteDansPanierPourTaille(taille: string): number {
    if (!this.produit?.idProduit) return 0;

    return this.detailsPanierEnCours
      .filter(item =>
        item?.produit?.idProduit === this.produit.idProduit &&
        (item?.taille ?? '').toUpperCase() === taille.toUpperCase()
      )
      .reduce((sum, item) => sum + (item.quantite || 0), 0);
  }

  getQuantiteDansPanierPourPointure(pointure: number): number {
    if (!this.produit?.idProduit) return 0;

    return this.detailsPanierEnCours
      .filter(item =>
        item?.produit?.idProduit === this.produit.idProduit &&
        item?.pointure === pointure
      )
      .reduce((sum, item) => sum + (item.quantite || 0), 0);
  }

  getStockSimpleDisponible(): number {
    if (!this.produit) return 0;

    const stockInitial = this.produit.stock || 0;
    const quantiteDansPanier = this.getQuantiteDansPanierProduitSimple();

    return Math.max(0, stockInitial - quantiteDansPanier);
  }

  getStockTaille(taille: string): number {
    if (!this.produit?.stocks?.length) return 0;

    const stockTaille = this.produit.stocks.find(
      s => (s.taille ?? '').toUpperCase() === taille.toUpperCase()
    );

    const stockInitial = stockTaille ? stockTaille.stock : 0;
    const quantiteDansPanier = this.getQuantiteDansPanierPourTaille(taille);

    return Math.max(0, stockInitial - quantiteDansPanier);
  }

  getStockPointure(pointure: number): number {
    if (!this.produit?.stocks?.length) return 0;

    const stockPointure = this.produit.stocks.find(
      s => s.pointure === pointure
    );

    const stockInitial = stockPointure ? stockPointure.stock : 0;
    const quantiteDansPanier = this.getQuantiteDansPanierPourPointure(pointure);

    return Math.max(0, stockInitial - quantiteDansPanier);
  }

  isTailleDisponible(taille: string): boolean {
    return this.produit?.active !== false && this.getStockTaille(taille) > 0;
  }

  isPointureDisponible(pointure: number): boolean {
    return this.produit?.active !== false && this.getStockPointure(pointure) > 0;
  }

  choisirTaille(taille: string): void {
    if (!this.isTailleDisponible(taille)) return;
    this.selectedTaille = taille;
    this.errorMessage = '';
  }

  choisirPointure(pointure: number): void {
    if (!this.isPointureDisponible(pointure)) return;
    this.selectedPointure = pointure;
    this.errorMessage = '';
  }

  canBuy(): boolean {
    if (!this.produit || this.produit.active === false) {
      return false;
    }

    if (this.isVetement()) {
      return !!this.selectedTaille && this.getStockTaille(this.selectedTaille) > 0;
    }

    if (this.isChaussure()) {
      return this.selectedPointure !== null && this.getStockPointure(this.selectedPointure) > 0;
    }

    return this.getStockSimpleDisponible() > 0;
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

    if (!this.produit || !this.produit.idProduit) {
      this.errorMessage = 'Produit introuvable.';
      return;
    }

    if (this.produit.active === false) {
      this.errorMessage = 'Ce produit est indisponible.';
      return;
    }

    if (this.isVetement()) {
      if (!this.selectedTaille) {
        this.errorMessage = 'Veuillez sélectionner une taille.';
        return;
      }

      if (this.getStockTaille(this.selectedTaille) <= 0) {
        this.errorMessage = 'Cette taille est en rupture de stock.';
        return;
      }
    } else if (this.isChaussure()) {
      if (this.selectedPointure === null) {
        this.errorMessage = 'Veuillez sélectionner une pointure.';
        return;
      }

      if (this.getStockPointure(this.selectedPointure) <= 0) {
        this.errorMessage = 'Cette pointure est en rupture de stock.';
        return;
      }
    } else {
      if (this.getStockSimpleDisponible() <= 0) {
        this.errorMessage = 'Ce produit est en rupture de stock.';
        return;
      }
    }

    const ajouterAuPanier = (userId: number) => {
      this.panierService.getOrCreatePanierEnCours(userId).subscribe({
        next: (panierRes: any) => {
          const idPanier = panierRes?.idPanier;

          if (!idPanier) {
            this.errorMessage = 'Panier introuvable.';
            return;
          }

          const detailPayload: any = {
            panier: {
              idPanier: idPanier
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
              this.successMessage = 'Produit ajouté au panier avec succès.';

              this.loadPanierEnCours(() => {
                const total = this.detailsPanierEnCours.reduce(
                  (sum, item) => sum + (item.quantite || 0),
                  0
                );

                this.panierCountService.setCount(total);

                this.productService.getProductById(this.produit.idProduit!).subscribe({
                  next: (updatedProduct) => {
                    this.produit = updatedProduct;

                    if (this.isVetement()) {
                      if (this.selectedTaille && !this.isTailleDisponible(this.selectedTaille)) {
                        this.selectedTaille = '';
                      }
                    }

                    if (this.isChaussure()) {
                      if (this.selectedPointure !== null && !this.isPointureDisponible(this.selectedPointure)) {
                        this.selectedPointure = null;
                      }
                    }
                  },
                  error: (err) => {
                    console.error('Erreur rechargement produit après ajout', err);
                  }
                });
              });
            },
            error: (err: any) => {
              console.error('Erreur ajout detail panier :', err);
              this.errorMessage = err?.error || 'Impossible d’ajouter le produit au panier.';
            }
          });
        },
        error: (err: any) => {
          console.error('Erreur récupération panier :', err);
          this.errorMessage = err?.error || 'Impossible de récupérer le panier en cours.';
        }
      });
    };

    const userId = this.authService.getUserId();

    if (userId && userId > 0) {
      ajouterAuPanier(userId);
      return;
    }

    this.authService.fetchCurrentUser().subscribe({
      next: (userInfo: any) => {
        const resolvedUserId = Number(
          userInfo?.userId ?? userInfo?.id ?? userInfo?.utilisateurId ?? 0
        );

        if (!resolvedUserId || resolvedUserId <= 0) {
          this.errorMessage = 'Utilisateur introuvable. Veuillez vous reconnecter.';
          return;
        }

        ajouterAuPanier(resolvedUserId);
      },
      error: (err: any) => {
        console.error('ERROR fetchCurrentUser =', err);
        this.errorMessage = 'Utilisateur introuvable. Veuillez vous reconnecter.';
      }
    });
  }

  voirProduit(produit: Product): void {
    this.router.navigate(['/public/detailP', produit.idProduit]);
  }
}