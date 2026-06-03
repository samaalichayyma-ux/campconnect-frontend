
import { Component, OnInit } from '@angular/core';
import { RepasService } from '../repas.service';
import {RepasPanierService} from '../../../../core/services/repas-panier.service';
import { CommandeRepasService } from '../commande-repas.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgModel } from '@angular/forms';


@Component({
  selector: 'app-repas-list',
  imports: [ FormsModule, CommonModule],
  templateUrl: './repas-list.component.html',
  styleUrl: './repas-list.component.css'
})
export class RepasListComponent implements OnInit {


  repas: any[] = [];
  showCartPreview = false;
  lastAdded: any = null;

  constructor(
    private repasService: RepasService,
    private commandeService: CommandeRepasService,
  private repasPanier: RepasPanierService,
  private router: Router
  ) {}

  ngOnInit() {
    this.repasService.getAll().subscribe(data => {
      this.repas = data;
      this.repas.forEach(r => r.qty = 1);
    });
  }











ajouterAuPanier(r: any) {
  if (!r.qty || r.qty <= 0) {
    alert('Quantité invalide');
    return;
  }

  this.repasPanier.ajouter({
    repasId: r.id,
    nom: r.nom,
    prix: r.prix,
    image: r.image,
    quantite: r.qty
  });

  this.lastAdded = r;
  this.showCartPreview = true;
  r.qty = 1;
}

// Garde les autres méthodes mais adapte le panier
get panier() {
  return this.repasPanier.getItems();
}

retirerDuPanier(repasId: number) {
  this.repasPanier.retirer(repasId);
  if (this.repasPanier.getItems().length === 0) this.showCartPreview = false;
}

getTotalPanier(): number {
  return this.repasPanier.getTotal();
}

commander() {
  this.router.navigate(['/public/detailpanier']);
  this.showCartPreview = false;
}














    closeCartPreview() {
    this.showCartPreview = false;
  }

  isCloudinaryUrl(url: string): boolean {
  return !!url && (url.startsWith('http://') || url.startsWith('https://'));
}
}

