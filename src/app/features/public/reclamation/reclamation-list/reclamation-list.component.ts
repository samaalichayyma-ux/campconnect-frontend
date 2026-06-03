import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReclamationService } from '../reclamation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-reclamation-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reclamation-list.component.html',
  styleUrls: ['./reclamation-list.component.css']
})
export class ReclamationListComponent implements OnInit {

  reclamations: any[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private reclamationService: ReclamationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadMyReclamations();
    }
  }

  loadMyReclamations() {
    this.loading = true;
    this.reclamationService.getMyReclamations().subscribe({
      next: (data) => {
        this.reclamations = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement des réclamations.';
        this.loading = false;
      }
    });
  }

  deleteReclamation(id: number) {
    if (confirm('Supprimer cette réclamation ?')) {
      this.reclamationService.delete(id).subscribe({
        next: () => this.loadMyReclamations(),
        error: (err) => console.error(err)
      });
    }
  }
}