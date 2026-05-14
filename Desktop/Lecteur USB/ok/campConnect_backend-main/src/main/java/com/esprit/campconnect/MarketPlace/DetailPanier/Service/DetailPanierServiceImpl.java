package com.esprit.campconnect.MarketPlace.DetailPanier.Service;

import com.esprit.campconnect.MarketPlace.DetailPanier.Entity.DetailPanier;
import com.esprit.campconnect.MarketPlace.DetailPanier.Repository.DetailPanierRepository;
import com.esprit.campconnect.MarketPlace.Produit.Entity.Categorie;
import com.esprit.campconnect.MarketPlace.Produit.Entity.Produit;
import com.esprit.campconnect.MarketPlace.Produit.Entity.StockProduit;
import com.esprit.campconnect.MarketPlace.Produit.Repository.ProduitRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DetailPanierServiceImpl implements IDetailPanierService {

    private final DetailPanierRepository detailPanierRepository;
    private final ProduitRepository produitRepository;

    public DetailPanierServiceImpl(
            DetailPanierRepository detailPanierRepository,
            ProduitRepository produitRepository
    ) {
        this.detailPanierRepository = detailPanierRepository;
        this.produitRepository = produitRepository;
    }

    @Override
    public DetailPanier ajouterDetailPanier(DetailPanier detailPanier) {
        Produit produit = produitRepository.findById(detailPanier.getProduit().getIdProduit())
                .orElseThrow(() -> new RuntimeException("Produit non trouve"));

        if (!produit.isActive() || produit.getStock() <= 0) {
            throw new RuntimeException("Produit indisponible");
        }

        if (detailPanier.getQuantite() <= 0) {
            throw new RuntimeException("Quantite invalide");
        }

        Long idPanier = detailPanier.getPanier().getIdPanier();
        Long idProduit = detailPanier.getProduit().getIdProduit();

        DetailPanier existingDetail;
        StockProduit stockVariante = null;

        if (produit.getCategorie() == Categorie.VETEMENT) {
            if (detailPanier.getTaille() == null || detailPanier.getTaille().isBlank()) {
                throw new RuntimeException("La taille est obligatoire pour un vetement");
            }

            stockVariante = produit.getStocks().stream()
                    .filter(stock -> stock.getTaille() != null)
                    .filter(stock -> stock.getTaille().equalsIgnoreCase(detailPanier.getTaille()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Taille introuvable pour ce produit"));

            existingDetail = detailPanierRepository
                    .findByPanierIdPanierAndProduitIdProduitAndTaille(
                            idPanier,
                            idProduit,
                            detailPanier.getTaille()
                    )
                    .orElse(null);
        } else if (produit.getCategorie() == Categorie.CHAUSSURE) {
            if (detailPanier.getPointure() == null) {
                throw new RuntimeException("La pointure est obligatoire pour une chaussure");
            }

            stockVariante = produit.getStocks().stream()
                    .filter(stock -> stock.getPointure() != null)
                    .filter(stock -> stock.getPointure().equals(detailPanier.getPointure()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Pointure introuvable pour ce produit"));

            existingDetail = detailPanierRepository
                    .findByPanierIdPanierAndProduitIdProduitAndPointure(
                            idPanier,
                            idProduit,
                            detailPanier.getPointure()
                    )
                    .orElse(null);
        } else {
            existingDetail = detailPanierRepository
                    .findByPanierIdPanierAndProduitIdProduit(idPanier, idProduit)
                    .orElse(null);
        }

        int stockDisponible = stockVariante != null ? stockVariante.getStock() : produit.getStock();

        if (stockDisponible < detailPanier.getQuantite()) {
            throw new RuntimeException("Stock insuffisant");
        }

        if (existingDetail != null) {
            int nouvelleQuantite = existingDetail.getQuantite() + detailPanier.getQuantite();

            if (stockDisponible < nouvelleQuantite) {
                throw new RuntimeException("Stock insuffisant");
            }

            existingDetail.setQuantite(nouvelleQuantite);
            return detailPanierRepository.save(existingDetail);
        }

        detailPanier.setProduit(produit);
        detailPanier.setPrix(produit.getPrix());
        return detailPanierRepository.save(detailPanier);
    }

    @Override
    public List<DetailPanier> getAllDetailsPanier() {
        return detailPanierRepository.findAll();
    }

    @Override
    public DetailPanier getDetailPanierById(Long id) {
        return detailPanierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("DetailPanier non trouve avec id : " + id));
    }

    @Override
    public DetailPanier updateDetailPanier(Long id, DetailPanier detailPanier) {
        DetailPanier existingDetail = getDetailPanierById(id);

        existingDetail.setQuantite(detailPanier.getQuantite());
        existingDetail.setPrix(detailPanier.getPrix());
        existingDetail.setPanier(detailPanier.getPanier());
        existingDetail.setProduit(detailPanier.getProduit());
        existingDetail.setTaille(detailPanier.getTaille());
        existingDetail.setPointure(detailPanier.getPointure());

        return detailPanierRepository.save(existingDetail);
    }

    @Override
    public void deleteDetailPanier(Long id) {
        DetailPanier detailPanier = getDetailPanierById(id);
        detailPanierRepository.delete(detailPanier);
    }

    @Override
    public List<DetailPanier> getDetailsByPanier(Long idPanier) {
        return detailPanierRepository.findByPanierIdPanier(idPanier);
    }
}
