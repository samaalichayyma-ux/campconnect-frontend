package com.esprit.campconnect.MarketPlace.Produit.Service;

import com.esprit.campconnect.MarketPlace.Produit.Entity.Categorie;
import com.esprit.campconnect.MarketPlace.Produit.Entity.Produit;

import java.util.List;

public interface ProduitService {
    Produit ajouterProduit(Produit produit);

    List<Produit> getAllProduits();

    Produit getProduitById(Long id);

    Produit updateProduit(Long id, Produit produit);

    void deleteProduit(Long id);

    List<Produit> getProduitsByCategory(Categorie categorie);

    Produit modifierStockGlobal(Long idProduit, int stock);
    void desactiverProduit(Long id);
    void activerProduit(Long id);
}
