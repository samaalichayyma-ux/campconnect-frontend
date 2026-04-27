import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminIconComponent } from '../../components/admin-icon/admin-icon.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-insurance-agent-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, AdminIconComponent],
  templateUrl: './insurance-agent-layout.component.html',
  styleUrls: ['./insurance-agent-layout.component.css']
})
export class InsuranceAgentLayoutComponent {
  agentName = '';
  agentRole = '';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.agentName = this.authService.getUserName() || 'Insurance Agent';
    this.agentRole = this.authService.getRole() || 'AGENT_ASSURANCE';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isInsuranceAgent(): boolean {
    return this.agentRole === 'AGENT_ASSURANCE';
  }

  getDashboardRoute(): string {
    return '/insurance-agent/dashboard';
  }

  getDashboardLabel(): string {
    return 'Dashboard';
  }

  getPageTitle(): string {
    return 'Insurance Agent Panel';
  }

  getPageSubtitle(): string {
    return 'Monitor insurance offers with clarity and efficiency.';
  }
}