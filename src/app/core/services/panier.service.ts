import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PanierService {
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  increment(): void {
    this.cartCountSubject.next(this.cartCountSubject.value + 1);
    console.log('NEW CART COUNT:', this.cartCountSubject.value);
  }

  reset(): void {
    this.cartCountSubject.next(0);
  }

  getCurrentCount(): number {
    return this.cartCountSubject.value;
  }
  private countSubject = new BehaviorSubject<number>(0);
  count$ = this.countSubject.asObservable();

  setCount(count: number): void {
    this.countSubject.next(count);
  }

  decrement(): void {
    const current = this.countSubject.value;
    this.countSubject.next(Math.max(0, current - 1));
  }
  
}