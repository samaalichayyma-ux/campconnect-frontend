import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import Swal from 'sweetalert2';
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

interface AddressSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-demo-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demo-checkout.component.html',
  styleUrl: './demo-checkout.component.css'
})
export class DemoCheckoutComponent implements OnInit, AfterViewInit {
  private livraisonService = inject(LivraisonService);

  produits: DemoItem[] = [];
  repas: DemoItem[] = [];

  selectedType: OrderType = 'CLASSIQUE';
  cart: CartItem[] = [];

  adresseLivraison = '';
  noteLivraison = '';

  addressSuggestions: AddressSuggestion[] = [];
  showAddressSuggestions = false;

  selectedLatitude?: number;
  selectedLongitude?: number;

  lastCheckout: any = null;

  loading = false;
  errorMessage = '';

  private autoCalculateTimer: any = null;
  private addressTimer: any = null;

  private map?: L.Map;
  private deliveryMarker?: L.Marker;

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  loadData(): void {
    this.livraisonService.getDemoProducts().subscribe({
      next: (data) => (this.produits = data),
      error: () => this.showError('Products Error', 'Error while loading products')
    });

    this.livraisonService.getDemoRepas().subscribe({
      next: (data) => (this.repas = data),
      error: () => this.showError('Meals Error', 'Error while loading meals')
    });
  }

