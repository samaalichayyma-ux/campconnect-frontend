package com.esprit.campconnect.SiteCampingAvis.dto;


import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SiteCampingAvisResponse {

    Long id;
    Integer note;
    String commentaire;
    LocalDate dateCreation;
    Long siteId;

    Long utilisateurId;
    String utilisateurEmail;
}
