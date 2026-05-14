package com.esprit.campconnect.Livraison.demo.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LivraisonFeeResponse {
    private Double itemsTotal;
    private Double baseFee;
    private Double distanceFee;
    private Double weightFee;
    private Double weatherFee;
    private Double deliveryFee;
    private Double finalTotal;

    private Double distanceKm;
    private Double poidsKg;

    private String weatherCondition;
    private Double temperature;
    private Double precipitation;

    private String deliveryZone;
}