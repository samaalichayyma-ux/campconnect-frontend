import { Component } from '@angular/core';
import { CampingSite } from '../models/camping-site.model';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-camping-sites',
  imports: [CommonModule, RouterModule],
  templateUrl: './camping-sites.component.html',
  styleUrl: './camping-sites.component.css'
})
export class CampingSitesComponent {
sites: CampingSite[] = [
    {
      idSite: 1,
      nom: 'Forest Escape Camp',
      localisation: 'Ain Draham, Tunisia',
      capacite: 20,
      prixParNuit: 45,
      statutDispo: 'AVAILABLE',
      image: 'assets/images/camp1.jpg',
      description: 'A peaceful camping destination surrounded by trees and nature.'
    },
    {
      idSite: 2,
      nom: 'Lake View Camp',
      localisation: 'Bizerte, Tunisia',
      capacite: 12,
      prixParNuit: 60,
      statutDispo: 'FULL',
      image: 'assets/images/camp2.jpg',
      description: 'Enjoy a relaxing experience near the lake with beautiful outdoor scenery.'
    },
    {
      idSite: 3,
      nom: 'Mountain Breeze Camp',
      localisation: 'Zaghouan, Tunisia',
      capacite: 16,
      prixParNuit: 55,
      statutDispo: 'AVAILABLE',
      image: 'assets/images/camp3.jpg',
      description: 'A scenic mountain camping site for nature lovers and hikers.'
    }
  ];
}
