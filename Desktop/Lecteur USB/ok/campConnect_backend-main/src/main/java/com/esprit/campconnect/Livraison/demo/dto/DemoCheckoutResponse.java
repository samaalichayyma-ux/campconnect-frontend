package com.esprit.campconnect.Livraison.demo.dto;

import com.esprit.campconnect.Livraison.entity.TypeCommandeLivraison;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DemoCheckoutResponse {

    private Long commandeId;
    private TypeCommandeLivraison typeCommande;

    private Double itemsTotal;

    private Double baseFee;
    private Double distanceFee;
    private Double weightFee;
    private Double weatherSurcharge;
    private Double deliveryFee;
    private Double finalTotal;

    private Double distanceKm;
    private Double poidsKg;

    private Double latitude;
    private Double longitude;

    private String adresseLivraison;
    private String noteLivraison;
    private String statut;

    private String weatherCondition;
    private Double temperature;
    private Double precipitation;
}