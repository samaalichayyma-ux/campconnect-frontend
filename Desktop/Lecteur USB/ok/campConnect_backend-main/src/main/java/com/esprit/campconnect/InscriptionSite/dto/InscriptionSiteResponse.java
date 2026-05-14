package com.esprit.campconnect.InscriptionSite.dto;


import com.esprit.campconnect.InscriptionSite.entity.StatutInscription;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InscriptionSiteResponse {

    Long idInscription;
    LocalDate dateDebut;
    LocalDate dateFin;
    Integer numberOfGuests;
    StatutInscription statut;

    InscriptionSiteCampingSummary siteCamping;

    Long utilisateurId;
    String utilisateurEmail;
}
