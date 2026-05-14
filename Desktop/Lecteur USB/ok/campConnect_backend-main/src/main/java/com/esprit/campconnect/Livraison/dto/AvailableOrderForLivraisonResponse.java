package com.esprit.campconnect.Livraison.dto;

import com.esprit.campconnect.Livraison.entity.TypeCommandeLivraison;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AvailableOrderForLivraisonResponse {
    Long commandeId;
    TypeCommandeLivraison typeCommande;
    LocalDate dateCommande;
    String statut;
    Double total;

    Long clientId;
    String clientEmail;
    String clientNom;
    String clientTelephone;
}