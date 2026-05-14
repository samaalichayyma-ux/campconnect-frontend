import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { PanierServiceService } from '../services/panier-service.service';
import { PanierService } from '../../../../core/services/panier.service';

@Component({
  selector: 'app-detailpanier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detailpanier.component.html',
  styleUrls: ['./detailpanier.component.css']
})
export class DetailpanierComponent implements OnInit {
  idPanier: number | null = null;
  detailsPanier: any[] = [];
  loading = false;
  errorMessage = '';

  couponCode = '';
  couponSuccessMessage = '';
  couponErrorMessage = '';
  discountAmount = 0;
  couponPercent = 0;
  couponApplied = false;

  showCheckoutPopup = false;
  checkoutCode = '';
  checkoutErrorMessage = '';
  checkoutSuccessMessage = '';
  checkoutVerified = false;

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

            if (this.couponApplied) {
              this.recalculerCoupon();
            }
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

  getTotalAvecReduction(): number {
    return Math.max(0, this.getTotal() - this.discountAmount);
  }

  getDetailId(detail: any): number | null {
    return Number(
      detail?.id ??
      detail?.idDetailPanier ??
      detail?.detailPanierId ??
      0
    ) || null;
  }

  getStockMax(detail: any): number {
    const produit = detail?.produit;

    if (!produit) return 0;

    if (produit.categorie === 'VETEMENT') {
      const stockTaille = (produit.stocks || []).find(
        (s: any) =>
          (s.taille ?? '').toUpperCase() === (detail?.taille ?? '').toUpperCase()
      );
      return Number(stockTaille?.stock || 0);
    }

    if (produit.categorie === 'CHAUSSURE') {
      const stockPointure = (produit.stocks || []).find(
        (s: any) => s.pointure === detail?.pointure
      );
      return Number(stockPointure?.stock || 0);
    }

    return Number(produit.stock || 0);
  }

  canIncrease(detail: any): boolean {
    const quantite = Number(detail?.quantite || 0);
    const stockMax = this.getStockMax(detail);
    return quantite < stockMax;
  }

  augmenterQuantite(detail: any): void {
    const idDetail = this.getDetailId(detail);

    if (!idDetail) {
      this.errorMessage = 'Identifiant du détail panier introuvable.';
      return;
    }

    if (!this.canIncrease(detail)) {
      this.errorMessage = 'Stock maximum atteint pour ce produit.';
      return;
    }

    const nouvelleQuantite = Number(detail?.quantite || 0) + 1;
    const payload = this.buildDetailPayload(detail, nouvelleQuantite);

    this.panierApiService.updateDetailPanier(idDetail, payload).subscribe({
      next: () => {
        this.errorMessage = '';
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
        this.errorMessage = '';
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
        this.errorMessage = '';
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
        this.errorMessage = '';
        this.resetCoupon();
        this.syncCount();
      },
      error: (err) => {
        console.error('Erreur vidage panier', err);
        this.errorMessage = err?.error || 'Impossible de vider le panier.';
      }
    });
  }

  envoyerCouponPremiereCommande(): void {
    const userId = this.authService.getUserId();

    if (!userId || userId <= 0) {
      this.couponErrorMessage = 'Veuillez vous connecter.';
      this.couponSuccessMessage = '';
      return;
    }

    this.panierApiService.envoyerCouponPremiereCommande(userId).subscribe({
      next: (res: any) => {
        this.couponSuccessMessage = res?.message || 'Coupon envoyé par email.';
        this.couponErrorMessage = '';
      },
      error: (err) => {
        console.error('Erreur envoi coupon', err);
        this.couponErrorMessage = err?.error || 'Impossible d’envoyer le coupon.';
        this.couponSuccessMessage = '';
      }
    });
  }

