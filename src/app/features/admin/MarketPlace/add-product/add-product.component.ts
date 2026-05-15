import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProduitService } from '../service/produit.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Categorie, Product, StockProduit } from '../models/product.model';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css']
})
export class AddProductComponent implements OnInit {

  categories: Categorie[] = ['TENTE', 'RECHAUD', 'VETEMENT', 'CUISINE', 'CHAUSSURE'];
  tailles: string[] = ['S', 'M', 'L', 'XL', '2XL'];

  produit: Product = {
    idProduit: undefined,
    nom: '',
    description: '',
    prix: 0,
    stock: 0,
    categorie: 'TENTE',
    images: [],
    stocks: [],
    active: true
  };

  isEditMode = false;
  productId!: number;

  selectedTaille = '';
  selectedPointure: number | null = null;
  selectedStock: number | null = null;

  selectedImageFiles: File[] = [];
  selectedFileNames: string[] = [];
  imagePreview: string | null = null;

  readonly maxImages = 5;
  readonly allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  constructor(
    private produitService: ProduitService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode = true;
      this.productId = Number(id);
      this.loadProduct();
    }
  }

  loadProduct(): void {
    this.produitService.getProduitById(this.productId).subscribe({
      next: (data: Product) => {
        this.produit = {
          ...data,
          stocks: data.stocks ?? [],
          active: data.active ?? true
        };

        this.selectedFileNames = data.images ?? [];

        if (data.images && data.images.length > 0) {
          this.imagePreview = 'http://localhost:8082/api/uploads/' + data.images[0];
        } else {
          this.imagePreview = null;
        }
      },
      error: (err) => {
        console.error('Error while loading product:', err);
        alert('Unable to load product.');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.selectedImageFiles = [];
      this.selectedFileNames = this.isEditMode ? [...this.produit.images] : [];
      this.imagePreview = this.isEditMode && this.produit.images.length > 0
        ? 'http://localhost:8082/api/uploads/' + this.produit.images[0]
        : null;
      return;
    }

    const files = Array.from(input.files);

    if (files.length > this.maxImages) {
      alert(`You can upload a maximum of ${this.maxImages} images.`);
      input.value = '';
      return;
    }

    const invalidFiles = files.filter(file => !this.allowedImageTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      alert('Only PNG, JPG, JPEG and WEBP images are allowed.');
      input.value = '';
      return;
    }

    this.selectedImageFiles = files;
    this.selectedFileNames = files.map(file => file.name);
    this.produit.images = [...this.selectedFileNames];

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(this.selectedImageFiles[0]);
  }

  onCategorieChange(): void {
    this.produit.stocks = [];
    this.selectedTaille = '';
    this.selectedPointure = null;
    this.selectedStock = null;

    if (this.produit.categorie === 'VETEMENT' || this.produit.categorie === 'CHAUSSURE') {
      this.produit.stock = 0;
    }
  }

  ajouterDetail(): void {
    if (this.produit.categorie === 'VETEMENT') {
      this.ajouterTailleStock();
      return;
    }

    if (this.produit.categorie === 'CHAUSSURE') {
      this.ajouterPointureStock();
      return;
    }
  }

  ajouterTailleStock(): void {
    if (!this.selectedTaille) {
      alert('Please select a size.');
      return;
    }

    if (this.selectedStock === null || this.selectedStock <= 0) {
      alert('Please enter a valid stock.');
      return;
    }

    const existingIndex = this.produit.stocks.findIndex(
      s => s.taille === this.selectedTaille
    );

    if (existingIndex !== -1) {
      this.produit.stocks[existingIndex].stock = this.selectedStock;
    } else {
      const stockItem: StockProduit = {
        taille: this.selectedTaille,
        pointure: null,
        stock: this.selectedStock
      };
      this.produit.stocks.push(stockItem);
    }

    this.produit.stock = this.getStockTotalLocal();
    this.selectedTaille = '';
    this.selectedStock = null;
  }

  ajouterPointureStock(): void {
    if (this.selectedPointure === null || this.selectedPointure < 36 || this.selectedPointure > 44) {
      alert('Please enter a shoe size between 36 and 44.');
      return;
    }

    if (this.selectedStock === null || this.selectedStock <= 0) {
      alert('Please enter a valid stock.');
      return;
    }

    const existingIndex = this.produit.stocks.findIndex(
      s => s.pointure === this.selectedPointure
    );

    if (existingIndex !== -1) {
      this.produit.stocks[existingIndex].stock = this.selectedStock;
    } else {
      const stockItem: StockProduit = {
        taille: null,
        pointure: this.selectedPointure,
        stock: this.selectedStock
      };
      this.produit.stocks.push(stockItem);
    }

    this.produit.stock = this.getStockTotalLocal();
    this.selectedPointure = null;
    this.selectedStock = null;
  }

  supprimerStock(index: number): void {
    this.produit.stocks.splice(index, 1);
    this.produit.stock = this.getStockTotalLocal();
  }

  getStockTotalLocal(): number {
    return this.produit.stocks.reduce((total, item) => total + item.stock, 0);
  }

onSubmit(): void {
  this.produit.nom = this.produit.nom.trim();
  this.produit.description = this.produit.description.trim();

  if (!this.produit.nom || this.produit.nom.length < 3) {
    alert('Product name must contain at least 3 characters.');
    return;
  }

  if (!this.produit.description || this.produit.description.length < 5) {
    alert('Description must contain at least 5 characters.');
    return;
  }

  if (this.produit.prix <= 0) {
    alert('Price must be greater than 0.');
    return;
  }

  if (this.produit.categorie === 'VETEMENT' && this.produit.stocks.length === 0) {
    alert('Please add at least one size with stock.');
    return;
  }

  if (this.produit.categorie === 'CHAUSSURE' && this.produit.stocks.length === 0) {
    alert('Please add at least one shoe size with stock.');
    return;
  }

  if (
    this.produit.categorie !== 'VETEMENT' &&
    this.produit.categorie !== 'CHAUSSURE' &&
    this.produit.stock <= 0
  ) {
    alert('Stock must be greater than 0.');
    return;
  }

  if (!this.isEditMode && this.selectedImageFiles.length === 0) {
    alert('Please select at least one image.');
    return;
  }

  // 🔥 MODE UPDATE (inchangé)
  if (this.isEditMode) {
    const payload: Product = {
      idProduit: this.productId,
      nom: this.produit.nom,
      description: this.produit.description,
      prix: this.produit.prix,
      stock: this.getStockTotalLocal(),
      categorie: this.produit.categorie,
      active: this.produit.active ?? true,
      images: this.produit.images ?? [],
      stocks: this.produit.stocks
    };

    this.produitService.updateProduit(this.productId, payload).subscribe({
      next: () => {
        alert('Product updated successfully.');
        this.router.navigate(['/Market/listProduct']);
      },
      error: () => {
        alert('Error updating product.');
      }
    });

  } else {

    // 🔥 MODE ADD
    const formData = new FormData();

    formData.append('nom', this.produit.nom);
    formData.append('description', this.produit.description);
    formData.append('prix', this.produit.prix.toString());
    formData.append('categorie', this.produit.categorie);

    // ✅ STOCK TOTAL AUTO
    const totalStock =
      this.produit.categorie === 'VETEMENT' || this.produit.categorie === 'CHAUSSURE'
        ? this.getStockTotalLocal()
        : this.produit.stock;

    formData.append('stock', totalStock.toString());

    // 🔥 IMPORTANT : ENVOYER LES STOCKS
    if (this.produit.categorie === 'VETEMENT' || this.produit.categorie === 'CHAUSSURE') {
      formData.append('stocks', JSON.stringify(this.produit.stocks));
    }

    // images
    this.selectedImageFiles.forEach(file => {
      formData.append('images', file);
    });

    this.produitService.ajouterProduit(formData).subscribe({
      next: () => {
        alert('Product added successfully.');
        this.resetForm();
        this.router.navigate(['/Market/listProduct']);
      },
      error: (err) => {
        console.error(err);
        alert('Error adding product.');
      }
    });
  }
}

  private resetForm(): void {
    this.produit = {
      idProduit: undefined,
      nom: '',
      description: '',
      prix: 0,
      stock: 0,
      categorie: 'TENTE',
      images: [],
      stocks: [],
      active: true
    };

    this.selectedTaille = '';
    this.selectedPointure = null;
    this.selectedStock = null;
    this.selectedImageFiles = [];
    this.selectedFileNames = [];
    this.imagePreview = null;
  }
}