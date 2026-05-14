package com.esprit.campconnect.MarketPlace.DetailCommande.Entity;

import com.esprit.campconnect.MarketPlace.Commande.Entity.Commande;
import com.esprit.campconnect.MarketPlace.Produit.Entity.Produit;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "detail_commande")
public class DetailCommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDetailCommande;

    private int quantite;

    private double prixUnitaire;

    private double total;

    private String taille;
    private Integer pointure;

    @ManyToOne
    @JoinColumn(name = "commande_id")
    private Commande commande;

    @ManyToOne
    @JoinColumn(name = "produit_id")
    private Produit produit;

    public DetailCommande() {
    }


}