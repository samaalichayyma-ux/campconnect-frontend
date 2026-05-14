package com.esprit.campconnect.MarketPlace.Produit.Entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "produit")
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idProduit;

    private String nom;

    private String description;

    private double prix;

    // ✅ stock global pour TENTE / RECHAUD / CUISINE
    // ✅ sera aussi mis à jour automatiquement pour VETEMENT / CHAUSSURE
    private int stock;

    @ElementCollection
    @CollectionTable(name = "produit_images", joinColumns = @JoinColumn(name = "produit_id"))
    @Column(name = "image")
    private List<String> images = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private Categorie categorie;

    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "produit", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<StockProduit> stocks = new ArrayList<>();

    public Produit() {}

    public Long getIdProduit() {
        return idProduit;
    }

    public void setIdProduit(Long idProduit) {
        this.idProduit = idProduit;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getPrix() {
        return prix;
    }

    public void setPrix(double prix) {
        this.prix = prix;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public Categorie getCategorie() {
        return categorie;
    }

    public void setCategorie(Categorie categorie) {
        this.categorie = categorie;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public List<StockProduit> getStocks() {
        return stocks;
    }

    public void setStocks(List<StockProduit> stocks) {
        this.stocks = stocks;
    }

    // ✅ stock total affichable côté front
    @Transient
    public int getStockTotal() {
        if (categorie == Categorie.VETEMENT || categorie == Categorie.CHAUSSURE) {
            if (stocks == null) return 0;

            return stocks.stream()
                    .mapToInt(StockProduit::getStock)
                    .sum();
        }

        return stock;
    }
}