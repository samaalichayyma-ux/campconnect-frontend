import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LivraisonService } from '../../../../core/services/livraison.service';

@Component({
  selector: 'app-client-my-deliveries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-my-deliveries.component.html',
  styleUrl: './client-my-deliveries.component.css'
})

export class ClientMyDeliveriesComponent implements OnInit {
  private livraisonService = inject(LivraisonService);
  private router = inject(Router);

  livraisons: any[] = [];

  ngOnInit(): void {
    this.livraisonService.getMyClientLivraisons().subscribe({
      next: (data) => this.livraisons = data.reverse()
    });
  }

  openDetails(id: number) {
    this.router.navigate(['/public/my-deliveries', id]);
  }
}