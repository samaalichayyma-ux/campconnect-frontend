package com.esprit.campconnect.Livraison.entity;

import com.esprit.campconnect.User.Entity.Utilisateur;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = {"livreur", "livraisonCommande"})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Livraison {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long idLivraison;

    LocalDate dateDepart;
    LocalDate dateLivraisonEffective;

    Double distanceKm;
    Double poidsKg;
    Double fraisDistance;
    Double fraisPoids;
    Double fraisMeteo;
    Double fraisLivraisonTotal;
    String meteoCondition;

    Double latitudeLivraison;
    Double longitudeLivraison;

    @Column(nullable = false)
    String adresseLivraison;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    StatutLivraison statut;

    String preuveLivraison;
    String commentaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "livreur_id")
    @JsonIgnore
    Utilisateur livreur;

    @OneToOne(mappedBy = "livraison", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    LivraisonCommande livraisonCommande;
}