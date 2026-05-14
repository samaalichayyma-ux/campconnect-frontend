package com.esprit.campconnect.SiteCampingAvis.dto;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SiteCampingAvisCreateRequest {

    Integer note;
    String commentaire;
}
