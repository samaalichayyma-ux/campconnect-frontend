package com.esprit.campconnect.MarketPlace.Produit.DTO;


import java.util.List;

public class ProduitUserDTO {

        private Long idProduit;
        private String nom;
        private String description;
        private double prix;
        private String categorie;
        private List<String> images;

        public ProduitUserDTO() {
        }

        public ProduitUserDTO(Long idProduit, String nom, String description, double prix, String categorie, List<String> images) {
            this.idProduit = idProduit;
            this.nom = nom;
            this.description = description;
            this.prix = prix;
            this.categorie = categorie;
            this.images = images;
        }

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

        public String getCategorie() {
            return categorie;
        }

        public void setCategorie(String categorie) {
            this.categorie = categorie;
        }

        public List<String> getImages() {
            return images;
        }

        public void setImages(List<String> images) {
            this.images = images;
        }
    }