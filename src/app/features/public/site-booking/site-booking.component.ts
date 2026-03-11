import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CampingSite } from '../models/camping-site.model';
import { SiteBooking } from '../models/booking.model';

@Component({
  selector: 'app-site-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './site-booking.component.html',
  styleUrl: './site-booking.component.css'
})
export class SiteBookingComponent implements OnInit {
  siteId!: number;

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

  selectedSite?: CampingSite;

  bookingForm: SiteBooking = {
    dateDebut: '',
    dateFin: '',
    numberOfGuests: 1,
    statut: 'PENDING',
    siteCamping: {} as CampingSite
  };

  fullName = '';
  email = '';
  phone = '';
  guests = 1;
  notes = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    this.siteId = Number(params.get('id'));
    this.selectedSite = this.sites.find(site => site.idSite === this.siteId);

    if (this.selectedSite) {
      this.bookingForm.siteCamping = this.selectedSite;
    }
  });
}

  onSubmit(): void {
    if (!this.selectedSite) {
      return;
    }

    console.log('Site ID:', this.siteId);
    console.log('Selected site:', this.selectedSite);
    console.log('Booking payload:', this.bookingForm);
    console.log('Extra form info:', {
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      guests: this.guests,
      notes: this.notes
    });
  }
}