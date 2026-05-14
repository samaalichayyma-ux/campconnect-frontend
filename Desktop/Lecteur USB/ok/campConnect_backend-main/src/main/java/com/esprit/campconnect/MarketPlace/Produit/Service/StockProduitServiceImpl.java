package com.esprit.campconnect.MarketPlace.Produit.Service;

import com.esprit.campconnect.MarketPlace.Produit.Entity.StockProduit;
import com.esprit.campconnect.MarketPlace.Produit.Repository.StockProduitRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StockProduitServiceImpl implements StockProduitService {

    private final StockProduitRepository stockProduitRepository;

    public StockProduitServiceImpl(
            StockProduitRepository stockProduitRepository
    ) {
        this.stockProduitRepository = stockProduitRepository;
    }

    @Override
    public List<StockProduit> getStockByProduit(Long idProduit) {

        return stockProduitRepository
                .findByProduitIdProduit(idProduit);
    }

    @Override
    public StockProduit modifierStock(
            Long id,
            StockProduit stockProduit
    ) {

        StockProduit existing =
                stockProduitRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException("Stock introuvable")
                        );

        existing.setTaille(stockProduit.getTaille());

        existing.setPointure(stockProduit.getPointure());

        existing.setStock(stockProduit.getStock());

        return stockProduitRepository.save(existing);
    }
}