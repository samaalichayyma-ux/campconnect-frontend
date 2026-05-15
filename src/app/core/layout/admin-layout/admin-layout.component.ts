import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AdminIconComponent } from '../../components/admin-icon/admin-icon.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, AdminIconComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  adminName = '';
  adminRole = '';
  isFormationRoute = false;
  private readonly navigationSubscription = new Subscription();

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.adminName = this.authService.getUserName() || 'Admin CampConnect';
    this.adminRole = this.authService.getRole() || 'ADMINISTRATEUR';
    this.updateRouteMode(this.router.url);
  }

  ngOnInit(): void {
    this.navigationSubscription.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => this.updateRouteMode(this.router.url))
    );
  }

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private updateRouteMode(currentUrl: string): void {
    const normalizedUrl = (currentUrl || '').split('?')[0].split('#')[0];
    this.isFormationRoute = normalizedUrl === '/admin/formations'
      || normalizedUrl.startsWith('/admin/formations/');
  }

}
