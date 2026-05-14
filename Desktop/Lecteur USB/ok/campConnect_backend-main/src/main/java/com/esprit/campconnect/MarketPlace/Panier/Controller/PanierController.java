package com.esprit.campconnect.MarketPlace.Panier.Controller;

import com.esprit.campconnect.MarketPlace.Panier.Entity.Panier;
import com.esprit.campconnect.MarketPlace.Panier.Service.PanierService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/paniers")
public class PanierController {

    private final PanierService panierService;

    public PanierController(PanierService panierService) {
        this.panierService = panierService;
    }



    @PostMapping("/send-coupon/{userId}")
    public ResponseEntity<?> envoyerCoupon(@PathVariable Long userId) {
        try {
            panierService.envoyerCouponPremiereCommande(userId);
            return ResponseEntity.ok("Coupon envoyé par email avec succès.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PostMapping
    public ResponseEntity<?> ajouterPanier(@RequestBody Panier panier) {
        try {
            Panier savedPanier = panierService.ajouterPanier(panier);

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of(
                            "message", "Panier ajouté avec succès",
                            "idPanier", savedPanier.getIdPanier()
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Échec de l'ajout du panier : " + e.getMessage());
        }
    }

    @GetMapping
    public List<Panier> getAll() {
        return panierService.getAllPaniers();
    }

    @GetMapping("/{id}")
    public Panier getById(@PathVariable Long id) {
        return panierService.getPanierById(id);
    }

    @PutMapping("/{id}")
    public String update(@PathVariable Long id, @RequestBody Panier panier) {
        try {
            panierService.updatePanier(id, panier);
            return "Panier modifié avec succès";
        } catch (Exception e) {
            return "Échec de la modification du panier";
        }
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        try {
            panierService.deletePanier(id);
            return "Panier supprimé avec succès";
        } catch (Exception e) {
            return "Échec de la suppression du panier";
        }
    }
    @GetMapping("/{userId}/en-cours")
    public ResponseEntity<?> getOrCreatePanierEnCours(@PathVariable Long userId) {
        try {
            Panier panier = panierService.getOrCreatePanierEnCours(userId);
            return ResponseEntity.ok(
                    Map.of(
                            "message", "Panier en cours récupéré",
                            "idPanier", panier.getIdPanier()
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur panier: " + e.getMessage());
        }
    }
}