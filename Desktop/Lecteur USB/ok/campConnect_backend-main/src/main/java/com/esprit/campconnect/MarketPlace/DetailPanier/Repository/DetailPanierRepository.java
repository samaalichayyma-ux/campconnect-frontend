package com.esprit.campconnect.MarketPlace.DetailPanier.Repository;

import com.esprit.campconnect.MarketPlace.DetailPanier.Entity.DetailPanier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DetailPanierRepository extends JpaRepository<DetailPanier, Long> {

    List<DetailPanier> findByPanierIdPanier(Long idPanier);

    boolean existsByProduitIdProduit(Long idProduit);

    Optional<DetailPanier> findByPanierIdPanierAndProduitIdProduitAndTaille(
            Long idPanier,
            Long idProduit,
            String taille
    );

    Optional<DetailPanier> findByPanierIdPanierAndProduitIdProduitAndPointure(
            Long idPanier,
            Long idProduit,
            Integer pointure
    );

    Optional<DetailPanier> findByPanierIdPanierAndProduitIdProduit(
            Long idPanier,
            Long idProduit
    );


}