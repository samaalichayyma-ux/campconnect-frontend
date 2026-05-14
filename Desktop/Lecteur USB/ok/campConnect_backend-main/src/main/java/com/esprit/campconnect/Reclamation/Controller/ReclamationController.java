package com.esprit.campconnect.Reclamation.Controller;

import com.esprit.campconnect.Reclamation.Entity.Reclamation;
import com.esprit.campconnect.Reclamation.Entity.StatutReclamation;
import com.esprit.campconnect.Reclamation.Service.ReclamationService;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/reclamations")
@CrossOrigin("*")

public class ReclamationController {

    private final ReclamationService reclamationService;

    public ReclamationController(ReclamationService reclamationService) {
        this.reclamationService = reclamationService;
    }

    @PostMapping
    public Reclamation create(@RequestBody Reclamation reclamation) {
        return reclamationService.createReclamation(reclamation);
    }

    @GetMapping
    public List<Reclamation> getAll() {
        return reclamationService.getAllReclamations();
    }

    @GetMapping("/{id}")
    public Reclamation getById(@PathVariable Long id) {
        return reclamationService.getReclamationById(id);
    }

    @PutMapping("/{id}")
    public Reclamation update(@PathVariable Long id, @RequestBody Reclamation reclamation) {
        return reclamationService.updateReclamation(id, reclamation);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        reclamationService.deleteReclamation(id);
    }

    @PutMapping("/{id}/statut")
    public Reclamation changerStatut(@PathVariable Long id, @RequestParam StatutReclamation statut) {
        return reclamationService.changerStatut(id, statut);
    }

    @GetMapping("/statut/{statut}")
    public List<Reclamation> getByStatut(@PathVariable StatutReclamation statut) {
        return reclamationService.getReclamationsByStatut(statut);
    }

    @GetMapping("/utilisateur/{utilisateurId}")
    public List<Reclamation> getByUtilisateur(@PathVariable Long utilisateurId) {
        return reclamationService.getReclamationsByUtilisateur(utilisateurId);
    }

    @GetMapping("/count/en-cours")
    public long countEnCours() {
        return reclamationService.countReclamationsEnCours();
    }
}