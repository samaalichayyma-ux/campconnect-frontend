import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DetailcommandeService {

  private apiUrl = 'http://localhost:8082/api/details-commandes';

  constructor(private http: HttpClient) {}

  getDetailsByCommande(idCommande: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/commande/${idCommande}`
    );
  }

  getAllDetails(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getDetailById(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${id}`
    );
  }

  telechargerPdfDetailsCommande(idCommande: number): void {
  this.http.get(
    `http://localhost:8082/api/details-commandes/commande/${idCommande}/pdf`,
    { responseType: 'blob' }
  ).subscribe((blob) => {
    const file = new Blob([blob], { type: 'application/pdf' });
    const fileURL = window.URL.createObjectURL(file);

    const a = document.createElement('a');
    a.href = fileURL;
    a.download = `details-commande-${idCommande}.pdf`;
    a.click();

    window.URL.revokeObjectURL(fileURL);
  });
}
}