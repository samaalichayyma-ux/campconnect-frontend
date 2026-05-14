package com.esprit.campconnect.Livraison.dto;

import com.esprit.campconnect.Livraison.entity.StatutLivraison;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LivraisonStatusUpdateRequest {
    StatutLivraison statut;
    String preuveLivraison;
    String commentaire;

    private Double currentLatitude;
    private Double currentLongitude;
}