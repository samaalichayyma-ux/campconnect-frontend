import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LivraisonRealtimeService {
  private client?: Client;

  connect(): void {
    if (this.client?.active) {
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8082/api/ws'),
      reconnectDelay: 5000,
      debug: () => {}
    });

    this.client.activate();
  }

  subscribeToLivreurLocation(livraisonId: number): Observable<any> {
    this.connect();

    return new Observable(observer => {
      const trySubscribe = () => {
        if (!this.client || !this.client.connected) {
          setTimeout(trySubscribe, 300);
          return;
        }

        const subscription = this.client.subscribe(
          `/topic/livraisons/${livraisonId}/location`,
          (message: IMessage) => {
            observer.next(JSON.parse(message.body));
          }
        );

        return () => subscription.unsubscribe();
      };

      const cleanup = trySubscribe();

      return () => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      };
    });
  }

  sendLivreurLocation(livraisonId: number, latitude: number, longitude: number): void {
    this.connect();

    const send = () => {
      if (!this.client || !this.client.connected) {
        setTimeout(send, 300);
        return;
      }

      this.client.publish({
        destination: `/app/livraisons/${livraisonId}/location`,
        body: JSON.stringify({
          latitude,
          longitude
        })
      });
    };

    send();
  }

  disconnect(): void {
    this.client?.deactivate();
  }
}