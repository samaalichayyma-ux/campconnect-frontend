package com.esprit.campconnect.MarketPlace.DTO;

import com.esprit.campconnect.MarketPlace.Commande.Entity.StatutCommande;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StatutCommandeRequest {
    private StatutCommande statut;
}