package com.esprit.campconnect.siteCamping.dto;


import com.esprit.campconnect.siteCamping.entity.StatutDispo;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SiteCampingResponse {

    Long idSite;
    String nom;
    String localisation;
    int capacite;
    int remainingCapacity;
    double prixParNuit;
    String description;
    String imageUrl;
    String imagePublicId;
    StatutDispo statutDispo;
    Long ownerId;
    String ownerEmail;
}
