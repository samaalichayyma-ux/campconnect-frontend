import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReclamationService } from '../reclamation-admin-list/reclamation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router'; //

@Component({
  selector: 'app-reclamation-edit',
  standalone: true,
  imports: [CommonModule, FormsModule,
    RouterModule],
  templateUrl: './reclamation-edit.component.html',
  styleUrl: './reclamation-edit.component.css'
})
export class ReclamationEditComponent implements OnInit {

  reclamationId!: number;
  reclamation: any = {};
  loading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reclamationService: ReclamationService
  ) {}

  ngOnInit(): void {
    this.reclamationId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadReclamation();
  }

  loadReclamation() {
    this.loading = true;
    this.reclamationService.getReclamationById(this.reclamationId).subscribe({
      next: (res) => {
        this.reclamation = res;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Error loading complaint';
        this.loading = false;
      }
    });
  }

  updateReclamation() {
    this.reclamationService.updateReclamation(this.reclamationId, this.reclamation).subscribe({
      next: () => {
        alert('Complaint updated successfully!');
        this.router.navigate(['/admin/reclamations']);
      },
      error: () => alert('Error updating complaint')
    });
  }
}
