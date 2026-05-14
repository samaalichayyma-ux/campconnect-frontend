package com.esprit.campconnect.InscriptionSite.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InscriptionSiteCreateRequest {

    LocalDate dateDebut;
    LocalDate dateFin;
    Integer numberOfGuests;
    Long siteId;
}