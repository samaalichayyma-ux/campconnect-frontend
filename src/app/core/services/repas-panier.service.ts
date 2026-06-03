import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface RepasItem {
  repasId: number;
  nom: string;
  prix: number;
  image: string;
  quantite: number;
}

const STORAGE_KEY = 'repas_panier';

@Injectable({
  providedIn: 'root'
})
export class RepasPanierService {

  private items = new BehaviorSubject<RepasItem[]>(this.loadFromStorage());
  items$ = this.items.asObservable();

  private loadFromStorage(): RepasItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private save(items: RepasItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    this.items.next(items);
  }

  getItems(): RepasItem[] {
    return this.items.getValue();
  }

  ajouter(item: RepasItem): void {
    const current = this.items.getValue();
    const existant = current.find(i => i.repasId === item.repasId);
    if (existant) {
      this.save(current.map(i =>
        i.repasId === item.repasId
          ? { ...i, quantite: i.quantite + item.quantite }
          : i
      ));
    } else {
      this.save([...current, { ...item }]);
    }
  }

  retirer(repasId: number): void {
    this.save(this.items.getValue().filter(i => i.repasId !== repasId));
  }

  vider(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.items.next([]);
  }

  getTotal(): number {
    return this.items.getValue().reduce((sum, i) => sum + i.prix * i.quantite, 0);
  }

  getCount(): number {
    return this.items.getValue().reduce((sum, i) => sum + i.quantite, 0);
  }
}