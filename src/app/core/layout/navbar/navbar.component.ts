import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { PanierService } from '../../../core/services/panier.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  cartCount$: Observable<number>;

  constructor(
    public authService: AuthService,
    private router: Router,
    private panierService: PanierService
  ) {
    this.cartCount$ = this.panierService.cartCount$;
  }

  logout(): void {
    this.authService.logout();
    this.panierService.reset();
    this.router.navigate(['/public']);
  }
}