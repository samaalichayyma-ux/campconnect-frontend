import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { PanierServiceService } from '../services/panier-service.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  detailsPanier: any[] = [];
  subtotal = 0;
  discountAmount = 0;
  couponPercent = 0;
  total = 0;
  idPanier: number | null = null;
  loading = true;

  showPaymentPopup = false;
  paymentPopupTitle = '';
  paymentPopupMessage = '';
  paymentPopupSuccess = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private panierService: PanierServiceService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const paymentStatus = this.route.snapshot.queryParamMap.get('payment_status');
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      this.loading = false;
      this.showPaymentPopup = true;
      this.paymentPopupSuccess = true;
      this.paymentPopupTitle = 'Paiement réussi';
      this.paymentPopupMessage = 'Validation de votre commande...';

      this.panierService.confirmStripePayment({ sessionId }).subscribe({
        next: () => {
          this.paymentPopupMessage = 'Votre commande a été créée avec succès.';
        },
        error: (err) => {
          console.error(err);
          this.paymentPopupSuccess = false;
          this.paymentPopupTitle = 'Erreur';
          this.paymentPopupMessage =
            'Paiement réussi, mais erreur lors de la création de la commande.';
        }
      });

      return;
    }

    if (paymentStatus === 'cancel') {
      this.loading = false;
      this.showPaymentPopup = true;
      this.paymentPopupSuccess = false;
      this.paymentPopupTitle = 'Paiement annulé';
      this.paymentPopupMessage = 'Vous avez annulé le paiement.';
      return;
    }

    const state = history.state;

    this.idPanier = Number(state.idPanier || 0);
    this.detailsPanier = state.detailsPanier || [];
    this.subtotal = Number(state.subtotal || 0);
    this.discountAmount = Number(state.discountAmount || 0);
    this.couponPercent = Number(state.couponPercent || 0);
    this.total = Number(state.total || this.subtotal);

    setTimeout(() => {
      this.loading = false;
    }, 600);

    if (!this.idPanier || this.detailsPanier.length === 0) {
      this.router.navigate(['/public/Accueil-Market']);
    }
  }

  payerAvecStripe(): void {
    const userId = this.authService.getUserId();

    if (!userId || userId <= 0 || !this.idPanier) {
      alert('Utilisateur ou panier introuvable.');
      return;
    }

    this.panierService.createStripeCheckout({
      userId,
      idPanier: this.idPanier,
      total: this.total
    }).subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de la création du paiement Stripe.');
      }
    });
  }

  closePaymentPopup(): void {
    this.showPaymentPopup = false;
    this.router.navigate(['/public/Accueil-Market']);
  }

  getImage(detail: any): string {
    const images = detail?.produit?.images || [];
    return images.length > 0
      ? 'http://localhost:8082/api/uploads/' + images[0]
      : 'assets/images/default.jpg';
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
}