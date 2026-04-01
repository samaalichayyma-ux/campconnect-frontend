import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CampingSite } from '../models/camping-site.model';
import { SiteBooking } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class CampingService {

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

   getAllCampingSites(): Observable<CampingSite[]> {
    return this.http.get<CampingSite[]>(`http://localhost:8080/api/site-camping/getAll`);
  }

  addCampingSite(site: CampingSite): Observable<CampingSite> {
    return this.http.post<CampingSite>(`${this.apiUrl}/site-camping/add`, site);
  }

  updateCampingSite(idSite: number, site: CampingSite): Observable<CampingSite> {
    return this.http.put<CampingSite>(`${this.apiUrl}/site-camping/update/${idSite}`, site);
  }

  deleteCampingSite(idSite: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/site-camping/delete/${idSite}`);
  }
  getCampingSiteById(idSite: number): Observable<CampingSite> {
    return this.http.get<CampingSite>(`${this.apiUrl}/site-camping/getsite/${idSite}`);
  }

  createBooking(booking: SiteBooking): Observable<SiteBooking> {
    return this.http.post<SiteBooking>(`${this.apiUrl}/inscriptionsite/add`, booking);
  }

  getAllBookings(): Observable<SiteBooking[]> {
    return this.http.get<SiteBooking[]>(`${this.apiUrl}/inscriptionsite/getAll`);
  }

  getBookingsBySite(idSite: number): Observable<SiteBooking[]> {
    return this.http.get<SiteBooking[]>(`${this.apiUrl}/inscriptionsite/bySite/${idSite}`);
  }

}