import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminUserService } from '../../../../core/services/admin-user.service';
import { AdminUser } from '../models/user.model';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.css'
})
export class UserCreateComponent {
  user: AdminUser = {
    nom: '',
    email: '',
    telephone: '',
    motDePasse: '',
    role: 'CLIENT',
    profil: {
      adresse: '',
      photo: '',
      biographie: ''
    }
  };

  loading = false;
  errorMessage = '';

  constructor(
    private adminUserService: AdminUserService,
    private router: Router
  ) {}

  save(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminUserService.addUser(this.user).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/users']);
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l’ajout de l’utilisateur';
        this.loading = false;
      }
    });
  }
}