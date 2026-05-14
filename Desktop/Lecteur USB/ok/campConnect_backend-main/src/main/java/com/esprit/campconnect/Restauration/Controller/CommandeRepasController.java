package com.esprit.campconnect.Restauration.Controller;

import com.esprit.campconnect.Restauration.Entity.CommandeRepas;
import com.esprit.campconnect.Restauration.Enum.StatutCommandeRepas;
import com.esprit.campconnect.Restauration.Service.CommandeRepasService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/commandes-repas")
@CrossOrigin("*")
public class CommandeRepasController {

    private final CommandeRepasService commandeRepasService;

    public CommandeRepasController(CommandeRepasService commandeRepasService) {
        this.commandeRepasService = commandeRepasService;
    }

    @PostMapping
    public CommandeRepas create(@RequestBody CommandeRepas commandeRepas) {
        return commandeRepasService.createCommande(commandeRepas);
    }

    @GetMapping
    public List<CommandeRepas> getAll() {
        return commandeRepasService.getAllCommandes();
    }

    @GetMapping("/{id}")
    public CommandeRepas getById(@PathVariable Long id) {
        return commandeRepasService.getCommandeById(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        commandeRepasService.deleteCommande(id);
    }

    @PostMapping("/{commandeId}/lignes")
    public CommandeRepas ajouterLigne(
            @PathVariable Long commandeId,
            @RequestParam Long repasId,
            @RequestParam int quantite) {
        return commandeRepasService.ajouterLigne(commandeId, repasId, quantite);
    }

    @PutMapping("/{commandeId}/statut")
    public CommandeRepas changerStatut(
            @PathVariable Long commandeId,
            @RequestParam StatutCommandeRepas statut) {
        return commandeRepasService.changerStatut(commandeId, statut);
    }

    @GetMapping("/utilisateur/{utilisateurId}")
    public List<CommandeRepas> getByUtilisateur(@PathVariable Long utilisateurId) {
        return commandeRepasService.getCommandesByUtilisateur(utilisateurId);
    }
}