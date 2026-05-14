package com.esprit.campconnect.Livraison.repository;

import com.esprit.campconnect.Livraison.entity.LivraisonCommande;
import com.esprit.campconnect.Livraison.entity.TypeCommandeLivraison;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LivraisonCommandeRepository extends JpaRepository<LivraisonCommande, Long> {

    boolean existsByCommandeIdAndTypeCommande(Long commandeId, TypeCommandeLivraison typeCommande);

    Optional<LivraisonCommande> findByLivraison_IdLivraison(Long idLivraison);
}