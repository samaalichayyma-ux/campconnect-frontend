import { Component , OnInit } from '@angular/core';
import { ReclamationService } from '../../../public/reclamation/reclamation.service';

@Component({
  selector: 'app-reclamation-admin-list',
  imports: [],
  templateUrl: './reclamation-admin-list.component.html',
  styleUrl: './reclamation-admin-list.component.css'
})
export class ReclamationAdminListComponent implements OnInit {

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

  changerStatut(id: number, statut: string) {
    this.reclamationService.changeStatut(id, statut).subscribe({
      next: () => {
        this.loadReclamations();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}