package com.esprit.campconnect.MarketPlace.Statistique.Controller;

import com.esprit.campconnect.MarketPlace.Statistique.DTO.MarketplaceStatDTO;
import com.esprit.campconnect.MarketPlace.Statistique.Service.MarketplaceStatService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/marketplace/stats")
@CrossOrigin(origins = "http://localhost:4200")
public class MarketplaceStatController {

    private final MarketplaceStatService marketplaceStatService;

    public MarketplaceStatController(MarketplaceStatService marketplaceStatService) {
        this.marketplaceStatService = marketplaceStatService;
    }

    @GetMapping("/produits")
    public List<MarketplaceStatDTO> getStatsProduits() {
        return marketplaceStatService.getStatsProduits();
    }

    @GetMapping("/meilleur-produit")
    public MarketplaceStatDTO getMeilleurProduit() {
        return marketplaceStatService.getMeilleurProduit();
    }

    @GetMapping("/resume")
    public Map<String, Object> getResumeMarketplace() {
        return marketplaceStatService.getResumeMarketplace();
    }
}