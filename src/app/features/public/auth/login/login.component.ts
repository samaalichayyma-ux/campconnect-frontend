import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  

  loginForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
  google.accounts.id.initialize({
    client_id: '912989049454-mg2qd294ahem05m4j5mrjma89ksbip85.apps.googleusercontent.com',
    callback: (response: any) => this.handleGoogleLogin(response)
  });

  google.accounts.id.renderButton(
    document.getElementById('googleButton'),
    {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: 260
    }
  );
}

triggerGoogleLogin(): void {
  google.accounts.id.prompt(); // ouvre popup Google
}

handleGoogleLogin(response: any): void {
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
        this.successMessage = response.message;
        this.authService.redirectByRole(this.router);
      },
      error: (error) => {
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
}
