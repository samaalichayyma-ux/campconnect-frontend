import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  loading = false;
  successMessage = '';
  errorMessage = '';
  passwordTouched = false;
  showPassword = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  isValidPassword(): boolean {
    return this.newPassword.trim().length >= 6;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    this.passwordTouched = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.token) {
      this.errorMessage = 'Reset token is missing or invalid';
      return;
    }

    if (!this.newPassword.trim()) {
      this.errorMessage = 'Password is required';
      return;
    }

    if (!this.isValidPassword()) {
      this.errorMessage = 'Password must contain at least 6 characters';
      return;
    }

    this.loading = true;

    this.authService.resetPassword({
      token: this.token,
      newPassword: this.newPassword.trim()
    }).subscribe({
      next: (res: any) => {
        this.successMessage =
          typeof res === 'string'
            ? res
            : res?.message || 'Password reset successfully';
        this.loading = false;

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (error: any) => {
        this.errorMessage =
          error?.error?.message ||
          'Erreur lors de la réinitialisation du mot de passe';
        this.loading = false;
      }
    });
  }
}