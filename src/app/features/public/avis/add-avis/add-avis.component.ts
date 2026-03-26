import { Component, Input } from '@angular/core';
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

  selectedRating = 0;
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

    if (note == null && !commentaire) {
      Swal.fire('Error', 'Provide at least a rating or a comment.', 'error');
      return;
    }

    if (note != null && (note < 1 || note > 5)) {
      Swal.fire('Error', 'Rating must be between 1 and 5.', 'error');
      return;
    }

    const payload: { note?: number; commentaire?: string } = {};

    if (note != null) {
      payload.note = note;
    }

    if (commentaire) {
      payload.commentaire = commentaire;
    }

    this.avisService.createAvis(this.siteId, payload).subscribe({
      next: () => {
        Swal.fire('Success', 'Review submitted!', 'success');
        this.form.reset({
          note: null,
          commentaire: ''
        });
        this.selectedRating = 0;
      },
      error: (error) => {
        console.error(error);
        Swal.fire('Error', 'Failed to submit review.', 'error');
      }
    });
  }
}