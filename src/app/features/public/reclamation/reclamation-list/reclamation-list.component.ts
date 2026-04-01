import { Component , OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReclamationService } from '../reclamation.service';
@Component({
  selector: 'app-reclamation-list',
  imports: [CommonModule],
  templateUrl: './reclamation-list.component.html',
  styleUrl: './reclamation-list.component.css'
})
export class ReclamationListComponent  implements OnInit {

  reclamations: any[] = [];

  constructor(private reclamationService: ReclamationService) {}

  ngOnInit(): void {
    this.loadReclamations();
  }

  loadReclamations() {
    this.reclamationService.getAll().subscribe({
      next: (data) => {
        this.reclamations = data;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  deleteReclamation(id: number) {
    if (confirm('Supprimer cette réclamation ?')) {
      this.reclamationService.delete(id).subscribe({
        next: () => {
          this.loadReclamations();
        },
        error: (err) => {
          console.error(err);
        }
      });
    }
  }
}