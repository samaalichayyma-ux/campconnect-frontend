import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AssuranceService } from '../../../../core/services/assurance.service';
import { Assurance, TYPE_ASSURANCE_LABELS } from '../../../../core/models/assurance.models';

@Component({
  selector: 'app-agent-assurance-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './agent-assurance-list.component.html',
  styleUrls: ['./agent-assurance-list.component.css']
})
export class AgentAssuranceListComponent implements OnInit {
  assurances: Assurance[] = [];
  loading = false;
  errorMessage = '';

  readonly typeLabels = TYPE_ASSURANCE_LABELS;

  constructor(private assuranceService: AssuranceService) {}

  ngOnInit(): void {
    this.loadAssurances();
  }

  loadAssurances(): void {
    this.loading = true;
    this.errorMessage = '';

    this.assuranceService.getAllAssurances().subscribe({
      next: (data) => {
        this.assurances = data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de charger les offres.';
        this.loading = false;
      }
    });
  }
}