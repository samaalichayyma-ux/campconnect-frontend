import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LivraisonService } from '../../../../core/services/livraison.service';

type OrderType = 'CLASSIQUE' | 'REPAS';

interface DemoItem {
  id: number;
  nom: string;
  prix: number;
}

interface CartItem extends DemoItem {
  quantity: number;
}

@Component({
  selector: 'app-demo-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demo-checkout.component.html',
  styleUrl: './demo-checkout.component.css'
})
export class DemoCheckoutComponent implements OnInit {
  private livraisonService = inject(LivraisonService);

  produits: DemoItem[] = [];
  repas: DemoItem[] = [];

  selectedType: OrderType = 'CLASSIQUE';
  cart: CartItem[] = [];

  adresseLivraison = '';
  noteLivraison = '';

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.livraisonService.getDemoProducts().subscribe({
      next: (data) => (this.produits = data),
      error: () => (this.errorMessage = 'Error while loading products')
    });

    this.livraisonService.getDemoRepas().subscribe({
      next: (data) => (this.repas = data),
      error: () => (this.errorMessage = 'Error while loading meals')
    });
  }

  get items(): DemoItem[] {
    return this.selectedType === 'CLASSIQUE' ? this.produits : this.repas;
  }

  get total(): number {
    return this.cart.reduce((sum, item) => sum + item.prix * item.quantity, 0);
  }

  changeType(type: OrderType): void {
    this.selectedType = type;
    this.cart = [];
    this.errorMessage = '';
  }

  addToCart(item: DemoItem): void {
    const existing = this.cart.find(cartItem => cartItem.id === item.id);

    if (existing) {
      existing.quantity += 1;
      return;
    }

    this.cart.push({
      ...item,
      quantity: 1
    });

    this.errorMessage = '';
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity -= 1;
      return;
    }

    this.removeFromCart(item.id);
  }

  increaseQuantity(item: CartItem): void {
    item.quantity += 1;
  }

  removeFromCart(itemId: number): void {
    this.cart = this.cart.filter(item => item.id !== itemId);
  }

  pay(): void {
    if (this.cart.length === 0) {
      this.errorMessage = 'Please add at least one item to your order';
      return;
    }

    if (!this.adresseLivraison || this.adresseLivraison.trim().length < 3) {
      this.errorMessage = 'Please enter a valid delivery address';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const checkoutPayload = {
      items: this.cart.map(item => ({
        id: item.id,
        quantity: item.quantity
      })),
      adresseLivraison: this.adresseLivraison.trim(),
      noteLivraison: this.noteLivraison.trim()
    };

    const checkoutRequest =
      this.selectedType === 'CLASSIQUE'
        ? this.livraisonService.checkoutClassic(checkoutPayload)
        : this.livraisonService.checkoutRepas(checkoutPayload);

    checkoutRequest.subscribe({
      next: (checkoutResponse) => {
        const paymentPayload = {
          commandeId: checkoutResponse.commandeId,
          typeCommande: checkoutResponse.typeCommande,
          total: checkoutResponse.total,
          adresseLivraison: checkoutResponse.adresseLivraison,
          noteLivraison: checkoutResponse.noteLivraison
        };

        this.livraisonService.createDemoPaymentSession(paymentPayload).subscribe({
          next: (paymentResponse) => {
            window.location.href = paymentResponse.checkoutUrl;
          },
          error: (err) => {
            this.errorMessage =
              err?.error?.message ||
              err?.error ||
              'Error while creating payment session';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while creating checkout';
        this.loading = false;
      }
    });
  }
}