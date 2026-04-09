import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements AfterViewInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required]]
    });
  }

  ngAfterViewInit(): void {
    const googleBtn = document.getElementById('googleButton');

    if (!googleBtn) {
      console.error('googleButton introuvable');
      return;
    }

    if (typeof google === 'undefined') {
      console.error('Google script non chargé');
      return;
    }

    google.accounts.id.initialize({
      client_id: '912989049454-mg2qd294ahem05m4j5mrjma89ksbip85.apps.googleusercontent.com',
      callback: (response: any) => this.handleGoogleLogin(response)
    });

    google.accounts.id.renderButton(googleBtn, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: 260
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Connexion réussie';
        this.isLoading = false;

        if (response.role === 'ADMINISTRATEUR') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/public/profile']);
        }
      },
      error: () => {
        this.errorMessage = 'Email ou mot de passe incorrect';
        this.isLoading = false;
      }
    });
  }

  handleGoogleLogin(response: any): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.googleLogin(response.credential).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Connexion Google réussie';

        if (res.role === 'ADMINISTRATEUR') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/public/profile']);
        }
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la connexion Google';
      }
    });
  }
}