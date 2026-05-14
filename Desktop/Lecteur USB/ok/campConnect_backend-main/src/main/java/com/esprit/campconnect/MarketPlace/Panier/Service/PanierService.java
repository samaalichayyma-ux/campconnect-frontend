package com.esprit.campconnect.MarketPlace.Panier.Service;

import com.esprit.campconnect.MarketPlace.Panier.Entity.Panier;

import java.util.List;

public interface PanierService {

    Panier ajouterPanier(Panier panier);

    List<Panier> getAllPaniers();

    Panier getPanierById(Long id);

    Panier updatePanier(Long id, Panier panier);

    void deletePanier(Long id);

    Panier getOrCreatePanierEnCours(Long utilisateurId);

    String envoyerCouponPremiereCommande(Long userId);

}