import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';
import { SiteCampingAvisService } from '../../services/site-camping-avis.service';

@Component({
  selector: 'app-add-avis',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-avis.component.html',
  styleUrl: './add-avis.component.css'
})
export class AddAvisComponent {
  @Input() siteId!: number;
@Output() avisAdded = new EventEmitter<void>();
  selectedRating = 0;
  hoverRating = 0;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private avisService: SiteCampingAvisService
  ) {
    this.form = this.fb.group({
      note: [null as number | null],
      commentaire: ['']
    });
  }

  setRating(star: number): void {
    this.selectedRating = star;
    this.form.patchValue({ note: star });
  }

onSubmit(): void {
  const value = this.form.value;
  const note = value.note as number | null;
  const commentaire = (value.commentaire || '').trim();


  if (note == null) {
    Swal.fire({
      icon: 'warning',
      title: 'Rating Required',
      text: 'Please select a rating before submitting your review.',
      confirmButtonColor: '#96952f',
      background: '#f5f5f3',
      color: '#172b44',
      customClass: {
        popup: 'custom-swal-popup'
      }
    });
    return;
  }

  if (note < 1 || note > 5) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid Rating',
      text: 'Rating must be between 1 and 5.',
      confirmButtonColor: '#96952f',
      background: '#f5f5f3',
      color: '#172b44'
    });
    return;
  }

  const payload: { note: number; commentaire?: string } = {
    note
  };

  if (commentaire) {
    payload.commentaire = commentaire;
  }

  this.avisService.createAvis(this.siteId, payload).subscribe({
    next: () => {
  Swal.fire({
    icon: 'success',
    title: 'Success',
    text: 'Review submitted!',
    confirmButtonColor: '#96952f',
    background: '#f5f5f3',
    color: '#172b44'
  });

  this.form.reset({
    note: null,
    commentaire: ''
  });
  this.selectedRating = 0;
  this.hoverRating = 0;

  this.avisAdded.emit();
},
    error: (error) => {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: 'Could not submit your review. Please try again.',
        confirmButtonColor: '#96952f',
        background: '#f5f5f3',
        color: '#172b44'
      });
    }
  });
}
}