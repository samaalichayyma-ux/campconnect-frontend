import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { PanierServiceService } from '../services/panier-service.service';
import { PanierService } from '../../../../core/services/panier.service';

@Component({
  selector: 'app-detailpanier',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detailpanier.component.html',
  styleUrls: ['./detailpanier.component.css']
})
export class DetailpanierComponent implements OnInit {
  idPanier: number | null = null;
  detailsPanier: any[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private panierApiService: PanierServiceService,
    private panierCountService: PanierService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPanier();
  }

  loadPanier(): void {
    this.loading = true;
    this.errorMessage = '';

    const userId = this.authService.getUserId();

    if (!userId || userId <= 0) {
      this.loading = false;
      this.errorMessage = 'Veuillez vous connecter.';
      this.detailsPanier = [];
      this.syncCount();
      return;
    }

    this.panierApiService.getOrCreatePanierEnCours(userId).subscribe({
      next: (panier: any) => {
        this.idPanier = panier?.idPanier ?? null;

        if (!this.idPanier) {
          this.loading = false;
          this.detailsPanier = [];
          this.syncCount();
          return;
        }

        this.panierApiService.getDetailsByPanier(this.idPanier).subscribe({
          next: (details: any[]) => {
            this.detailsPanier = details || [];
            this.loading = false;
            this.syncCount();
          },
          error: (err) => {
            console.error('Erreur chargement détails panier', err);
            this.detailsPanier = [];
            this.loading = false;
            this.errorMessage = 'Impossible de charger le panier.';
            this.syncCount();
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement panier', err);
        this.loading = false;
        this.detailsPanier = [];
        this.errorMessage = 'Impossible de charger le panier.';
        this.syncCount();
      }
    });
  }
  buildDetailPayload(detail: any, quantite: number): any {
  return {
    id: this.getDetailId(detail),
    quantite: quantite,
    prix: this.getPrix(detail),
    taille: detail?.taille ?? null,
    pointure: detail?.pointure ?? null,
    panier: {
      idPanier: detail?.panier?.idPanier ?? this.idPanier
    },
    produit: {
      idProduit: detail?.produit?.idProduit
    }
  };
}

  syncCount(): void {
    const total = this.detailsPanier.reduce(
      (sum, item) => sum + Number(item?.quantite || 0),
      0
    );
    this.panierCountService.setCount(total);
  }

  getImage(detail: any): string {
    const images = detail?.produit?.images || [];
    if (images.length > 0) {
      return 'http://localhost:8082/api/uploads/' + images[0];
    }
    return 'assets/images/default.jpg';
  }

  getNomComplet(detail: any): string {
    let nom = detail?.produit?.nom || 'Produit';

    if (detail?.taille) {
      nom += ` - Taille ${detail.taille}`;
    }

    if (detail?.pointure !== null && detail?.pointure !== undefined) {
      nom += ` - Pointure ${detail.pointure}`;
    }

    return nom;
  }

  getPrix(detail: any): number {
    return Number(detail?.prix || detail?.produit?.prix || 0);
  }

  getSubtotal(detail: any): number {
    return this.getPrix(detail) * Number(detail?.quantite || 0);
  }

  getTotal(): number {
    return this.detailsPanier.reduce(
      (sum, item) => sum + this.getSubtotal(item),
      0
    );
  }

  getDetailId(detail: any): number | null {
  return Number(
    detail?.id ??
    detail?.idDetailPanier ??
    detail?.detailPanierId ??
    0
  ) || null;
}
augmenterQuantite(detail: any): void {
  const idDetail = this.getDetailId(detail);

  if (!idDetail) {
    this.errorMessage = 'Identifiant du détail panier introuvable.';
    return;
  }

  const nouvelleQuantite = Number(detail?.quantite || 0) + 1;
  const payload = this.buildDetailPayload(detail, nouvelleQuantite);

  this.panierApiService.updateDetailPanier(idDetail, payload).subscribe({
    next: () => {
      this.loadPanier();
    },
    error: (err) => {
      console.error('Erreur augmentation quantité', err);
      this.errorMessage = err?.error || 'Impossible d’augmenter la quantité.';
    }
  });
}

diminuerQuantite(detail: any): void {
  const idDetail = this.getDetailId(detail);

  if (!idDetail) {
    this.errorMessage = 'Identifiant du détail panier introuvable.';
    return;
  }

  const current = Number(detail?.quantite || 0);

  if (current <= 1) {
    this.supprimerArticle(idDetail);
    return;
  }

  const nouvelleQuantite = current - 1;
  const payload = this.buildDetailPayload(detail, nouvelleQuantite);

  this.panierApiService.updateDetailPanier(idDetail, payload).subscribe({
    next: () => {
      this.loadPanier();
    },
    error: (err) => {
      console.error('Erreur diminution quantité', err);
      this.errorMessage = err?.error || 'Impossible de diminuer la quantité.';
    }
  });
}

  supprimerArticle(idDetail: number): void {
    this.panierApiService.deleteDetailPanier(idDetail).subscribe({
      next: () => {
        this.loadPanier();
      },
      error: (err) => {
        console.error('Erreur suppression article panier', err);
        this.errorMessage = err?.error || 'Impossible de supprimer cet article.';
      }
    });
  }

  viderPanier(): void {
    const userId = this.authService.getUserId();

    if (!userId || userId <= 0) {
      return;
    }

    this.panierApiService.viderPanierEnCours(userId).subscribe({
      next: () => {
        this.detailsPanier = [];
        this.syncCount();
      },
      error: (err) => {
        console.error('Erreur vidage panier', err);
        this.errorMessage = err?.error || 'Impossible de vider le panier.';
      }
    });
  }

  continuerShopping(): void {
    this.router.navigate(['/public/Accueil-Market']);
  }

  passerCommande(): void {
    alert('Checkout à implémenter ensuite.');
  }
}