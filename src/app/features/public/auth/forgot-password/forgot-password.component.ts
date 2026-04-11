import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  successMessage = '';
  errorMessage = '';
  emailTouched = false;

  constructor(private authService: AuthService) {}

  isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  submit(): void {
    this.emailTouched = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = 'Email is required';
      return;
    }

    if (!this.isValidEmail()) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    this.loading = true;

    this.authService.forgotPassword({ email: this.email.trim() }).subscribe({
      next: (res: any) => {
        this.successMessage =
          typeof res === 'string'
            ? res
            : res?.message || 'Reset link sent successfully';
        this.loading = false;
      },
      error: (error: any) => {
        this.errorMessage =
          error?.error?.message || 'Erreur lors de l’envoi du mail';
        this.loading = false;
      }
    });
  }
}