package com.esprit.campconnect.MarketPlace.Statistique.Service;

import com.esprit.campconnect.MarketPlace.Statistique.DTO.MarketplaceStatDTO;

import java.util.List;
import java.util.Map;

public interface MarketplaceStatService {

    List<MarketplaceStatDTO> getStatsProduits();

    MarketplaceStatDTO getMeilleurProduit();

    Map<String, Object> getResumeMarketplace();
}