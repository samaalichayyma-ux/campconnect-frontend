import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { PanierService } from '../../services/panier.service';
import { Observable } from 'rxjs';
import { PanierServiceService } from '../../../features/public/MarketPlace/services/panier-service.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  userName = '';
  userRole = '';
  isDropdownOpen = false;
  cartCount$: Observable<number>;

  constructor(
    public authService: AuthService,
    private router: Router,
    private panierService: PanierService,
    private panierApiService: PanierServiceService
  ) {
    this.cartCount$ = this.panierService.count$;
  }

  ngOnInit(): void {
    this.userName = this.authService.getUserName();
    this.userRole = this.authService.getRole();
    this.syncPanierCount();
  }

  syncPanierCount(): void {
    const userId = this.authService.getUserId();

    if (!userId || userId <= 0) {
      this.panierService.reset();
      return;
    }

    this.panierApiService.getOrCreatePanierEnCours(userId).subscribe({
      next: (panier: any) => {
        const idPanier = panier?.idPanier;

        if (!idPanier) {
          this.panierService.reset();
          return;
        }

        this.panierApiService.getDetailsByPanier(idPanier).subscribe({
          next: (details: any[]) => {
            const total = (details || []).reduce(
              (sum, item) => sum + (item.quantite || 0),
              0
            );

            this.panierService.setCount(total);
          },
          error: (err) => {
            console.error('Erreur chargement détails panier navbar', err);
            this.panierService.reset();
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement panier navbar', err);
        this.panierService.reset();
      }
    });
  }

  logout(): void {
    const userId = this.authService.getUserId();

    if (!userId || userId <= 0) {
      this.authService.logout();
      this.panierService.reset();
      this.router.navigate(['/public']);
      return;
    }

    this.panierApiService.viderPanierEnCours(userId).subscribe({
      next: () => {
        this.authService.logout();
        this.panierService.reset();
        this.router.navigate(['/public']);
      },
      error: (err) => {
        console.error('Erreur vidage panier au logout', err);
        this.authService.logout();
        this.panierService.reset();
        this.router.navigate(['/public']);
      }
    });
  }

  getUserInitial(): string {
    const rawName = this.authService.getUserName();
    if (!rawName) return '?';

    const name = rawName.trim();
    if (!name) return '?';

    const cleanName = name.includes('@') ? name.split('@')[0] : name;
    return cleanName.charAt(0).toUpperCase();
  }

  getAvatarColor(): string {
    const colors = ['#1f5c36', '#96952f', '#172b44', '#b64141', '#3d5a2a', '#6b5b95', '#ff7f50'];
    const name = this.authService.getUserName()?.trim() || '';
    let hash = 0;

    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }
}