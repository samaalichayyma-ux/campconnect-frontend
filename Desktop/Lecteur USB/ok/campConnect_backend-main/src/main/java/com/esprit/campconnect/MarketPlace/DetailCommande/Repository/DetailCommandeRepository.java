package com.esprit.campconnect.MarketPlace.DetailCommande.Repository;

import com.esprit.campconnect.MarketPlace.DetailCommande.Entity.DetailCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetailCommandeRepository extends JpaRepository<DetailCommande, Long> {

    List<DetailCommande> findByCommandeIdCommande(Long idCommande);
}