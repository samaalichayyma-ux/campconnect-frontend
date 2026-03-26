import { Component, Input, OnInit } from '@angular/core';
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

  @Input() siteId!: number;
  avisList: Avis[] = [];

  constructor(private avisService: SiteCampingAvisService) {}

  ngOnInit(): void {
    this.loadAvis();
  }

  loadAvis() {
    this.avisService.getAvisBySite(this.siteId).subscribe(res => {
      this.avisList = res;
    });
  }

  deleteAvis(id: number) {
    Swal.fire({
      title: 'Delete this review?',
      showCancelButton: true
    }).then(res => {
      if (res.isConfirmed) {
        this.avisService.deleteAvis(id).subscribe(() => {
          this.loadAvis();
        });
      }
    });
  }
}