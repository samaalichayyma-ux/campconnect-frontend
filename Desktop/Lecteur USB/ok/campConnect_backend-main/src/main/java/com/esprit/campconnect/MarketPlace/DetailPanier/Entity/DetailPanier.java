package com.esprit.campconnect.MarketPlace.DetailPanier.Entity;



import com.esprit.campconnect.MarketPlace.Panier.Entity.Panier;
import com.esprit.campconnect.MarketPlace.Produit.Entity.Produit;
import jakarta.persistence.*;

@Entity
@Table(name = "detail_panier")
public class DetailPanier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDetailPanier;

    private int quantite;

    private double prix;

    private String taille;

    private Integer pointure;

    @ManyToOne
    @JoinColumn(name = "panier_id")
    private Panier panier;

    @ManyToOne
    @JoinColumn(name = "produit_id")
    private Produit produit;

    public DetailPanier() {
    }

    public Long getIdDetailPanier() {
        return idDetailPanier;
    }

    public void setIdDetailPanier(Long idDetailPanier) {
        this.idDetailPanier = idDetailPanier;
    }

    public int getQuantite() {
        return quantite;
    }

    public void setQuantite(int quantite) {
        this.quantite = quantite;
    }

    public double getPrix() {
        return prix;
    }

    public void setPrix(double prix) {
        this.prix = prix;
    }

    public Panier getPanier() {
        return panier;
    }

    public void setPanier(Panier panier) {
        this.panier = panier;
    }

    public Produit getProduit() {
        return produit;
    }

    public void setProduit(Produit produit) {
        this.produit = produit;
    }

    public String getTaille() {
        return taille;
    }

    public void setTaille(String taille) {
        this.taille = taille;
    }

    public Integer getPointure() {
        return pointure;
    }

    public void setPointure(Integer pointure) {
        this.pointure = pointure;
    }

}
