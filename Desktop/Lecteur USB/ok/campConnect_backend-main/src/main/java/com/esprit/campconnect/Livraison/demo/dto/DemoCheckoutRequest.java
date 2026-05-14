package com.esprit.campconnect.Livraison.demo.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DemoCheckoutRequest {
    List<DemoCheckoutItemRequest> items;
    String adresseLivraison;
    String noteLivraison;
    Double latitude;
    Double longitude;;
    Double distanceKm;
}