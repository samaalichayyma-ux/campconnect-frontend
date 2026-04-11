import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ReclamationService } from '../reclamation.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reclamation-add',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reclamation-add.component.html',
  styleUrls: ['./reclamation-add.component.css']
})
export class ReclamationAddComponent {

  types = ['Destination', 'Shop', 'Restaurant', 'Event', 'Formation'];

  reclamation = {
    type: 'Destination',
    description: '',
    statut: 'EN_COURS',
    acceptationDeclaration: false,
    dateAcceptation: null as string | null,
    image: ''
  };

  submitted = false;
  isSubmitting = false;
  showDeclaration = false;

  constructor(
    private reclamationService: ReclamationService,
    private authService: AuthService
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.reclamation.image = file.name;
    }
  }

save() {
  this.submitted = true;

  if (!this.reclamation.description?.trim()) {
    alert('Please enter a description.');
    return;
  }

  if (!this.reclamation.acceptationDeclaration) {
    alert('You must accept the personal data policy.');
    return;
  }

  if (this.isSubmitting) return;
  this.isSubmitting = true;

  this.reclamation.dateAcceptation = new Date().toISOString();

  const userId = this.authService.getUserId();


const payload = {
  utilisateur: {
    id: this.authService.getUserId()
  },
  description: `${this.reclamation.type}: ${this.reclamation.description}`,
  statut: 'EN_COURS',
  acceptationDeclaration: this.reclamation.acceptationDeclaration,
  dateAcceptation: new Date().toISOString(),
  image: this.reclamation.image
};

  this.reclamationService.create(payload).subscribe({
    next: () => {
      alert('Complaint submitted successfully!');
      this.resetForm();
      this.isSubmitting = false;
      this.submitted = false;
    },
    error: (err) => {
      console.error('Error submitting reclamation:', err);
      alert('Error submitting complaint. Please try again.');
      this.isSubmitting = false;
    }
  });
}
 private resetForm() {
    this.reclamation = {
      type: 'Destination',
      description: '',
      statut: 'EN_COURS',
      acceptationDeclaration: false,
      dateAcceptation: null,
      image: ''
    };
  }

  ouvrirDeclaration() {
    this.showDeclaration = true;
  }

  fermerDeclaration() {
    this.showDeclaration = false;
  }
}