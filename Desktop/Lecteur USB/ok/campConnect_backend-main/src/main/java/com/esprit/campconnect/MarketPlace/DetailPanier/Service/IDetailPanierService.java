package com.esprit.campconnect.MarketPlace.DetailPanier.Service;



import com.esprit.campconnect.MarketPlace.DetailPanier.Entity.DetailPanier;

import java.util.List;

public interface IDetailPanierService {

    DetailPanier ajouterDetailPanier(DetailPanier detailPanier);

    List<DetailPanier> getAllDetailsPanier();

    DetailPanier getDetailPanierById(Long id);

    DetailPanier updateDetailPanier(Long id, DetailPanier detailPanier);

    void deleteDetailPanier(Long id);

    List<DetailPanier> getDetailsByPanier(Long idPanier);
}