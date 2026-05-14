package com.esprit.campconnect.MarketPlace.Panier.Repository;

import com.esprit.campconnect.MarketPlace.Panier.Entity.EtatPanier;
import com.esprit.campconnect.MarketPlace.Panier.Entity.Panier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PanierRepository extends JpaRepository<Panier, Long> {
    Optional<Panier> findByUtilisateurIdAndEtat(Long utilisateurId, EtatPanier etat);
}