  private initMap(): void {
    this.map = L.map('deliveryMap').setView([36.8065, 10.1815], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.setSelectedLocation(event.latlng.lat, event.latlng.lng, true);
    });

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 300);
  }

  private setSelectedLocation(
    latitude: number,
    longitude: number,
    moveMap: boolean
  ): void {
    this.selectedLatitude = latitude;
    this.selectedLongitude = longitude;

    const latLng = L.latLng(latitude, longitude);

    if (this.deliveryMarker) {
      this.deliveryMarker.setLatLng(latLng);
    } else {
      this.deliveryMarker = L.marker(latLng).addTo(this.map!);
    }

    if (moveMap) {
      this.map?.setView(latLng, 15);
    }

    this.lastCheckout = null;
    this.errorMessage = '';
    this.scheduleAutoCalculate();
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
    this.lastCheckout = null;
    this.errorMessage = '';
    this.clearAutoCalculateTimer();

    Swal.fire({
      icon: 'info',
      title: type === 'CLASSIQUE' ? 'Products selected' : 'Meals selected',
      timer: 900,
      showConfirmButton: false
    });
  }

  addToCart(item: DemoItem): void {
    const existing = this.cart.find(cartItem => cartItem.id === item.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({ ...item, quantity: 1 });
    }

    this.lastCheckout = null;
    this.errorMessage = '';
    this.scheduleAutoCalculate();
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      this.removeFromCart(item.id);
      return;
    }

    this.lastCheckout = null;
    this.scheduleAutoCalculate();
  }

  increaseQuantity(item: CartItem): void {
    item.quantity += 1;
    this.lastCheckout = null;
    this.scheduleAutoCalculate();
  }

  removeFromCart(itemId: number): void {
    this.cart = this.cart.filter(item => item.id !== itemId);
    this.lastCheckout = null;
    this.scheduleAutoCalculate();
  }

  onAddressInputChange(): void {
    this.lastCheckout = null;
    this.errorMessage = '';

    if (this.addressTimer) {
      clearTimeout(this.addressTimer);
    }

    const query = this.adresseLivraison.trim();

    if (query.length < 3) {
      this.addressSuggestions = [];
      this.showAddressSuggestions = false;
      return;
    }

    this.addressTimer = setTimeout(() => {
      this.livraisonService.getAddressSuggestions(query).subscribe({
        next: (res) => {
          this.addressSuggestions = res;
          this.showAddressSuggestions = res.length > 0;
        },
        error: () => {
          this.addressSuggestions = [];
          this.showAddressSuggestions = false;
        }
      });
    }, 500);
  }

  selectAddressSuggestion(suggestion: AddressSuggestion): void {
    this.adresseLivraison = suggestion.displayName;
    this.addressSuggestions = [];
    this.showAddressSuggestions = false;

    this.setSelectedLocation(
      suggestion.latitude,
      suggestion.longitude,
      true
    );
  }

  onDeliveryDetailsChange(): void {
    this.lastCheckout = null;
    this.errorMessage = '';
    this.scheduleAutoCalculate();
  }

  private scheduleAutoCalculate(): void {
    this.clearAutoCalculateTimer();

    if (!this.canAutoCalculate()) {
      return;
    }

    this.autoCalculateTimer = setTimeout(() => {
      this.calculateFees();
    }, 800);
  }

  private clearAutoCalculateTimer(): void {
    if (this.autoCalculateTimer) {
      clearTimeout(this.autoCalculateTimer);
      this.autoCalculateTimer = null;
    }
  }

  private canAutoCalculate(): boolean {
    return (
      this.cart.length > 0 &&
      this.adresseLivraison.trim().length >= 3 &&
      this.selectedLatitude != null &&
      this.selectedLongitude != null
    );
  }

  calculateFees(): void {
    if (!this.canAutoCalculate()) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.lastCheckout = null;

    const payload = {
      items: this.cart.map(item => ({
        id: item.id,
        quantity: item.quantity
      })),
      adresseLivraison: this.adresseLivraison.trim(),
      noteLivraison: this.noteLivraison.trim(),
      latitude: this.selectedLatitude,
      longitude: this.selectedLongitude
    };

    const request =
      this.selectedType === 'CLASSIQUE'
        ? this.livraisonService.checkoutClassic(payload)
        : this.livraisonService.checkoutRepas(payload);

    request.subscribe({
      next: (res) => {
        this.lastCheckout = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;

        const message =
          err?.error?.message ||
          err?.error ||
          'Error while calculating delivery fees';

        this.showError('Delivery Fee Error', message);
      }
    });
  }

  getWeatherClass(): string {
    if (!this.lastCheckout) return '';

    const temp = this.lastCheckout.temperature;

    if (temp >= 35) return 'weather-hot';
    if (temp <= 10) return 'weather-cold';

    return 'weather-normal';
  }

  pay(): void {
    if (!this.lastCheckout) {
      Swal.fire({
        icon: 'warning',
        title: 'Checkout not ready',
        text: 'Please select items, enter an address, and choose the exact map location first.',
        confirmButtonColor: '#1f4b32'
      });
      return;
    }

    Swal.fire({
      icon: 'question',
      title: 'Proceed to payment?',
      text: `Total to pay: ${Number(this.lastCheckout.finalTotal).toFixed(2)} DT`,
      showCancelButton: true,
      confirmButtonText: 'Pay with Stripe',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#1f4b32',
      cancelButtonColor: '#8f2525'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.createStripeSession();
    });
  }

  private createStripeSession(): void {
    this.loading = true;
    this.errorMessage = '';

    Swal.fire({
      title: 'Redirecting to Stripe...',
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const paymentPayload = {
      commandeId: this.lastCheckout.commandeId,
      typeCommande: this.lastCheckout.typeCommande,
      total: this.lastCheckout.finalTotal,
      adresseLivraison: this.lastCheckout.adresseLivraison,
      noteLivraison: this.lastCheckout.noteLivraison,

      latitudeLivraison: this.lastCheckout.latitude,
      longitudeLivraison: this.lastCheckout.longitude,

      distanceKm: this.lastCheckout.distanceKm,
      poidsKg: this.lastCheckout.poidsKg,
      fraisDistance: this.lastCheckout.distanceFee,
      fraisPoids: this.lastCheckout.weightFee,
      fraisMeteo: this.lastCheckout.weatherSurcharge,
      fraisLivraisonTotal: this.lastCheckout.deliveryFee,
      meteoCondition: this.lastCheckout.weatherCondition
    };

    this.livraisonService.createDemoPaymentSession(paymentPayload).subscribe({
      next: (res) => {
        Swal.close();
        window.location.href = res.checkoutUrl;
      },
      error: (err) => {
        this.loading = false;
        Swal.close();

        const message =
          err?.error?.message ||
          err?.error ||
          'Error while creating payment session';

        this.showError('Payment Error', message);
      }
    });
  }

  private showError(title: string, text: string): void {
    this.errorMessage = text;

    Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonColor: '#8f2525'
    });
  }
}