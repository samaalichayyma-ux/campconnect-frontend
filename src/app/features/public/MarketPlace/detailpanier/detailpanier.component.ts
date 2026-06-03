import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { PanierServiceService } from '../services/panier-service.service';
import { PanierService } from '../../../../core/services/panier.service';
import { RepasPanierService, RepasItem } from '../../../../core/services/repas-panier.service';
import { CommandeRepasService } from '../../restauration/commande-repas.service';
import { ReclamationService } from '../../reclamation/reclamation.service';

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

  repasItems: RepasItem[] = [];
  commandeRepasEnvoyee = false;

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

  // ── Réductions réclamations ──────────────────────────────────────────
  reclamationsAvecReduction: any[] = [];
  reductionReclamationAppliquee = false;
  reductionReclamationId: number | null = null;
  reductionReclamationPercent = 0;
  reductionReclamationAmount = 0;
  reductionReclamationMessage = '';
  reductionReclamationError = '';

  constructor(
    private authService: AuthService,
    private panierApiService: PanierServiceService,
    private panierCountService: PanierService,
    private repasPanier: RepasPanierService,
    private commandeRepasService: CommandeRepasService,
    private reclamationService: ReclamationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPanier();
    this.repasPanier.items$.subscribe(items => {
      this.repasItems = items;
    });
    this.loadReclamationsAvecReduction();
  }

  // ── Réductions réclamations ──────────────────────────────────────────

  loadReclamationsAvecReduction(): void {
    this.reclamationService.getMyReclamations().subscribe({
      next: (data) => {
        this.reclamationsAvecReduction = data.filter(
          r => r.reductionPourcentage != null && r.reductionPourcentage > 0
        );
      },
      error: () => {}
    });
  }

  appliquerReductionReclamation(r: any): void {
    this.reductionReclamationAppliquee = true;
    this.reductionReclamationId = r.id;
    this.reductionReclamationPercent = r.reductionPourcentage;
    this.reductionReclamationAmount = this.getTotalRepas() * (r.reductionPourcentage / 100);
    this.reductionReclamationMessage = `Réduction de ${r.reductionPourcentage}% appliquée sur vos repas.`;
    this.reductionReclamationError = '';
  }

  annulerReductionReclamation(): void {
    this.reductionReclamationAppliquee = false;
    this.reductionReclamationId = null;
    this.reductionReclamationPercent = 0;
    this.reductionReclamationAmount = 0;
    this.reductionReclamationMessage = '';
  }

  getTotalRepasAvecReduction(): number {
    return Math.max(0, this.getTotalRepas() - this.reductionReclamationAmount);
  }

  // ── Panier produits ──────────────────────────────────────────────────

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
      panier: { idPanier: detail?.panier?.idPanier ?? this.idPanier },
      produit: { idProduit: detail?.produit?.idProduit }
    };
  }

  syncCount(): void {
    const total = this.detailsPanier.reduce(
      (sum, item) => sum + Number(item?.quantite || 0), 0
    );
    this.panierCountService.setCount(total);
  }

  getImage(detail: any): string {
    const images = detail?.produit?.images || [];
    return images.length > 0
      ? 'http://localhost:8082/api/uploads/' + images[0]
      : 'assets/images/default.jpg';
  }

  getNomComplet(detail: any): string {
    let nom = detail?.produit?.nom || 'Produit';
    if (detail?.taille) nom += ` - Taille ${detail.taille}`;
    if (detail?.pointure != null) nom += ` - Pointure ${detail.pointure}`;
    return nom;
  }

  getPrix(detail: any): number {
    return Number(detail?.prix || detail?.produit?.prix || 0);
  }

  getSubtotal(detail: any): number {
    return this.getPrix(detail) * Number(detail?.quantite || 0);
  }

  getTotal(): number {
    return this.detailsPanier.reduce((sum, item) => sum + this.getSubtotal(item), 0);
  }

  getTotalAvecReduction(): number {
    return Math.max(0, this.getTotal() - this.discountAmount);
  }

  getDetailId(detail: any): number | null {
    return Number(
      detail?.id ?? detail?.idDetailPanier ?? detail?.detailPanierId ?? 0
    ) || null;
  }

  getStockMax(detail: any): number {
    const produit = detail?.produit;
    if (!produit) return 0;

    if (produit.categorie === 'VETEMENT') {
      const stockTaille = (produit.stocks || []).find(
        (s: any) => (s.taille ?? '').toUpperCase() === (detail?.taille ?? '').toUpperCase()
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
    return Number(detail?.quantite || 0) < this.getStockMax(detail);
  }

  augmenterQuantite(detail: any): void {
    const idDetail = this.getDetailId(detail);
    if (!idDetail) { this.errorMessage = 'Identifiant introuvable.'; return; }
    if (!this.canIncrease(detail)) { this.errorMessage = 'Stock maximum atteint.'; return; }

    const payload = this.buildDetailPayload(detail, Number(detail?.quantite || 0) + 1);
    this.panierApiService.updateDetailPanier(idDetail, payload).subscribe({
      next: () => { this.errorMessage = ''; this.loadPanier(); },
      error: (err) => { this.errorMessage = err?.error || 'Impossible d\'augmenter la quantité.'; }
    });
  }

  diminuerQuantite(detail: any): void {
    const idDetail = this.getDetailId(detail);
    if (!idDetail) { this.errorMessage = 'Identifiant introuvable.'; return; }

    const current = Number(detail?.quantite || 0);
    if (current <= 1) { this.supprimerArticle(idDetail); return; }

    const payload = this.buildDetailPayload(detail, current - 1);
    this.panierApiService.updateDetailPanier(idDetail, payload).subscribe({
      next: () => { this.errorMessage = ''; this.loadPanier(); },
      error: (err) => { this.errorMessage = err?.error || 'Impossible de diminuer la quantité.'; }
    });
  }

  supprimerArticle(idDetail: number): void {
    this.panierApiService.deleteDetailPanier(idDetail).subscribe({
      next: () => { this.errorMessage = ''; this.loadPanier(); },
      error: (err) => { this.errorMessage = err?.error || 'Impossible de supprimer cet article.'; }
    });
  }

  viderPanier(): void {
    const userId = this.authService.getUserId();
    if (!userId || userId <= 0) return;

    this.panierApiService.viderPanierEnCours(userId).subscribe({
      next: () => {
        this.detailsPanier = [];
        this.errorMessage = '';
        this.resetCoupon();
        this.syncCount();
      },
      error: (err) => { this.errorMessage = err?.error || 'Impossible de vider le panier.'; }
    });
  }

  envoyerCouponPremiereCommande(): void {
    const userId = this.authService.getUserId();
    if (!userId || userId <= 0) {
      this.couponErrorMessage = 'Veuillez vous connecter.';
      return;
    }

    this.panierApiService.envoyerCouponPremiereCommande(userId).subscribe({
      next: (res: any) => {
        this.couponSuccessMessage = res?.message || 'Coupon envoyé par email.';
        this.couponErrorMessage = '';
      },
      error: (err) => {
        this.couponErrorMessage = err?.error || 'Impossible d\'envoyer le coupon.';
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
      this.discountAmount = 0; this.couponPercent = 0; this.couponApplied = false;
      return;
    }

    if (code === 'CAMP15') {
      if (total > 200) {
        this.couponErrorMessage = 'Ce coupon n\'est pas valide pour un total supérieur à 200 TND.';
        this.discountAmount = 0; this.couponPercent = 0; this.couponApplied = false;
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
        this.discountAmount = 0; this.couponPercent = 0; this.couponApplied = false;
        return;
      }
      this.couponPercent = 30;
      this.discountAmount = total * 0.30;
      this.couponApplied = true;
      this.couponSuccessMessage = 'Coupon CAMP30 appliqué avec succès.';
      return;
    }

    this.discountAmount = 0; this.couponPercent = 0; this.couponApplied = false;
    this.couponErrorMessage = 'Coupon invalide.';
  }

  recalculerCoupon(): void {
    if (!this.couponApplied) { this.discountAmount = 0; this.couponPercent = 0; return; }

    const total = this.getTotal();
    const code = this.couponCode.trim().toUpperCase();

    if (code === 'CAMP15' && total <= 200) {
      this.couponPercent = 15; this.discountAmount = total * 0.15; return;
    }
    if (code === 'CAMP30' && total > 200) {
      this.couponPercent = 30; this.discountAmount = total * 0.30; return;
    }

    this.couponApplied = false; this.discountAmount = 0; this.couponPercent = 0;
    this.couponErrorMessage = 'Le coupon n\'est plus valide pour le nouveau total.';
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
    if (!userId || userId <= 0) { this.checkoutErrorMessage = 'Veuillez vous connecter.'; return; }

    this.checkoutErrorMessage = '';
    this.checkoutSuccessMessage = '';
    this.checkoutCode = '';
    this.checkoutVerified = false;
    this.showCheckoutPopup = true;

    this.panierApiService.sendCheckoutCode(userId).subscribe({
      next: () => { this.checkoutSuccessMessage = 'Code envoyé par SMS.'; },
      error: (err) => { this.checkoutErrorMessage = err?.error || 'Impossible d\'envoyer le code.'; }
    });
  }

  verifierCodeCheckout(): void {
    const userId = this.authService.getUserId();
    if (!userId || userId <= 0) { this.checkoutErrorMessage = 'Veuillez vous connecter.'; return; }
    if (!this.checkoutCode.trim()) { this.checkoutErrorMessage = 'Veuillez saisir le code.'; return; }

    this.panierApiService.verifyCheckoutCode({ userId, code: this.checkoutCode.trim() }).subscribe({
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
      error: (err) => { this.checkoutErrorMessage = err?.error || 'Code invalide.'; }
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

  // ── Repas ────────────────────────────────────────────────────────────

  retirerRepas(repasId: number): void {
    this.repasPanier.retirer(repasId);
  }

  getTotalRepas(): number {
    return this.repasPanier.getTotal();
  }

  isCloudinaryUrl(url: string): boolean {
    return !!url && (url.startsWith('http://') || url.startsWith('https://'));
  }

  commanderRepas(): void {
    if (this.repasItems.length === 0) return;

    const commande = {
      lignes: this.repasItems.map(i => ({
        repasId: i.repasId,
        quantite: i.quantite
      })),
      // On envoie la réduction si elle a été appliquée
      reductionReclamationId: this.reductionReclamationAppliquee
        ? this.reductionReclamationId
        : null,
      reductionPercent: this.reductionReclamationAppliquee
        ? this.reductionReclamationPercent
        : 0
    };

    this.commandeRepasService.create(commande).subscribe({
      next: () => {
        // Consommer la réduction en base si elle a été appliquée
        if (this.reductionReclamationAppliquee && this.reductionReclamationId) {
          this.reclamationService.consommerReduction(this.reductionReclamationId).subscribe({
            next: () => {
              this.reclamationsAvecReduction = this.reclamationsAvecReduction.filter(
                r => r.id !== this.reductionReclamationId
              );
              this.annulerReductionReclamation();
            },
            error: () => {}
          });
        }
        this.repasPanier.vider();
        this.commandeRepasEnvoyee = true;
      },
      error: () => alert('Erreur lors de la commande des repas')
    });
  }
}