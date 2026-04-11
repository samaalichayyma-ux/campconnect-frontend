import { Component , OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReclamationService } from '../reclamation-admin-list/reclamation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reclamation-detail',
    standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl:'./reclamation-detail.component.html',
  styleUrl: './reclamation-detail.component.css'
})
export class ReclamationDetailComponent implements OnInit {

  reclamationId!: number;
  reclamation: any;
  loading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private reclamationService: ReclamationService
  ) { }

  ngOnInit(): void {
    this.reclamationId = Number(this.route.snapshot.paramMap.get('id'));
    this.getReclamationDetails();
  }

  getReclamationDetails() {
    this.loading = true;
    this.reclamationService.getReclamationById(this.reclamationId).subscribe({
      next: (res) => {
        this.reclamation = res;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement de la réclamation';
        this.loading = false;
      }
    });
  }

  updateStatut(newStatut: string) {
    this.reclamationService.changeStatut(this.reclamationId, newStatut).subscribe({
      next: (res) => {
        this.reclamation.statut = newStatut;
        alert('Statut mis à jour avec succès !');
      },
      error: () => alert('Erreur lors de la mise à jour du statut')
    });
  }
}
