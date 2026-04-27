import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  Assurance,
  Garantie,
  SouscriptionAssurance,
  Sinistre,
  Remboursement,
  DocumentAssurance
} from '../models/assurance.models';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AssuranceService {
  private readonly apiUrl = 'http://localhost:8082/api';

  constructor(private http: HttpClient) {}

  // =========================
  // JWT helpers
  // =========================
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserIdFromToken(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.userId ?? null;
    } catch (error) {
      console.error('Impossible de décoder le token JWT', error);
      return null;
    }
  }

  getRoleFromToken(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.role ?? null;
    } catch (error) {
      console.error('Impossible de décoder le rôle depuis le JWT', error);
      return null;
    }
  }

  // =========================
  // Assurance
  // =========================
  getAllAssurances(): Observable<Assurance[]> {
    return this.http.get<Assurance[]>(`${this.apiUrl}/assurance/all`);
  }

  getAssuranceById(id: number): Observable<Assurance> {
    return this.http.get<Assurance>(`${this.apiUrl}/assurance/${id}`);
  }

  addAssurance(payload: Assurance): Observable<Assurance> {
    return this.http.post<Assurance>(`${this.apiUrl}/assurance/add`, payload);
  }

  updateAssurance(payload: Assurance): Observable<Assurance> {
    return this.http.put<Assurance>(`${this.apiUrl}/assurance/update`, payload);
  }

  deleteAssurance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/assurance/delete/${id}`);
  }

  // =========================
  // Garanties
  // =========================
  getGarantiesByAssurance(assuranceId: number): Observable<Garantie[]> {
    return this.http.get<Garantie[]>(`${this.apiUrl}/garantie/assurance/${assuranceId}`);
  }

  addGarantie(assuranceId: number, payload: Garantie): Observable<Garantie> {
    return this.http.post<Garantie>(`${this.apiUrl}/garantie/add/${assuranceId}`, payload);
  }

  updateGarantie(payload: Garantie): Observable<Garantie> {
    return this.http.put<Garantie>(`${this.apiUrl}/garantie/update`, payload);
  }

  deleteGarantie(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/garantie/delete/${id}`);
  }

  // =========================
  // Souscriptions
  // =========================
  getMySouscriptions(): Observable<SouscriptionAssurance[]> {
    const userId = this.getUserIdFromToken();
    if (!userId) {
      throw new Error('Utilisateur non authentifié ou userId introuvable dans le token.');
    }
    return this.http.get<SouscriptionAssurance[]>(
      `${this.apiUrl}/souscription-assurance/user/${userId}`
    );
  }

  getAllSouscriptions(): Observable<SouscriptionAssurance[]> {
    return this.http.get<SouscriptionAssurance[]>(`${this.apiUrl}/souscription-assurance/all`);
  }

  getSouscriptionById(id: number): Observable<SouscriptionAssurance> {
    return this.http.get<SouscriptionAssurance>(`${this.apiUrl}/souscription-assurance/${id}`);
  }

  addSouscription(assuranceId: number, payload: SouscriptionAssurance): Observable<SouscriptionAssurance> {
    const userId = this.getUserIdFromToken();
    if (!userId) {
      throw new Error('Utilisateur non authentifié ou userId introuvable dans le token.');
    }

    return this.http.post<SouscriptionAssurance>(
      `${this.apiUrl}/souscription-assurance/add/${userId}/${assuranceId}`,
      payload
    );
  }

  updateSouscription(payload: SouscriptionAssurance): Observable<SouscriptionAssurance> {
    return this.http.put<SouscriptionAssurance>(
      `${this.apiUrl}/souscription-assurance/update`,
      payload
    );
  }

  deleteSouscription(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/souscription-assurance/delete/${id}`);
  }

  // =========================
  // Sinistres
  // =========================
  getAllSinistres(): Observable<Sinistre[]> {
    return this.http.get<Sinistre[]>(`${this.apiUrl}/sinistre/all`);
  }

  getSinistreById(id: number): Observable<Sinistre> {
    return this.http.get<Sinistre>(`${this.apiUrl}/sinistre/${id}`);
  }

  getSinistresBySouscription(souscriptionId: number): Observable<Sinistre[]> {
    return this.http.get<Sinistre[]>(`${this.apiUrl}/sinistre/souscription/${souscriptionId}`);
  }

  getMySinistres(): Observable<Sinistre[]> {
  return this.getMySouscriptions().pipe(
    switchMap((souscriptions) => {
      const requests = souscriptions
        .filter((s) => !!s.id)
        .map((s) =>
          this.getSinistresBySouscription(s.id!).pipe(
            catchError(() => of([]))
          )
        );

      if (!requests.length) {
        return of([]);
      }

      return forkJoin(requests).pipe(
        map((results) => results.flat())
      );
    })
  );
}

  addSinistre(souscriptionId: number, payload: Sinistre): Observable<Sinistre> {
    return this.http.post<Sinistre>(`${this.apiUrl}/sinistre/add/${souscriptionId}`, payload);
  }

  updateSinistre(payload: Sinistre): Observable<Sinistre> {
    return this.http.put<Sinistre>(`${this.apiUrl}/sinistre/update`, payload);
  }

  deleteSinistre(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sinistre/delete/${id}`);
  }

  // =========================
  // Documents assurance
  // =========================
  getDocumentsBySinistre(sinistreId: number): Observable<DocumentAssurance[]> {
    return this.http.get<DocumentAssurance[]>(
      `${this.apiUrl}/document-assurance/sinistre/${sinistreId}`
    );
  }

  addDocumentAssurance(sinistreId: number, payload: DocumentAssurance): Observable<DocumentAssurance> {
    return this.http.post<DocumentAssurance>(
      `${this.apiUrl}/document-assurance/add/${sinistreId}`,
      payload
    );
  }

  updateDocumentAssurance(payload: DocumentAssurance): Observable<DocumentAssurance> {
    return this.http.put<DocumentAssurance>(
      `${this.apiUrl}/document-assurance/update`,
      payload
    );
  }

  deleteDocumentAssurance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/document-assurance/delete/${id}`);
  }

  // =========================
  // Remboursements
  // =========================
  getAllRemboursements(): Observable<Remboursement[]> {
    return this.http.get<Remboursement[]>(`${this.apiUrl}/remboursement/all`);
  }

  getRemboursementsBySinistre(sinistreId: number): Observable<Remboursement[]> {
    return this.http.get<Remboursement[]>(`${this.apiUrl}/remboursement/sinistre/${sinistreId}`);
  }

  addRemboursement(sinistreId: number, payload: Remboursement): Observable<Remboursement> {
    return this.http.post<Remboursement>(
      `${this.apiUrl}/remboursement/add/${sinistreId}`,
      payload
    );
  }

  updateRemboursement(payload: Remboursement): Observable<Remboursement> {
    return this.http.put<Remboursement>(`${this.apiUrl}/remboursement/update`, payload);
  }

  deleteRemboursement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/remboursement/delete/${id}`);
  }
}