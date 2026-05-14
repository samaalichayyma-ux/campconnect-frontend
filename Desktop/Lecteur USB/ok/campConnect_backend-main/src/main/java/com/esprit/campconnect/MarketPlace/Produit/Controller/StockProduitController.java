package com.esprit.campconnect.MarketPlace.Produit.Controller;

import com.esprit.campconnect.MarketPlace.Produit.Entity.StockProduit;
import com.esprit.campconnect.MarketPlace.Produit.Service.StockProduitService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stocks")
@CrossOrigin(origins = "http://localhost:4200")
public class StockProduitController {

    private final StockProduitService stockProduitService;
    public StockProduitController(
            StockProduitService stockProduitService
    ) {
        this.stockProduitService = stockProduitService;
    }

    @GetMapping("/produit/{idProduit}")
    public List<StockProduit> getStockByProduit(
            @PathVariable Long idProduit
    ) {

        return stockProduitService
                .getStockByProduit(idProduit);
    }

    @PutMapping("/{id}")
    public StockProduit modifierStock(
            @PathVariable Long id,
            @RequestBody StockProduit stockProduit
    ) {

        return stockProduitService
                .modifierStock(id, stockProduit);
    }
}