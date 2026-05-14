package com.esprit.campconnect.MarketPlace.Produit.Service;

import com.esprit.campconnect.MarketPlace.Produit.Entity.Categorie;
import com.esprit.campconnect.MarketPlace.Produit.Entity.Produit;
import com.esprit.campconnect.MarketPlace.Produit.Entity.StockProduit;
import com.esprit.campconnect.MarketPlace.Produit.Repository.ProduitRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProduitServiceImpl implements ProduitService {

    private final ProduitRepository produitRepository;

    public ProduitServiceImpl(ProduitRepository produitRepository) {
        this.produitRepository = produitRepository;
    }

    @Override
    public Produit ajouterProduit(Produit produit) {
        lierEtValiderStocks(produit);
        return produitRepository.save(produit);
    }

    @Override
    public List<Produit> getAllProduits() {
        return produitRepository.findAll();
    }

    @Override
    public Produit getProduitById(Long id) {
        return produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec id : " + id));
    }

    @Override
    public Produit updateProduit(Long id, Produit produit) {
        Produit existingProduit = getProduitById(id);

        existingProduit.setNom(produit.getNom());
        existingProduit.setDescription(produit.getDescription());
        existingProduit.setPrix(produit.getPrix());
        existingProduit.setCategorie(produit.getCategorie());
        existingProduit.setActive(produit.isActive());
        existingProduit.setStock(produit.getStock());

        // Garde l'ancienne image si aucune nouvelle image n'est envoyée
        if (produit.getImages() != null && !produit.getImages().isEmpty()) {
            existingProduit.setImages(produit.getImages());
        }

        if (existingProduit.getStocks() == null) {
            existingProduit.setStocks(new ArrayList<>());
        }

        existingProduit.getStocks().clear();

        if (produit.getStocks() != null && !produit.getStocks().isEmpty()) {
            for (StockProduit stock : produit.getStocks()) {
                StockProduit nouveauStock = new StockProduit();

                nouveauStock.setTaille(stock.getTaille());
                nouveauStock.setPointure(stock.getPointure());
                nouveauStock.setStock(stock.getStock());
                nouveauStock.setProduit(existingProduit);

                existingProduit.getStocks().add(nouveauStock);
            }
        }

        validerStocks(existingProduit);

        return produitRepository.save(existingProduit);
    }


    @Override
    public Produit modifierStockGlobal(Long idProduit, int stock) {
        Produit produit = produitRepository.findById(idProduit)
                .orElseThrow(() -> new RuntimeException("Produit introuvable"));

        produit.setStock(stock);

        return produitRepository.save(produit);
    }

    @Override
    public void deleteProduit(Long id) {
        produitRepository.deleteById(id);
    }

    @Override
    public List<Produit> getProduitsByCategory(Categorie categorie) {
        return produitRepository.findByCategorie(categorie);
    }

    @Override
    public void desactiverProduit(Long id) {
        Produit produit = getProduitById(id);
        produit.setActive(false);
        produitRepository.save(produit);
    }

    @Override
    public void activerProduit(Long id) {
        Produit produit = getProduitById(id);
        produit.setActive(true);
        produitRepository.save(produit);
    }

    private void lierEtValiderStocks(Produit produit) {
        if (produit.getStocks() == null) {
            produit.setStocks(new ArrayList<>());
        }

        for (StockProduit stock : produit.getStocks()) {
            stock.setProduit(produit);
        }

        validerStocks(produit);
    }

    private void validerStocks(Produit produit) {

        if (produit.getCategorie() == Categorie.VETEMENT) {
            if (produit.getStocks() == null || produit.getStocks().isEmpty()) {
                throw new RuntimeException("Au moins une taille avec stock est obligatoire pour un vêtement");
            }

            int total = 0;

            for (StockProduit stock : produit.getStocks()) {
                if (stock.getTaille() == null || stock.getTaille().isBlank()) {
                    throw new RuntimeException("La taille est obligatoire pour un vêtement");
                }

                if (stock.getStock() <= 0) {
                    throw new RuntimeException("Le stock doit être supérieur à 0 pour chaque taille");
                }

                stock.setPointure(null);
                stock.setProduit(produit);
                total += stock.getStock();
            }

            produit.setStock(total);
            return;
        }

        if (produit.getCategorie() == Categorie.CHAUSSURE) {
            if (produit.getStocks() == null || produit.getStocks().isEmpty()) {
                throw new RuntimeException("Au moins une pointure avec stock est obligatoire pour une chaussure");
            }

            int total = 0;

            for (StockProduit stock : produit.getStocks()) {
                if (stock.getPointure() == null) {
                    throw new RuntimeException("La pointure est obligatoire pour une chaussure");
                }

                if (stock.getStock() <= 0) {
                    throw new RuntimeException("Le stock doit être supérieur à 0 pour chaque pointure");
                }

                stock.setTaille(null);
                stock.setProduit(produit);
                total += stock.getStock();
            }

            produit.setStock(total);
            return;
        }

        // Catégories simples
        if (produit.getStocks() != null) {
            produit.getStocks().clear();
        }

        if (produit.getStock() <= 0) {
            throw new RuntimeException("Le stock est obligatoire pour cette catégorie");
        }
    }
}