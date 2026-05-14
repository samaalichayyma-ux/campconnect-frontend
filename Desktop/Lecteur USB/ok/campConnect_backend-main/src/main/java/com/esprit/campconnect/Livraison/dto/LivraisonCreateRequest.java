package com.esprit.campconnect.Livraison.dto;

import com.esprit.campconnect.Livraison.entity.TypeCommandeLivraison;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LivraisonCreateRequest {
    Long commandeId;
    TypeCommandeLivraison typeCommande;
    String adresseLivraison;
    String commentaire;

    Double latitudeLivraison;
    Double longitudeLivraison;

    Double distanceKm;
    Double poidsKg;
    Double fraisDistance;
    Double fraisPoids;
    Double fraisMeteo;
    Double fraisLivraisonTotal;
    String meteoCondition;
}