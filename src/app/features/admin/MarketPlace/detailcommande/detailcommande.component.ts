import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DetailcommandeService } from '../service/detailcommande.service';

@Component({
  selector: 'app-detailcommande',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detailcommande.component.html',
  styleUrls: ['./detailcommande.component.css']
})
export class DetailCommandeComponent implements OnInit {

  idCommande!: number;
  detailsCommande: any[] = [];
  commande: any = null;
  utilisateur: any = null;

  constructor(
    private route: ActivatedRoute,
    private detailCommandeService: DetailcommandeService
  ) {}

  ngOnInit(): void {
    this.idCommande = Number(this.route.snapshot.paramMap.get('id'));

    console.log('ID commande reçu = ', this.idCommande);

    this.detailCommandeService.getDetailsByCommande(this.idCommande)
      .subscribe({
        next: (data) => {
          console.log('Détails commande = ', data);

          this.detailsCommande = data;

          if (data.length > 0) {
            this.commande = data[0].commande;
            this.utilisateur = data[0].commande?.utilisateur;
          }
        },
        error: (err) => {
          console.error('Erreur détails commande', err);
        }
      });
  }

telechargerDetailsCommande(): void {
  this.detailCommandeService.telechargerPdfDetailsCommande(this.idCommande);
}
}