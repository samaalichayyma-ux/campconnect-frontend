package com.esprit.campconnect.Restauration.Service;

import com.esprit.campconnect.Restauration.Entity.CommandeRepas;
import com.esprit.campconnect.Restauration.Entity.LigneCommandeRepas;
import com.esprit.campconnect.Restauration.Entity.Repas;
import com.esprit.campconnect.Restauration.Enum.StatutCommandeRepas;
import com.esprit.campconnect.Restauration.Repository.CommandeRepasRepository;
import com.esprit.campconnect.Restauration.Repository.RepasRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class CommandeRepasServiceImpl implements CommandeRepasService {

    private final CommandeRepasRepository commandeRepasRepository;
    private final RepasRepository repasRepository;

    public CommandeRepasServiceImpl(CommandeRepasRepository commandeRepasRepository, RepasRepository repasRepository) {
        this.commandeRepasRepository = commandeRepasRepository;
        this.repasRepository = repasRepository;
    }

    @Override
    public CommandeRepas createCommande(CommandeRepas commandeRepas) {
        commandeRepas.setDateCommande(LocalDate.now());
        commandeRepas.setStatut(StatutCommandeRepas.EN_ATTENTE);
        commandeRepas.setMontantTotal(0.0);
        return commandeRepasRepository.save(commandeRepas);
    }

    @Override
    public List<CommandeRepas> getAllCommandes() {
        return commandeRepasRepository.findAll();
    }

    @Override
    public CommandeRepas getCommandeById(Long id) {
        return commandeRepasRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));
    }

    @Override
    public void deleteCommande(Long id) {
        commandeRepasRepository.deleteById(id);
    }

    @Override
    public CommandeRepas ajouterLigne(Long commandeId, Long repasId, int quantite) {
        CommandeRepas commande = getCommandeById(commandeId);
        Repas repas = repasRepository.findById(repasId)
                .orElseThrow(() -> new RuntimeException("Repas introuvable"));

        LigneCommandeRepas ligne = new LigneCommandeRepas();
        ligne.setCommandeRepas(commande);
        ligne.setRepas(repas);
        ligne.setQuantite(quantite);
        ligne.setPrixUnitaire(repas.getPrix());

        commande.getLignes().add(ligne);

        double total = commande.getLignes().stream()
                .mapToDouble(l -> l.getQuantite() * l.getPrixUnitaire())
                .sum();

        commande.setMontantTotal(total);

        return commandeRepasRepository.save(commande);
    }

    @Override
    public CommandeRepas changerStatut(Long commandeId, StatutCommandeRepas statut) {
        CommandeRepas commande = getCommandeById(commandeId);

        if (commande.getStatut() == StatutCommandeRepas.LIVREE) {
            throw new RuntimeException("Impossible de modifier une commande déjà livrée");
        }

        commande.setStatut(statut);
        return commandeRepasRepository.save(commande);
    }

    @Override
    public List<CommandeRepas> getCommandesByUtilisateur(Long utilisateurId) {
        return commandeRepasRepository.findByUtilisateurId(utilisateurId);
    }
}
