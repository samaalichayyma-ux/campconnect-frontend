package com.esprit.campconnect.InscriptionSite.dto;

import com.esprit.campconnect.siteCamping.entity.StatutDispo;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InscriptionSiteCampingSummary {

    Long idSite;
    String nom;
    String localisation;
    double prixParNuit;
    String imageUrl;
    StatutDispo statutDispo;
}