import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
  loginForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  requires2FA = false;
  tempToken = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      otpCode: ['', [Validators.pattern(/^[0-9]{6}$/)]]
    });
  }

  ngOnInit(): void {
    this.initializeGoogleAuth();
  }

  ngAfterViewInit(): void {
    this.renderGoogleButton();
  }

  initializeGoogleAuth(): void {
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.initialize({
        client_id:
          '912989049454-mg2qd294ahem05m4j5mrjma89ksbip85.apps.googleusercontent.com',
        callback: (response: any) => this.handleGoogleLogin(response)
      });
    }
  }

  renderGoogleButton(): void {
    if (typeof google !== 'undefined' && google.accounts?.id) {
      const googleButton = document.getElementById('googleButton');

      if (googleButton) {
        googleButton.innerHTML = '';

        google.accounts.id.renderButton(googleButton, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 260
        });
      }
    }
  }

  handleGoogleLogin(response: any): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    if (!response?.credential) {
      this.errorMessage = 'Réponse Google invalide';
      this.isLoading = false;
      return;
    }

    this.authService.googleLogin(response.credential).subscribe({
      next: (res: any) => {
        this.successMessage = res?.message || 'Connexion Google réussie';
        this.isLoading = false;
        this.authService.redirectByRole(this.router);
      },
      error: (error: any) => {
        console.log('GOOGLE LOGIN ERROR =', error);
        this.errorMessage =
          error?.error?.message || 'Erreur lors de la connexion Google';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    console.log('SUBMIT CLICKED');
    console.log('FORM VALUE =', this.loginForm.value);
    console.log('FORM VALID =', this.loginForm.valid);

    this.requires2FA = false;
    this.tempToken = '';
    this.loginForm.get('otpCode')?.setValue('');

    if (
      this.loginForm.get('email')?.invalid ||
      this.loginForm.get('motDePasse')?.invalid
    ) {
      this.loginForm.get('email')?.markAsTouched();
      this.loginForm.get('motDePasse')?.markAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      email: this.loginForm.value.email,
      motDePasse: this.loginForm.value.motDePasse
    };

    this.authService.login(payload).subscribe({
      next: (response: any) => {
        console.log('LOGIN RESPONSE =', response);

        if (response?.requires2FA && response?.tempToken) {
          this.requires2FA = true;
          this.tempToken = response.tempToken;
          this.successMessage = 'Entrez le code Google Authenticator';
          this.isLoading = false;
          return;
        }

        this.successMessage = response?.message || 'Connexion réussie';
        this.authService.redirectByRole(this.router);
      },
      error: (error: any) => {
        console.log('LOGIN ERROR =', error);
        this.errorMessage =
          error?.error?.message ||
          'Échec de connexion. Vérifiez vos identifiants.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  verify2FALogin(): void {
    const otpControl = this.loginForm.get('otpCode');
    const otpCode = otpControl?.value?.trim();

    if (!otpCode) {
      otpControl?.markAsTouched();
      this.errorMessage = 'Veuillez saisir le code OTP';
      return;
    }

    if (otpControl?.invalid) {
      otpControl?.markAsTouched();
      this.errorMessage = 'Le code OTP doit contenir 6 chiffres';
      return;
    }

    if (!this.tempToken) {
      this.errorMessage = 'Token temporaire introuvable. Reconnectez-vous.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.verifyLogin2FA({
      tempToken: this.tempToken,
      code: otpCode
    }).subscribe({
      next: (response: any) => {
        this.successMessage = response?.message || 'Connexion réussie';
        this.requires2FA = false;
        this.tempToken = '';
        this.loginForm.get('otpCode')?.setValue('');
        this.authService.redirectByRole(this.router);
      },
      error: (error: any) => {
        console.log('VERIFY 2FA ERROR =', error);

        if (error.status === 403) {
          this.errorMessage = 'Le endpoint OTP est bloqué par la sécurité backend';
        } else {
          this.errorMessage = error?.error?.message || 'Code OTP invalide';
        }

        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}