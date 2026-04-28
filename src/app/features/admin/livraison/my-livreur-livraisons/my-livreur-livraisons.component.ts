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
  successMessage = '';
  errorMessage = '';

  currentLatitude?: number;
  currentLongitude?: number;
  watchId?: number;

  readonly confirmationRadiusMeters = 100;

  simulationTimers: Record<number, any> = {};
  autoConfirming: Record<number, boolean> = {};

  private readonly TUNIS_START_LAT = 36.8065;
  private readonly TUNIS_START_LNG = 10.1815;

  ngOnInit(): void {
    this.loadMyLivraisons();
  }

  ngOnDestroy(): void {
    if (this.watchId !== undefined) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    Object.values(this.simulationTimers).forEach(timer => clearInterval(timer));
  }

  loadMyLivraisons(): void {
    this.loading = true;
    this.errorMessage = '';

    this.livraisonService.getMyLivraisons().subscribe({
      next: (data) => {
        this.livraisons = data.reverse();
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

  startDelivery(livraisonId: number): void {
    const payload: LivraisonStatusUpdateRequest = {
      statut: 'EN_COURS',
      commentaire: 'Delivery started',
      preuveLivraison: ''
    };

    this.updateDeliveryStatus(livraisonId, payload);
  }

  startRealTracking(livraisonId: number): void {
    if (!navigator.geolocation) {
      this.errorMessage = 'GPS is not supported by this browser';
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentLatitude = position.coords.latitude;
        this.currentLongitude = position.coords.longitude;

        this.sendLivreurLocation(
          livraisonId,
          position.coords.latitude,
          position.coords.longitude
        );

        const livraison = this.livraisons.find(l => l.idLivraison === livraisonId);
        if (livraison && this.isNearDestination(livraison)) {
          this.autoMarkAsDelivered(
            livraison,
            position.coords.latitude,
            position.coords.longitude
          );
        }
      },
      () => {
        this.errorMessage = 'Please allow GPS access to track delivery distance';
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000
      }
    );
  }

  startSimulation(livraison: any): void {
    const destinationLat = livraison.latitudeLivraison;
    const destinationLng = livraison.longitudeLivraison;

    if (destinationLat == null || destinationLng == null) {
      this.errorMessage =
        'Destination GPS is missing. Please create a new delivery with map location selected.';
      return;
    }

    if (livraison.statut !== 'EN_COURS') {
      this.errorMessage = 'Start the delivery before simulation';
      return;
    }

    if (this.simulationTimers[livraison.idLivraison]) {
      clearInterval(this.simulationTimers[livraison.idLivraison]);
    }

    this.successMessage = '';
    this.errorMessage = '';

    let step = 0;
    const totalSteps = 30;

    const startLat = this.TUNIS_START_LAT;
    const startLng = this.TUNIS_START_LNG;

    this.currentLatitude = startLat;
    this.currentLongitude = startLng;

    this.sendLivreurLocation(livraison.idLivraison, startLat, startLng);

    this.simulationTimers[livraison.idLivraison] = setInterval(() => {
      step++;

      const lat = startLat + ((destinationLat - startLat) * step) / totalSteps;
      const lng = startLng + ((destinationLng - startLng) * step) / totalSteps;

      this.currentLatitude = lat;
      this.currentLongitude = lng;

      this.sendLivreurLocation(livraison.idLivraison, lat, lng);

      if (step >= totalSteps) {
        clearInterval(this.simulationTimers[livraison.idLivraison]);
        delete this.simulationTimers[livraison.idLivraison];

        this.autoMarkAsDelivered(livraison, lat, lng);
      }
    }, 2000);
  }

  stopSimulation(livraisonId: number): void {
    if (this.simulationTimers[livraisonId]) {
      clearInterval(this.simulationTimers[livraisonId]);
      delete this.simulationTimers[livraisonId];
      this.successMessage = `Simulation stopped for delivery #${livraisonId}`;
    }
  }

  sendLivreurLocation(
    livraisonId: number,
    latitude: number,
    longitude: number
  ): void {
    this.livraisonService.updateLivreurLocation(livraisonId, {
      latitude,
      longitude
    }).subscribe({
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Location update failed';
      }
    });
  }

  autoMarkAsDelivered(
    livraison: any,
    latitude: number,
    longitude: number
  ): void {
    if (this.autoConfirming[livraison.idLivraison]) {
      return;
    }

    this.autoConfirming[livraison.idLivraison] = true;

    const payload: LivraisonStatusUpdateRequest = {
      statut: 'LIVREE',
      preuveLivraison: 'GPS_SIMULATION_CONFIRMED',
      commentaire: 'Delivery automatically confirmed by GPS simulation',
      currentLatitude: latitude,
      currentLongitude: longitude
    };

    this.livraisonService.updateStatus(livraison.idLivraison, payload).subscribe({
      next: () => {
        this.successMessage =
          `Delivery #${livraison.idLivraison} completed automatically`;
        this.loadMyLivraisons();
      },
      error: (err) => {
        this.autoConfirming[livraison.idLivraison] = false;
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Auto delivery confirmation failed';
      }
    });
  }

  private updateDeliveryStatus(
    livraisonId: number,
    payload: LivraisonStatusUpdateRequest
  ): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.livraisonService.updateStatus(livraisonId, payload).subscribe({
      next: () => {
        this.successMessage = `Delivery #${livraisonId} updated successfully`;
        this.loadMyLivraisons();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while updating delivery';
      }
    });
  }

  calculateDistanceMeters(livraison: any): number | null {
    if (
      this.currentLatitude == null ||
      this.currentLongitude == null ||
      livraison.latitudeLivraison == null ||
      livraison.longitudeLivraison == null
    ) {
      return null;
    }

    const earthRadiusMeters = 6371000;

    const dLat = this.toRadians(livraison.latitudeLivraison - this.currentLatitude);
    const dLon = this.toRadians(livraison.longitudeLivraison - this.currentLongitude);

    const lat1 = this.toRadians(this.currentLatitude);
    const lat2 = this.toRadians(livraison.latitudeLivraison);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(earthRadiusMeters * c);
  }

  getDistanceLabel(livraison: any): string {
    const meters = this.calculateDistanceMeters(livraison);

    if (meters === null) {
      return 'Simulation not started';
    }

    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km away`;
    }

    return `${meters} m away`;
  }

  isNearDestination(livraison: any): boolean {
    const meters = this.calculateDistanceMeters(livraison);
    return meters !== null && meters <= this.confirmationRadiusMeters;
  }

  getDistanceClass(livraison: any): string {
    const meters = this.calculateDistanceMeters(livraison);

    if (meters === null) return 'distance-unknown';
    if (meters <= this.confirmationRadiusMeters) return 'distance-near';

    return 'distance-far';
  }

  private toRadians(value: number): number {
    return value * Math.PI / 180;
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
}