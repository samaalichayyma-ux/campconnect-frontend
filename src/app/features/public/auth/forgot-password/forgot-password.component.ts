import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private authService: AuthService) {}

  submit(): void {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: (res) => {
        this.successMessage = res;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l’envoi du mail';
        this.loading = false;
      }
    });
  }
}