import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, shareReplay } from 'rxjs';
import { firstValueFrom } from 'rxjs';

export interface GoogleMapsPublicConfig {
  enabled: boolean;
  apiKey: string;
  receiptMapEnabled: boolean;
}

type GoogleMapsNamespace = {
  maps: {
    Map: new (element: Element, options: Record<string, unknown>) => any;
    Marker: new (options: Record<string, unknown>) => any;
    Geocoder: new () => any;
    LatLng: new (latitude: number, longitude: number) => any;
    places?: {
      Autocomplete: new (input: HTMLInputElement, options?: Record<string, unknown>) => any;
    };
  };
};

type GoogleMapsWindow = Window & {
  google?: GoogleMapsNamespace;
} & Record<string, unknown>;

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private readonly configUrl = 'http://localhost:8082/api/config/google-maps/public';
  private readonly scriptId = 'campconnect-google-maps-script';

  private configRequest$?: Observable<GoogleMapsPublicConfig>;
  private scriptLoadPromise?: Promise<GoogleMapsPublicConfig>;

  constructor(private http: HttpClient) {}

  getPublicConfig(): Observable<GoogleMapsPublicConfig> {
    if (!this.configRequest$) {
      this.configRequest$ = this.http.get<GoogleMapsPublicConfig>(this.configUrl).pipe(
        catchError(() => of({
          enabled: false,
          apiKey: '',
          receiptMapEnabled: false
        })),
        shareReplay(1)
      );
    }

    return this.configRequest$;
  }

  async loadGoogleMaps(): Promise<GoogleMapsPublicConfig> {
    const config = await firstValueFrom(this.getPublicConfig());
    if (!config.enabled || !config.apiKey) {
      return config;
    }

    if (this.getGoogleMaps()) {
      return config;
    }

    if (this.scriptLoadPromise) {
      return this.scriptLoadPromise;
    }

    this.scriptLoadPromise = new Promise<GoogleMapsPublicConfig>((resolve, reject) => {
      const mapsWindow = window as unknown as GoogleMapsWindow;
      const callbackName = `__campConnectGoogleMapsInit_${Date.now()}`;
      const existingScript = document.getElementById(this.scriptId) as HTMLScriptElement | null;

      (mapsWindow as Record<string, unknown>)[callbackName] = () => {
        delete (mapsWindow as Record<string, unknown>)[callbackName];
        resolve(config);
      };

      const scriptElement = existingScript ?? document.createElement('script');
      scriptElement.id = this.scriptId;
      scriptElement.async = true;
      scriptElement.defer = true;
      scriptElement.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(config.apiKey)}&libraries=places&loading=async&callback=${callbackName}`;
      scriptElement.onerror = () => {
        delete (mapsWindow as Record<string, unknown>)[callbackName];
        this.scriptLoadPromise = undefined;
        reject(new Error('Google Maps JavaScript API failed to load.'));
      };

      if (!existingScript) {
        document.head.appendChild(scriptElement);
      }
    });

    return this.scriptLoadPromise;
  }

  getGoogleMaps(): GoogleMapsNamespace | null {
    const mapsWindow = window as unknown as GoogleMapsWindow;
    return mapsWindow.google?.maps ? mapsWindow.google : null;
  }
}
