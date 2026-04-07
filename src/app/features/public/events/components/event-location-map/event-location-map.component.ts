import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';

import { EventLocationSelection } from '../../models/event.model';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';

@Component({
  selector: 'app-event-location-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-location-map.component.html',
  styleUrl: './event-location-map.component.css'
})
export class EventLocationMapComponent implements AfterViewInit, OnChanges {
  @Input() address = '';
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Input() placeId: string | null = null;
  @Input() googleMapsUrl: string | null = null;
  @Input() editable = false;

  @Output() locationSelected = new EventEmitter<EventLocationSelection>();

  @ViewChild('mapHost') private mapHost?: ElementRef<HTMLDivElement>;
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  isLoading = true;
  googleMapsAvailable = false;
  statusMessage = '';
  selectedAddress = '';
  selectedCoordinates = '';
  directionsUrl = '';

  private map: any = null;
  private marker: any = null;
  private geocoder: any = null;
  private autocomplete: any = null;
  private isApplyingExternalLocation = false;

  constructor(private googleMapsLoader: GoogleMapsLoaderService) {}

  async ngAfterViewInit(): Promise<void> {
    await this.initializeMap();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['address']) {
      this.selectedAddress = this.address?.trim() || '';
    }

    this.updateCoordinateLabel();
    this.directionsUrl = this.buildDirectionsUrl();

