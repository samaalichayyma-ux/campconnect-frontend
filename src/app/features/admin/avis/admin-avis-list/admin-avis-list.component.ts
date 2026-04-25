import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Avis, SiteCampingAvisService } from '../../../public/services/site-camping-avis.service';

@Component({
  selector: 'app-admin-avis-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-avis-list.component.html',
  styleUrl: './admin-avis-list.component.css'
})
export class AdminAvisListComponent implements OnInit {
  avisList: Avis[] = [];

  constructor(private avisService: SiteCampingAvisService) {}

  ngOnInit(): void {
    this.loadAvis();
  }

  loadAvis() {
    this.avisService.getAllAdminAvis().subscribe(res => {
      this.avisList = res;
    });
  }

deleteAvis(id: number) {
  Swal.fire({
    title: 'Delete this review?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#b64141',
    cancelButtonColor: '#96952f',
    background: '#f5f5f3',
    color: '#172b44',
    reverseButtons: true,
    customClass: {
      popup: 'custom-swal-popup'
    }
  }).then(res => {
    if (res.isConfirmed) {
      Swal.fire({
        title: 'Deleting...',
        allowOutsideClick: false,
        background: '#f5f5f3',
        color: '#172b44',
        customClass: {
          popup: 'custom-swal-popup'
        },
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.avisService.deleteAvis(id).subscribe(() => {
        this.loadAvis();

        Swal.fire({
          title: 'Deleted!',
          text: 'Review has been removed.',
          icon: 'success',
          confirmButtonColor: '#96952f',
          background: '#f5f5f3',
          color: '#172b44',
          customClass: {
            popup: 'custom-swal-popup'
          }
        });
      });
    }
  });
}
}