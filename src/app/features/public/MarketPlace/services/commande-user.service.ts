import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commande } from '../models/commande.model';

@Injectable({
  providedIn: 'root'
})
export class CommandeUserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8082/api/commandes';

  getMesCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.apiUrl}/me`);
  }
}
