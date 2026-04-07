import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RepasService } from './repas.service';

@Component({
  selector: 'app-repas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './repas-admin.component.html',
  styleUrls: ['./repas-admin.component.css']
})
export class RepasAdminComponent implements OnInit {

  repasList: any[] = [];
  commandesList: any[] = [];

  searchText: string = '';

  showForm = false;
  isEdit = false;
  form: any = { id: null, nom: '', prix: 0 };

  constructor(private repasService: RepasService) {}

  ngOnInit() {
    this.loadRepas();
    this.loadCommandes();
  }

  // Load meals from Spring Boot
  loadRepas() {
    this.repasService.getAllRepas().subscribe(data => this.repasList = data);
  }

  // Load orders from Spring Boot
  loadCommandes() {
    this.repasService.getCommandes().subscribe(data => this.commandesList = data);
  }

  get filteredRepas() {
    if (!this.searchText) return this.repasList;
    return this.repasList.filter(r => r.nom.toLowerCase().includes(this.searchText.toLowerCase()));
  }

  openForm() {
    this.resetForm();
    this.showForm = true;
    this.isEdit = false;
  }

  edit(repas: any) {
    this.form = { ...repas };
    this.showForm = true;
    this.isEdit = true;
  }

  save() {
    if (!this.form.nom || !this.form.prix) {
      alert('Please fill all fields');
      return;
    }

    if (this.isEdit) {
      this.repasService.updateRepas(this.form.id, this.form).subscribe(() => this.loadRepas());
    } else {
      this.repasService.addRepas(this.form).subscribe(() => this.loadRepas());
    }

    this.cancel();
  }

  delete(id: number) {
    if (confirm('Are you sure you want to delete this meal?')) {
      this.repasService.deleteRepas(id).subscribe(() => this.loadRepas());
    }
  }

  updateCommandeStatus(commande: any, statut: string) {
    this.repasService.updateCommandeStatus(commande.id, statut)
      .subscribe(() => this.loadCommandes());
  }

  cancel() {
    this.showForm = false;
    this.resetForm();
  }

  resetForm() {
    this.form = { id: null, nom: '', prix: 0 };
  }
}