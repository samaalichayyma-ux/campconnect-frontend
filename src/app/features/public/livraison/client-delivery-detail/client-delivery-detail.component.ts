import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import { LivraisonService } from '../../../../core/services/livraison.service';
import { RatingTipComponent } from '../rating-tip/rating-tip.component';

@Component({
  selector: 'app-client-delivery-detail',
  standalone: true,
  imports: [CommonModule, RatingTipComponent],
  templateUrl: './client-delivery-detail.component.html',
  styleUrl: './client-delivery-detail.component.css'
})
export class ClientDeliveryDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private livraisonService = inject(LivraisonService);

  livraisonId!: number;
  livraison: any;

  loading = false;
  errorMessage = '';

  map?: L.Map;
  destinationMarker?: L.Marker;
  livreurMarker?: L.Marker;

  trackingInterval: any = null;
  lastLivreurLocation: any = null;

routeLine?: L.Polyline;
liveDistanceMeters: number | null = null;
etaMinutes: number | null = null;

  ngOnInit(): void {
    this.livraisonId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadLivraison();
  }

  ngOnDestroy(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }

    if (this.map) {
      this.map.remove();
    }
  }

  loadLivraison(): void {
    this.loading = true;

    this.livraisonService.getLivraisonById(this.livraisonId).subscribe({
      next: (res) => {
          console.log('DELIVERY DETAIL RESPONSE:', res);
          console.log('DEST LAT:', res.latitudeLivraison);
          console.log('DEST LNG:', res.longitudeLivraison);

          this.livraison = res;
          this.loading = false;

          setTimeout(() => {
            this.initMap();
            this.loadLivreurLocation();
            this.startTracking();
          }, 100);
        },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while loading delivery details';
      }
    });
  }

destinationIcon = L.divIcon({
  html: '📍',
  className: 'custom-map-marker destination-marker',
  iconSize: [42, 42],
  iconAnchor: [21, 42]
});

livreurIcon = L.divIcon({
  html: '🚚',
  className: 'custom-map-marker livreur-marker',
  iconSize: [42, 42],
  iconAnchor: [21, 42]
});

initMap(): void {
  if (this.livraison?.latitudeLivraison == null || this.livraison?.longitudeLivraison == null) {
    this.errorMessage = 'Delivery destination location is missing';
    return;
  }

  setTimeout(() => {
    const mapElement = document.getElementById('deliveryDetailMap');

    if (!mapElement) {
      this.errorMessage = 'Map container not found';
      return;
    }

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map(mapElement).setView(
      [this.livraison.latitudeLivraison, this.livraison.longitudeLivraison],
      13
    );

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.destinationMarker = L.marker(
  [
    this.livraison.latitudeLivraison,
    this.livraison.longitudeLivraison
  ],
  { icon: this.destinationIcon }
)
  .addTo(this.map)
  .bindPopup('Delivery destination');

    this.map.invalidateSize();

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 500);
  }, 300);
}

  loadLivreurLocation(): void {
    this.livraisonService.getLivreurLocation(this.livraisonId).subscribe({
      next: (loc) => {
        this.lastLivreurLocation = loc;
        this.updateLivreurMarker(loc.latitude, loc.longitude);
      },
      error: () => {
        // Location may not exist yet if livreur has not started.
      }
    });
  }

  startTracking(): void {
    this.trackingInterval = setInterval(() => {
      if (this.livraison?.statut !== 'EN_COURS') {
        return;
      }

      this.loadLivreurLocation();
    }, 3000);
  }
calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusMeters = 6371000;

  const dLat = this.toRadians(lat2 - lat1);
  const dLon = this.toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRadians(lat1)) *
      Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusMeters * c);
}

calculateEtaMinutes(distanceMeters: number | null): number | null {
  if (distanceMeters == null) return null;

  const averageSpeedKmh = 35;
  const distanceKm = distanceMeters / 1000;
  const etaHours = distanceKm / averageSpeedKmh;

  return Math.max(1, Math.ceil(etaHours * 60));
}

formatLiveDistance(): string {
  if (this.liveDistanceMeters == null) return 'Waiting for Delivery person location';

  if (this.liveDistanceMeters >= 1000) {
    return `${(this.liveDistanceMeters / 1000).toFixed(2)} km away`;
  }

  return `${this.liveDistanceMeters} m away`;
}

private toRadians(value: number): number {
  return value * Math.PI / 180;
}

updateLivreurMarker(latitude: number, longitude: number): void {
  if (!this.map) return;

  const livreurLatLng = L.latLng(latitude, longitude);
  const destinationLatLng = L.latLng(
    this.livraison.latitudeLivraison,
    this.livraison.longitudeLivraison
  );

  //  Livreur marker
  if (this.livreurMarker) {
    this.livreurMarker.setLatLng(livreurLatLng);
  } else {
    this.livreurMarker = L.marker(livreurLatLng, {
      icon: this.livreurIcon
    })
      .addTo(this.map)
      .bindPopup('Delivery person current location');
  }

  // ➖ Route line
  if (this.routeLine) {
    this.routeLine.setLatLngs([livreurLatLng, destinationLatLng]);
  } else {
    this.routeLine = L.polyline(
      [livreurLatLng, destinationLatLng],
      {
        weight: 5,
        color: '#1f4b32',
        opacity: 0.9,
        dashArray: '10, 8'
      }
    ).addTo(this.map);
  }

  // 🎯 Fit both points nicely
  this.map.fitBounds(
    L.latLngBounds([livreurLatLng, destinationLatLng]),
    {
      padding: [60, 60],
      maxZoom: 13
    }
  );
}

  getStatusLabel(): string {
    if (!this.livraison) return '';

    if (this.livraison.statut === 'PLANIFIEE') return 'Waiting for Delivery';
    if (this.livraison.statut === 'EN_COURS') return 'Delivery is on the way';
    if (this.livraison.statut === 'LIVREE') return 'Delivered';
    if (this.livraison.statut === 'ECHOUEE') return 'Delivery failed';
    if (this.livraison.statut === 'RETOURNEE') return 'Returned';

    return this.livraison.statut;
  }

  getTrackingText(): string {
    if (!this.livraison) return '';

    if (this.livraison.statut === 'PLANIFIEE') {
      return 'Tracking will start when the Delivery starts delivery.';
    }

    if (this.livraison.statut === 'EN_COURS') {
      return this.lastLivreurLocation
        ? 'Live tracking active.'
        : 'Waiting for Delivery person GPS location...';
    }

    if (this.livraison.statut === 'LIVREE') {
      return 'This delivery has been completed.';
    }

    return 'Tracking unavailable for this status.';
  }

  back(): void {
    this.router.navigate(['/public/my-deliveries']);
  }
}