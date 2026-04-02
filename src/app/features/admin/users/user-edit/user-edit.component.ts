import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminUserService } from '../../../../core/services/admin-user.service';
import { AdminUser } from '../models/user.model';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css'
})
export class UserEditComponent implements OnInit {
  user: AdminUser = {
    nom: '',
    email: '',
    telephone: '',
    role: 'CLIENT',
    profil: {
      adresse: '',
      photo: '',
      biographie: ''
    }
  };

  loading = false;
  errorMessage = '';
  userId!: number;

  constructor(
    private route: ActivatedRoute,
    private adminUserService: AdminUserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadUser();
  }

  loadUser(): void {
    this.loading = true;
    this.adminUserService.getUserById(this.userId).subscribe({
      next: (data) => {
        this.user = {
          ...data,
          profil: data.profil || {
            adresse: '',
            photo: '',
            biographie: ''
          }
        };
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger cet utilisateur';
        this.loading = false;
      }
    });
  }

  update(): void {
    this.loading = true;
    this.adminUserService.updateUser(this.user).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/users']);
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la mise à jour';
        this.loading = false;
      }
    });
  }
}