import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

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
        console.log('✅ Login successful, fetching current user info...');
        
        // Fetch current user info to get userId
        this.authService.fetchCurrentUser().subscribe({
          next: (userInfo: any) => {
            console.log('✅ User info received:', userInfo);
            // Save userId from userInfo (try common field names)
            const userId = userInfo.id || userInfo.utilisateurId || userInfo.userId;
            if (userId) {
              this.authService.saveUserId(userId);
              console.log('✅ UserId saved:', userId);
            } else {
              console.warn('⚠️ UserId not found in user info. Response:', userInfo);
            }
            
            // Now redirect
            this.performRedirect();
          },
          error: (error) => {
            console.warn('⚠️ Could not fetch user info:', error);
            // Continue anyway - maybe userId is in JWT
            this.performRedirect();
          }
        });
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message ||
          'Échec de connexion. Vérifiez vos identifiants.';
        console.error('Login error details:', {
          status: error?.status,
          statusText: error?.statusText,
          message: error?.error?.message,
          email: this.loginForm.value.email
        });
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private performRedirect(): void {
    // Check if there's a return URL to redirect to
    const returnUrl = this.authService.getReturnUrl();
    if (returnUrl) {
      this.authService.clearReturnUrl();
      setTimeout(() => {
        this.router.navigateByUrl(returnUrl);
      }, 500);
    } else {
      // Otherwise use role-based redirect
      this.authService.redirectByRole(this.router);
    }
  }
}
