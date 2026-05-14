package com.esprit.campconnect.MarketPlace.Produit.Repository;

import com.esprit.campconnect.MarketPlace.Produit.Entity.StockProduit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockProduitRepository
        extends JpaRepository<StockProduit, Long> {

    List<StockProduit> findByProduitIdProduit(Long idProduit);
}