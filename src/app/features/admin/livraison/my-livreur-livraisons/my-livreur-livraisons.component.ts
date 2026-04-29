import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LivraisonService } from '../../../../core/services/livraison.service';
import {
  LivraisonResponse,
  LivraisonStatusUpdateRequest
} from '../../../../models/livraison.model';

@Component({
  selector: 'app-my-livreur-livraisons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-livreur-livraisons.component.html',
  styleUrl: './my-livreur-livraisons.component.css'
})

export class MyLivreurLivraisonsComponent implements OnInit, OnDestroy {
  private livraisonService = inject(LivraisonService);

  livraisons: LivraisonResponse[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';

  currentLat: Record<number, number> = {};
  currentLng: Record<number, number> = {};
  liveDistanceMeters: Record<number, number> = {};

  private simulationIntervals: Record<number, any> = {};

  ngOnInit(): void {
    this.loadLivraisons();
  }

  ngOnDestroy(): void {
    Object.values(this.simulationIntervals).forEach(interval => {
      clearInterval(interval);
    });
  }

  loadLivraisons(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.livraisonService.getMyLivraisons().subscribe({
      next: (data) => {
        this.livraisons = [...data].reverse();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while loading your deliveries';
        this.loading = false;
      }
    });
  }

  canStart(livraison: LivraisonResponse): boolean {
    return livraison.statut === 'PLANIFIEE';
  }

  canDeliver(livraison: LivraisonResponse): boolean {
    return livraison.statut === 'EN_COURS';
  }

  isDelivered(livraison: LivraisonResponse): boolean {
    return livraison.statut === 'LIVREE';
  }

  startDelivery(idLivraison: number): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.livraisonService.updateStatus(idLivraison, {
      statut: 'EN_COURS',
      commentaire: 'Delivery started'
    }).subscribe({
      next: () => {
        this.successMessage = `Delivery #${idLivraison} started`;
        this.loadLivraisons();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while starting delivery';
      }
    });
  }

  startSimulation(livraison: LivraisonResponse): void {
    if (!livraison.latitudeLivraison || !livraison.longitudeLivraison) {
      this.errorMessage = 'Destination coordinates are missing';
      return;
    }

    if (livraison.statut !== 'EN_COURS') {
      this.errorMessage = 'Start the delivery before simulation';
      return;
    }

    const id = livraison.idLivraison;

    if (this.simulationIntervals[id]) {
      clearInterval(this.simulationIntervals[id]);
    }

    let lat = livraison.latitudeLivraison + 0.02;
    let lng = livraison.longitudeLivraison + 0.02;

    this.currentLat[id] = lat;
    this.currentLng[id] = lng;

    this.simulationIntervals[id] = setInterval(() => {
      const destLat = livraison.latitudeLivraison!;
      const destLng = livraison.longitudeLivraison!;

      lat += (destLat - lat) * 0.25;
      lng += (destLng - lng) * 0.25;

      this.currentLat[id] = lat;
      this.currentLng[id] = lng;

      const distance = this.calculateDistanceMeters(
        lat,
        lng,
        destLat,
        destLng
      );

      this.liveDistanceMeters[id] = distance;

      this.livraisonService.updateLivreurLocation(id, {
        latitude: lat,
        longitude: lng
      }).subscribe({
        error: (err) => {
          console.error('Error updating livreur location', err);
        }
      });

      if (distance <= 100) {
        clearInterval(this.simulationIntervals[id]);
        delete this.simulationIntervals[id];

        this.confirmDeliveryAutomatically(livraison);
      }
    }, 2000);
  }

  confirmDeliveryAutomatically(livraison: LivraisonResponse): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.livraisonService.updateStatus(livraison.idLivraison, {
      statut: 'LIVREE',
      preuveLivraison: 'Delivery confirmed automatically by GPS simulation',
      commentaire: 'Livreur reached destination'
    }).subscribe({
      next: () => {
        this.successMessage = `Delivery #${livraison.idLivraison} completed`;
        this.loadLivraisons();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while confirming delivery';
      }
    });
  }

  isNearDestination(livraison: LivraisonResponse): boolean {
    const distance = this.liveDistanceMeters[livraison.idLivraison];
    return distance !== undefined && distance <= 100;
  }

  getDistanceLabel(livraison: LivraisonResponse): string {
    const distance = this.liveDistanceMeters[livraison.idLivraison];

    if (distance === undefined) {
      return 'Waiting for movement';
    }

    if (distance < 1000) {
      return `${Math.round(distance)} m away`;
    }

    return `${(distance / 1000).toFixed(2)} km away`;
  }

  getDistanceClass(livraison: LivraisonResponse): string {
    const distance = this.liveDistanceMeters[livraison.idLivraison];

    if (distance === undefined) {
      return 'distance-unknown';
    }

    return distance <= 100 ? 'distance-near' : 'distance-far';
  }

  private calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const earthRadiusMeters = 6371000;

    const latDistance = this.toRadians(lat2 - lat1);
    const lonDistance = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(lonDistance / 2) *
        Math.sin(lonDistance / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusMeters * c;
  }

  private toRadians(value: number): number {
    return value * Math.PI / 180;
  }
}