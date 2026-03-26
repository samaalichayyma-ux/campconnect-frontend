import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  loadAvis() {
    this.avisService.getAvisBySite(this.siteId).subscribe(res => {
      this.avisList = res;
    });
  }

  getStars(note: number | null): number[] {
    return Array(note || 0).fill(0);
  }
}