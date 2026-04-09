import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CampingSite } from '../models/camping-site.model';
import { InscriptionCheckoutResponse, SiteBooking, UpdateSiteBooking } from '../models/booking.model';
import { SiteAvailability } from '../models/site-availability.model';

@Injectable({
  providedIn: 'root'
})
export class CampingService {
  private apiUrl = 'http://localhost:8082/api';

  constructor(private http: HttpClient) {}

  getAllCampingSites(): Observable<CampingSite[]> {
    return this.http.get<CampingSite[]>(`${this.apiUrl}/site-camping/getAll`);
  }

  addCampingSite(formData: FormData): Observable<CampingSite> {
    return this.http.post<CampingSite>(`${this.apiUrl}/site-camping/addSite`, formData);
  }

  updateCampingSite(idSite: number, formData: FormData): Observable<CampingSite> {
    return this.http.patch<CampingSite>(`${this.apiUrl}/site-camping/updateSite/${idSite}`, formData);
  }

  closeCampingSite(idSite: number): Observable<CampingSite> {
    return this.http.patch<CampingSite>(`${this.apiUrl}/site-camping/close/${idSite}`, {});
  }

  getCampingSiteById(idSite: number): Observable<CampingSite> {
    return this.http.get<CampingSite>(`${this.apiUrl}/site-camping/getsite/${idSite}`);
  }

  createBooking(booking: SiteBooking): Observable<InscriptionCheckoutResponse> {
    return this.http.post<InscriptionCheckoutResponse>(
      `${this.apiUrl}/inscriptionsite/add`,
      booking
    );
  }

  confirmPayment(id: number) {
  return this.http.patch(
    `${this.apiUrl}/inscriptionsite/confirm-payment/${id}`,
    {}
  );
}

  downloadInvoice(id: number) {
  return this.http.get(
    `${this.apiUrl}/inscriptionsite/invoice/${id}`,
    { responseType: 'blob' }
  );
  }

  downloadTicket(idInscription: number) {
  return this.http.get(
    `${this.apiUrl}/inscriptionsite/ticket/${idInscription}`,
    { responseType: 'blob' }
  );
}
  getAllBookings(): Observable<UpdateSiteBooking[]> {
    return this.http.get<UpdateSiteBooking[]>(`${this.apiUrl}/inscriptionsite/getAll`);
  }

  getBookingsBySite(idSite: number): Observable<SiteBooking[]> {
    return this.http.get<SiteBooking[]>(`${this.apiUrl}/inscriptionsite/bySite/${idSite}`);
  }

  getDetailedBookingsBySite(idSite: number): Observable<UpdateSiteBooking[]> {
  return this.http.get<UpdateSiteBooking[]>(`${this.apiUrl}/inscriptionsite/bySite/${idSite}`);
}

  updateBooking(idInscription: number, booking: UpdateSiteBooking): Observable<UpdateSiteBooking> {
    return this.http.patch<UpdateSiteBooking>(`${this.apiUrl}/inscriptionsite/update/${idInscription}`, booking);
  }

  getMyCampingSites(): Observable<CampingSite[]> {
    return this.http.get<CampingSite[]>(`${this.apiUrl}/site-camping/my-sites`);
  }
  getMyBookings(): Observable<UpdateSiteBooking[]> {
  return this.http.get<UpdateSiteBooking[]>(`${this.apiUrl}/inscriptionsite/my-inscriptions`);
}

  getSiteAvailability(idSite: number, dateDebut: string, dateFin: string) {
  return this.http.get<SiteAvailability>(
    `${this.apiUrl}/site-camping/${idSite}/availability`,
    {
      params: {
        dateDebut,
        dateFin
      }
    }
  );
}

getMyCampBookingList(): Observable<UpdateSiteBooking[]> {
  return this.http.get<UpdateSiteBooking[]>(
    `${this.apiUrl}/inscriptionsite/my-camp-booking-list`
  );
}
}