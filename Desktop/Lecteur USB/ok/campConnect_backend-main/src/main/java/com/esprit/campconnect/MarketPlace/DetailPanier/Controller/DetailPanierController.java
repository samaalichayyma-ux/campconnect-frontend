package com.esprit.campconnect.MarketPlace.DetailPanier.Controller;


import com.esprit.campconnect.MarketPlace.DetailPanier.Entity.DetailPanier;
import com.esprit.campconnect.MarketPlace.DetailPanier.Service.IDetailPanierService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/detail-panier")
@CrossOrigin(origins = "http://localhost:4200")
public class DetailPanierController {


    private final IDetailPanierService detailPanierService;

    public DetailPanierController(IDetailPanierService detailPanierService) {
        this.detailPanierService = detailPanierService;
    }

    @PostMapping
    public String ajouterDetailPanier(@RequestBody DetailPanier detailPanier) {
        try {
            detailPanierService.ajouterDetailPanier(detailPanier);
            return "Detail panier ajouté avec succès";
        } catch (Exception e) {
            return "Échec de l'ajout du detail panier";
        }
    }

    @GetMapping
    public List<DetailPanier> getAll() {
        return detailPanierService.getAllDetailsPanier();
    }

    @GetMapping("/{id}")
    public DetailPanier getById(@PathVariable Long id) {
        return detailPanierService.getDetailPanierById(id);
    }

    @PutMapping("/{id}")
    public String update(@PathVariable Long id, @RequestBody DetailPanier detailPanier) {
        try {
            detailPanierService.updateDetailPanier(id, detailPanier);
            return "Detail panier modifié avec succès";
        } catch (Exception e) {
            return "Échec de la modification du detail panier";
        }
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        try {
            detailPanierService.deleteDetailPanier(id);
            return "Detail panier supprimé avec succès";
        } catch (Exception e) {
            return "Échec de la suppression du detail panier";
        }
    }

    @GetMapping("/panier/{idPanier}")
    public List<DetailPanier> getByPanier(@PathVariable Long idPanier) {
        return detailPanierService.getDetailsByPanier(idPanier);
    }
}