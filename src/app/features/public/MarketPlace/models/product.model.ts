export type Categorie = 'TENTE' | 'RECHAUD' | 'VETEMENT' | 'CUISINE' | 'CHAUSSURE';

export interface StockProduit {
  id?: number;
  taille?: string | null;
  pointure?: number | null;
  stock: number;
}

export interface Product {
  idProduit?: number;
  nom: string;
  description: string;
  prix: number;

  // ✅ AJOUT IMPORTANT
  stock: number;

  images: string[];
  categorie: Categorie;
  active?: boolean;

  // ✅ pour vetement / chaussure
  stocks: StockProduit[];

  // optionnel pour affichage
  stockTotal?: number;
}