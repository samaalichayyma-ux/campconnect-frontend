import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Avis, SiteCampingAvisService } from '../../services/site-camping-avis.service';

@Component({
  selector: 'app-avis-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avis-list.component.html',
  styleUrl: './avis-list.component.css'
})
export class AvisListComponent implements OnInit {
  @Input() siteId!: number;
  avisList: Avis[] = [];

  constructor(private avisService: SiteCampingAvisService) {}

  ngOnInit(): void {
    this.loadAvis();
  }

  loadAvis(): void {
    this.avisService.getAvisBySite(this.siteId).subscribe(res => {
      this.avisList = res;
    });
  }

  openEditPopup(avis: Avis): void {
    const currentNote = avis.note ?? 0;
    const currentComment = avis.commentaire ?? '';

    Swal.fire({
      title: 'Update Review',
      html: `
        <div class="swal-avis-edit">
          <label class="swal-label">Rating</label>
          <select id="swal-note" class="swal2-input">
            <option value="0" ${currentNote === 0 ? 'selected' : ''}>No rating</option>
            <option value="1" ${currentNote === 1 ? 'selected' : ''}>1</option>
            <option value="2" ${currentNote === 2 ? 'selected' : ''}>2</option>
            <option value="3" ${currentNote === 3 ? 'selected' : ''}>3</option>
            <option value="4" ${currentNote === 4 ? 'selected' : ''}>4</option>
            <option value="5" ${currentNote === 5 ? 'selected' : ''}>5</option>
          </select>

          <label class="swal-label">Comment</label>
          <textarea id="swal-comment" class="swal2-textarea" placeholder="Write your comment...">${currentComment}</textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#96952f',
      cancelButtonColor: '#172b44',
      background: '#f5f5f3',
      color: '#172b44',
      customClass: {
        popup: 'custom-swal-popup'
      },
      preConfirm: () => {
        const noteValue = (document.getElementById('swal-note') as HTMLSelectElement)?.value;
        const commentValue = (document.getElementById('swal-comment') as HTMLTextAreaElement)?.value?.trim();

        const note = Number(noteValue);

        if (note === 0 && !commentValue) {
          Swal.showValidationMessage('Please provide at least a rating or a comment.');
          return false;
        }

        if (note < 0 || note > 5) {
          Swal.showValidationMessage('Rating must be between 1 and 5.');
          return false;
        }

        return {
          note: note === 0 ? null : note,
          commentaire: commentValue || null
        };
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.avisService.updateAvis(avis.id, result.value).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: 'Your review has been updated successfully.',
              confirmButtonColor: '#96952f',
              background: '#f5f5f3',
              color: '#172b44',
              customClass: {
                popup: 'custom-swal-popup'
              }
            });

            this.loadAvis();
          },
          error: (error) => {
            console.error(error);

            Swal.fire({
              icon: 'error',
              title: 'Update Failed',
              text: 'Could not update your review.',
              confirmButtonColor: '#96952f',
              background: '#f5f5f3',
              color: '#172b44',
              customClass: {
                popup: 'custom-swal-popup'
              }
            });
          }
        });
      }
    });
  }

  getStars(note: number | null): number[] {
    return Array(note || 0).fill(0);
  }
}