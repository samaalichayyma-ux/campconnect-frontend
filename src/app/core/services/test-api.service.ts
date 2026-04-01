import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({ providedIn: 'root' })
export class TestApiService {
  private api = '/api'; // si proxy

  constructor(private http: HttpClient) {}

  testDocs() {
    // Test if backend is responding by calling a safe endpoint
    // Using getAllCampingSites which doesn't require authentication
    return this.http.get(`${this.api}/site-camping/getAll`);
  }
  
}