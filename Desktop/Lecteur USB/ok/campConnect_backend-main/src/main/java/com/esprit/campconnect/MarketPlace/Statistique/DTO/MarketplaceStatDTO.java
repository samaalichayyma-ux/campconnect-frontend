package com.esprit.campconnect.MarketPlace.Statistique.DTO;

public class MarketplaceStatDTO {

    private Long idProduit;
    private String nomProduit;
    private int quantiteVendue;
    private double chiffreAffaire;
    private double tauxAchat;

    public MarketplaceStatDTO() {
    }

    public MarketplaceStatDTO(Long idProduit, String nomProduit, int quantiteVendue, double chiffreAffaire, double tauxAchat) {
        this.idProduit = idProduit;
        this.nomProduit = nomProduit;
        this.quantiteVendue = quantiteVendue;
        this.chiffreAffaire = chiffreAffaire;
        this.tauxAchat = tauxAchat;
    }

    public Long getIdProduit() {
        return idProduit;
    }

    public void setIdProduit(Long idProduit) {
        this.idProduit = idProduit;
    }

    public String getNomProduit() {
        return nomProduit;
    }

    public void setNomProduit(String nomProduit) {
        this.nomProduit = nomProduit;
    }

    public int getQuantiteVendue() {
        return quantiteVendue;
    }

    public void setQuantiteVendue(int quantiteVendue) {
        this.quantiteVendue = quantiteVendue;
    }

    public double getChiffreAffaire() {
        return chiffreAffaire;
    }

    public void setChiffreAffaire(double chiffreAffaire) {
        this.chiffreAffaire = chiffreAffaire;
    }

    public double getTauxAchat() {
        return tauxAchat;
    }

    public void setTauxAchat(double tauxAchat) {
        this.tauxAchat = tauxAchat;
    }
}
