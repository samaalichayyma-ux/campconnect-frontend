package com.esprit.campconnect.MarketPlace.Commande.Service;

import com.esprit.campconnect.MarketPlace.Commande.Entity.Commande;
import com.esprit.campconnect.MarketPlace.Commande.Entity.EtatLivraison;
import com.esprit.campconnect.MarketPlace.Commande.Entity.StatutCommande;

import java.util.List;

public interface CommandeService {

    Commande ajouterCommande(Commande commande);

    List<Commande> getAllCommandes();

    Commande getCommandeById(Long id);

    Commande updateCommande(Long id, Commande commande);

    void deleteCommande(Long id);

    List<Commande> getCommandesByUtilisateur(Long utilisateurId);

    List<Commande> getCommandesByUtilisateurConnecte(String email);

    List<Commande> getCommandesByStatut(StatutCommande statut);

    Commande changerStatut(Long id, StatutCommande statut);

    Commande commanderDepuisPanier(Long idPanier);

    Commande changerEtatLivraison(Long id, EtatLivraison etatLivraison);

}