  appliquerCoupon(): void {
    this.couponErrorMessage = '';
    this.couponSuccessMessage = '';

    const total = this.getTotal();
    const code = this.couponCode.trim().toUpperCase();

    if (!code) {
      this.couponErrorMessage = 'Veuillez entrer un coupon.';
      this.discountAmount = 0;
      this.couponPercent = 0;
      this.couponApplied = false;
      return;
    }

    if (code === 'CAMP15') {
      if (total > 200) {
        this.couponErrorMessage = 'Ce coupon n’est pas valide pour un total supérieur à 200 TND.';
        this.discountAmount = 0;
        this.couponPercent = 0;
        this.couponApplied = false;
        return;
      }

      this.couponPercent = 15;
      this.discountAmount = total * 0.15;
      this.couponApplied = true;
      this.couponSuccessMessage = 'Coupon CAMP15 appliqué avec succès.';
      return;
    }

    if (code === 'CAMP30') {
      if (total <= 200) {
        this.couponErrorMessage = 'Ce coupon est valide uniquement pour un total supérieur à 200 TND.';
        this.discountAmount = 0;
        this.couponPercent = 0;
        this.couponApplied = false;
        return;
      }

      this.couponPercent = 30;
      this.discountAmount = total * 0.30;
      this.couponApplied = true;
      this.couponSuccessMessage = 'Coupon CAMP30 appliqué avec succès.';
      return;
    }

    this.discountAmount = 0;
    this.couponPercent = 0;
    this.couponApplied = false;
    this.couponErrorMessage = 'Coupon invalide.';
  }

  recalculerCoupon(): void {
    if (!this.couponApplied) {
      this.discountAmount = 0;
      this.couponPercent = 0;
      return;
    }

    const total = this.getTotal();
    const code = this.couponCode.trim().toUpperCase();

    if (code === 'CAMP15' && total <= 200) {
      this.couponPercent = 15;
      this.discountAmount = total * 0.15;
      return;
    }

    if (code === 'CAMP30' && total > 200) {
      this.couponPercent = 30;
      this.discountAmount = total * 0.30;
      return;
    }

    this.couponApplied = false;
    this.discountAmount = 0;
    this.couponPercent = 0;
    this.couponErrorMessage = 'Le coupon n’est plus valide pour le nouveau total.';
  }

  resetCoupon(): void {
    this.couponCode = '';
    this.couponSuccessMessage = '';
    this.couponErrorMessage = '';
    this.discountAmount = 0;
    this.couponPercent = 0;
    this.couponApplied = false;
  }

  passerCommande(): void {
    const userId = this.authService.getUserId();

    if (!userId || userId <= 0) {
      this.checkoutErrorMessage = 'Veuillez vous connecter.';
      return;
    }

    this.checkoutErrorMessage = '';
    this.checkoutSuccessMessage = '';
    this.checkoutCode = '';
    this.checkoutVerified = false;
    this.showCheckoutPopup = true;

    this.panierApiService.sendCheckoutCode(userId).subscribe({
      next: () => {
        this.checkoutSuccessMessage = 'Code envoyé par SMS.';
      },
      error: (err) => {
        console.error('Erreur envoi code checkout', err);
        this.checkoutErrorMessage = err?.error || 'Impossible d’envoyer le code.';
      }
    });
  }

  verifierCodeCheckout(): void {
    const userId = this.authService.getUserId();

    if (!userId || userId <= 0) {
      this.checkoutErrorMessage = 'Veuillez vous connecter.';
      return;
    }

    if (!this.checkoutCode.trim()) {
      this.checkoutErrorMessage = 'Veuillez saisir le code.';
      return;
    }

    this.panierApiService.verifyCheckoutCode({
      userId,
      code: this.checkoutCode.trim()
    }).subscribe({
      next: () => {
        this.checkoutVerified = true;
        this.checkoutErrorMessage = '';
        this.checkoutSuccessMessage = 'Code validé. Redirection vers paiement...';

        setTimeout(() => {
  this.fermerCheckoutPopup();

 this.router.navigate(['/public/payment'], {
  state: {
    idPanier: this.idPanier,
    detailsPanier: this.detailsPanier,
    subtotal: this.getTotal(),
    discountAmount: this.discountAmount,
    couponPercent: this.couponPercent,
    total: this.getTotalAvecReduction()
  }
});
}, 800);
      },
      error: (err) => {
        console.error('Erreur vérification code checkout', err);
        this.checkoutErrorMessage = err?.error || 'Code invalide.';
      }
    });
  }

  fermerCheckoutPopup(): void {
    this.showCheckoutPopup = false;
    this.checkoutCode = '';
    this.checkoutErrorMessage = '';
    this.checkoutSuccessMessage = '';
  }

  continuerShopping(): void {
    this.router.navigate(['/public/Accueil-Market']);
  }
}