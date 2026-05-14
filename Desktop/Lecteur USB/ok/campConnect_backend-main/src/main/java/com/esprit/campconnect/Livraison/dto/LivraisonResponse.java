package com.esprit.campconnect.Livraison.dto;

import com.esprit.campconnect.Livraison.entity.TypeCommandeLivraison;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LivraisonResponse {

    Long idLivraison;
    LocalDate dateDepart;
    LocalDate dateLivraisonEffective;
    String adresseLivraison;
    String statut;
    String preuveLivraison;
    String commentaire;

    Long livreurId;
    String livreurNom;
    String livreurEmail;

    Double latitudeLivraison;
    Double longitudeLivraison;

    Long commandeId;
    TypeCommandeLivraison typeCommande;
}