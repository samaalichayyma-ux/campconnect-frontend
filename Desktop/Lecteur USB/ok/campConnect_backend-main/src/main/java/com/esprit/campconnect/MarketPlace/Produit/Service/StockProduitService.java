package com.esprit.campconnect.MarketPlace.Produit.Service;

import com.esprit.campconnect.MarketPlace.Produit.Entity.StockProduit;

import java.util.List;

public interface StockProduitService {

    List<StockProduit> getStockByProduit(Long idProduit);

    StockProduit modifierStock(
            Long id,
            StockProduit stockProduit
    );
}