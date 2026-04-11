import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReclamationService } from '../reclamation.service';

@Component({
  selector: 'app-reclamation-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reclamation-list.component.html',
  styleUrls: ['./reclamation-list.component.css']
})
export class ReclamationListComponent implements OnInit {

  reclamations: any[] = [];

  constructor(private reclamationService: ReclamationService) {}

  ngOnInit(): void {
    this.loadUserReclamations();
  }

  loadUserReclamations() {
    this.reclamationService.getMyReclamations().subscribe({
      next: (data) => {
        this.reclamations = data;
      },
      error: (err) => {
        console.error('Erreur loading reclamations', err);
      }
    });
  }

  deleteReclamation(id: number) {
    if (confirm('Supprimer cette réclamation ?')) {
      this.reclamationService.delete(id).subscribe({
        next: () => this.loadUserReclamations(),
        error: (err) => console.error(err)
      });
    }
  }
}