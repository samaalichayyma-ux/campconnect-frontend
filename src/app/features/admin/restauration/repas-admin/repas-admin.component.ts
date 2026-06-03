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
  form: any = { id: null, nom: '', prix: 0, image: '' };
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  constructor(private repasService: RepasService) {}

  ngOnInit() {
    this.loadRepas();
    this.loadCommandes();
  }

  loadRepas() {
    this.repasService.getAllRepas().subscribe(data => this.repasList = data);
  }

  loadCommandes() {
    this.repasService.getCommandes().subscribe(data => this.commandesList = data);
  }

  get filteredRepas() {
    if (!this.searchText) return this.repasList;
    return this.repasList.filter(r => r.nom.toLowerCase().includes(this.searchText.toLowerCase()));
  }

  isCloudinaryUrl(url: string): boolean {
    return !!url && (url.startsWith('http://') || url.startsWith('https://'));
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
    this.selectedImageFile = null;
    this.imagePreview = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    if (file.size > 5_000_000) { alert('Max 5 Mo'); return; }
    this.selectedImageFile = file;
    if (this.imagePreview) URL.revokeObjectURL(this.imagePreview);
    this.imagePreview = URL.createObjectURL(file);
  }

  save() {
    if (!this.form.nom || !this.form.prix) {
      alert('Please fill all fields');
      return;
    }

    const formData = new FormData();
    formData.append('nom', this.form.nom);
    formData.append('prix', this.form.prix.toString());
    if (this.selectedImageFile) {
      formData.append('image', this.selectedImageFile);
    }

    if (this.isEdit) {
      this.repasService.updateRepasWithImage(this.form.id, formData).subscribe(() => {
        this.loadRepas();
        this.cancel();
      });
    } else {
      this.repasService.addRepasWithImage(formData).subscribe(() => {
        this.loadRepas();
        this.cancel();
      });
    }
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
    this.form = { id: null, nom: '', prix: 0, image: '' };
    this.selectedImageFile = null;
    if (this.imagePreview) {
      URL.revokeObjectURL(this.imagePreview);
      this.imagePreview = null;
    }
  }
}