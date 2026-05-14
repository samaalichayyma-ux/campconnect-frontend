package com.esprit.campconnect.Livraison.demo.entity;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DemoCommandeRepas {
    Long id;
    Double total;
    String adresse;
    String statut;
}
