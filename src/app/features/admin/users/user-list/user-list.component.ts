import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminUserService } from '../../../../core/services/admin-user.service';
import { AdminUser } from '../models/user.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [RouterLink ,CommonModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
  users: AdminUser[] = [];
  loading = false;
  errorMessage = '';

  constructor(private adminUserService: AdminUserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminUserService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les utilisateurs';
        this.loading = false;
      }
    });
  }

  deleteUser(id?: number): void {
    if (!id) return;

    const confirmed = confirm('Voulez-vous vraiment supprimer cet utilisateur ?');
    if (!confirmed) return;

    this.adminUserService.deleteUser(id).subscribe({
      next: () => {
        this.users = this.users.filter(user => user.id !== id);
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la suppression';
      }
    });
  }
}