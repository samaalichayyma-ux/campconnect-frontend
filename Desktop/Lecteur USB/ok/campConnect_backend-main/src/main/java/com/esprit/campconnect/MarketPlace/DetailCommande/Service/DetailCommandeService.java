package com.esprit.campconnect.MarketPlace.DetailCommande.Service;

import com.esprit.campconnect.MarketPlace.DetailCommande.Entity.DetailCommande;

import java.util.List;

public interface DetailCommandeService {

    DetailCommande ajouterDetailCommande(DetailCommande detailCommande);

    List<DetailCommande> getAllDetailsCommande();

    DetailCommande getDetailCommandeById(Long id);

    DetailCommande updateDetailCommande(Long id, DetailCommande detailCommande);

    void deleteDetailCommande(Long id);

    List<DetailCommande> getDetailsByCommande(Long idCommande);
}