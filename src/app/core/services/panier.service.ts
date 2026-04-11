import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PanierService {
  private countSubject = new BehaviorSubject<number>(0);
  count$ = this.countSubject.asObservable();

  setCount(count: number): void {
    this.countSubject.next(count);
  }

  increment(): void {
    this.countSubject.next(this.countSubject.value + 1);
  }

  decrement(): void {
    const current = this.countSubject.value;
    this.countSubject.next(Math.max(0, current - 1));
  }

  reset(): void {
    this.countSubject.next(0);
  }

  getCurrentCount(): number {
    return this.countSubject.value;
  }
}