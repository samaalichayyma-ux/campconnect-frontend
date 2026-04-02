import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({ providedIn: 'root' })
export class TestApiService {
  private api = '/api'; // si proxy

  constructor(private http: HttpClient) {}

  testDocs() {
    return this.http.get(`${this.api}/v3/api-docs`);
  }
  
}