    if (this.map) {
      await this.syncMapWithInputs();
    }
  }

  async geocodeTypedAddress(): Promise<void> {
    const typedAddress = this.searchInput?.nativeElement.value.trim() || '';
    if (!typedAddress) {
      return;
    }

    await this.geocodeAddress(typedAddress, true);
  }

  private async initializeMap(): Promise<void> {
    this.selectedAddress = this.address?.trim() || '';
    this.updateCoordinateLabel();
    this.directionsUrl = this.buildDirectionsUrl();

    try {
      const config = await this.googleMapsLoader.loadGoogleMaps();
      const googleMaps = this.googleMapsLoader.getGoogleMaps();

      if (!config.enabled || !googleMaps?.maps || !this.mapHost) {
        this.isLoading = false;
        this.googleMapsAvailable = false;
        this.statusMessage = 'Google Maps is not configured yet. You can still save the address, and the map will start working as soon as the browser key is added.';
        return;
      }

      this.googleMapsAvailable = true;
      this.geocoder = new googleMaps.maps.Geocoder();
      this.map = new googleMaps.maps.Map(this.mapHost.nativeElement, {
        center: { lat: 20, lng: 0 },
        zoom: this.hasCoordinates() ? 13 : 2,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        clickableIcons: false
      });
      this.marker = new googleMaps.maps.Marker({
        map: this.map,
        draggable: this.editable,
        visible: false
      });

      if (this.editable) {
        this.bindEditableInteractions(googleMaps);
      }

      await this.syncMapWithInputs();
      this.isLoading = false;
    } catch {
      this.isLoading = false;
      this.googleMapsAvailable = false;
      this.statusMessage = 'Google Maps failed to load in the browser. Check the browser key restrictions and try again.';
    }
  }

  private bindEditableInteractions(googleMaps: NonNullable<ReturnType<GoogleMapsLoaderService['getGoogleMaps']>>): void {
    this.map.addListener('click', async (event: { latLng?: { lat: () => number; lng: () => number } }) => {
      const latitude = event.latLng?.lat();
      const longitude = event.latLng?.lng();

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return;
      }

      const reverseGeocodedLocation = await this.reverseGeocode(latitude, longitude);
      this.applySelectedLocation(
        latitude,
        longitude,
        reverseGeocodedLocation.address,
        reverseGeocodedLocation.placeId,
        true
      );
    });

    this.marker.addListener('dragend', async (event: { latLng?: { lat: () => number; lng: () => number } }) => {
      const latitude = event.latLng?.lat();
      const longitude = event.latLng?.lng();

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return;
      }

      const reverseGeocodedLocation = await this.reverseGeocode(latitude, longitude);
      this.applySelectedLocation(
        latitude,
        longitude,
        reverseGeocodedLocation.address,
        reverseGeocodedLocation.placeId,
        true
      );
    });

    if (googleMaps.maps.places?.Autocomplete && this.searchInput) {
      this.autocomplete = new googleMaps.maps.places.Autocomplete(this.searchInput.nativeElement, {
        fields: ['formatted_address', 'geometry', 'name', 'place_id']
      });
      this.autocomplete.addListener('place_changed', () => {
        const place = this.autocomplete.getPlace();
        const resolvedLatitude = place?.geometry?.location?.lat?.();
        const resolvedLongitude = place?.geometry?.location?.lng?.();

        if (typeof resolvedLatitude !== 'number' || typeof resolvedLongitude !== 'number') {
          return;
        }

        const resolvedAddress = (place.formatted_address || place.name || this.searchInput?.nativeElement.value || '').trim();
        this.applySelectedLocation(
          resolvedLatitude,
          resolvedLongitude,
          resolvedAddress,
          place.place_id ?? null,
          true
        );
      });
    }
  }

  private async syncMapWithInputs(): Promise<void> {
    if (!this.map || !this.marker) {
      return;
    }

    if (this.hasCoordinates()) {
      this.applySelectedLocation(
        this.latitude as number,
        this.longitude as number,
        this.selectedAddress,
        this.placeId,
        false
      );
      return;
    }

    if (this.selectedAddress) {
      await this.geocodeAddress(this.selectedAddress, false);
      return;
    }

    this.marker.setVisible(false);
  }

  private async geocodeAddress(address: string, emitSelection: boolean): Promise<void> {
    if (!this.geocoder) {
      return;
    }

    const geocodedLocation = await new Promise<{
      address: string;
      latitude: number | null;
      longitude: number | null;
      placeId: string | null;
    }>((resolve) => {
      this.geocoder.geocode({ address }, (results: any[] | null, status: string) => {
        if (status === 'OK' && Array.isArray(results) && results.length > 0) {
          const topResult = results[0];
          resolve({
            address: topResult.formatted_address || address,
            latitude: topResult.geometry?.location?.lat?.() ?? null,
            longitude: topResult.geometry?.location?.lng?.() ?? null,
            placeId: topResult.place_id ?? null
          });
          return;
        }

        resolve({
          address,
          latitude: null,
          longitude: null,
          placeId: null
        });
      });
    });

    if (typeof geocodedLocation.latitude !== 'number' || typeof geocodedLocation.longitude !== 'number') {
      return;
    }

    this.applySelectedLocation(
      geocodedLocation.latitude,
      geocodedLocation.longitude,
      geocodedLocation.address,
      geocodedLocation.placeId,
      emitSelection
    );
  }

  private async reverseGeocode(latitude: number, longitude: number): Promise<{ address: string; placeId: string | null }> {
    if (!this.geocoder) {
      return {
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        placeId: null
      };
    }

    return new Promise<{ address: string; placeId: string | null }>((resolve) => {
      this.geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results: any[] | null, status: string) => {
        if (status === 'OK' && Array.isArray(results) && results.length > 0) {
          const topResult = results[0];
          resolve({
            address: topResult.formatted_address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            placeId: topResult.place_id ?? null
          });
          return;
        }

        resolve({
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          placeId: null
        });
      });
    });
  }

  private applySelectedLocation(
    latitude: number,
    longitude: number,
    address: string,
    placeId: string | null,
    emitSelection: boolean
  ): void {
    this.selectedAddress = address || this.selectedAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    this.selectedCoordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    this.directionsUrl = this.googleMapsUrl?.trim() || this.buildDirectionsUrl(latitude, longitude, this.selectedAddress);

    this.marker.setPosition({ lat: latitude, lng: longitude });
    this.marker.setVisible(true);
    this.map.setCenter({ lat: latitude, lng: longitude });
    if ((this.map.getZoom?.() ?? 0) < 12) {
      this.map.setZoom(13);
    }

    if (!emitSelection) {
      return;
    }

    this.isApplyingExternalLocation = true;
    this.locationSelected.emit({
      latitude,
      longitude,
      address: this.selectedAddress,
      placeId
    });
    queueMicrotask(() => {
      this.isApplyingExternalLocation = false;
    });
  }

  private updateCoordinateLabel(): void {
    if (!this.hasCoordinates()) {
      this.selectedCoordinates = '';
      return;
    }

    this.selectedCoordinates = `${(this.latitude as number).toFixed(6)}, ${(this.longitude as number).toFixed(6)}`;
  }

  private hasCoordinates(): boolean {
    return typeof this.latitude === 'number' && typeof this.longitude === 'number';
  }

  private buildDirectionsUrl(
    latitude = this.latitude ?? undefined,
    longitude = this.longitude ?? undefined,
    address = this.selectedAddress || this.address
  ): string {
    if (this.googleMapsUrl?.trim()) {
      return this.googleMapsUrl.trim();
    }

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
    }

    if (address?.trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
    }

    return '';
  }
}
