import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      role: ['CLIENT', Validators.required],
      terms: [false, Validators.requiredTrue]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (
      this.registerForm.value.motDePasse !==
      this.registerForm.value.confirmPassword
    ) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.isLoading = true;

    const payload = {
      nom: this.registerForm.value.nom,
      email: this.registerForm.value.email,
      motDePasse: this.registerForm.value.motDePasse,
      telephone: this.registerForm.value.telephone,
      role: this.registerForm.value.role
    };

    this.authService.register(payload).subscribe({
      next: (response: any) => {
        this.successMessage = response?.message || 'Registration successful';
        this.isLoading = false;

        setTimeout(() => {
          this.authService.redirectByRole(this.router);
        }, 800);
      },
      error: (error: any) => {
        this.errorMessage =
          error?.error?.message ||
          'Registration failed. Please check your information.';
        this.isLoading = false;
      }
    });
  }
}