package com.esprit.campconnect.Livraison.demo.dto;

import com.esprit.campconnect.Livraison.entity.TypeCommandeLivraison;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DemoPaymentRequest {
    Long commandeId;
    TypeCommandeLivraison typeCommande;
    Double total;
    String adresseLivraison;
    String noteLivraison;

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