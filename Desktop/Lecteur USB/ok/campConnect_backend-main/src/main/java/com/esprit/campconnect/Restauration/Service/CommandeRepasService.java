package com.esprit.campconnect.Restauration.Service;

import com.esprit.campconnect.Restauration.Entity.CommandeRepas;
import com.esprit.campconnect.Restauration.Enum.StatutCommandeRepas;

import java.util.List;

public interface CommandeRepasService {
    CommandeRepas createCommande(CommandeRepas commandeRepas);
    List<CommandeRepas> getAllCommandes();
    CommandeRepas getCommandeById(Long id);
    void deleteCommande(Long id);

    CommandeRepas ajouterLigne(Long commandeId, Long repasId, int quantite);
    CommandeRepas changerStatut(Long commandeId, StatutCommandeRepas statut);
    List<CommandeRepas> getCommandesByUtilisateur(Long utilisateurId);
}