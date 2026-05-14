package com.esprit.campconnect.MarketPlace.Commande.Repository;

import com.esprit.campconnect.MarketPlace.Commande.Entity.Commande;
import com.esprit.campconnect.MarketPlace.Commande.Entity.StatutCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommandeRepository extends JpaRepository<Commande, Long> {

    List<Commande> findByUtilisateur_Id(Long utilisateurId);

    List<Commande> findByUtilisateur_IdOrderByDateCommandeDescIdCommandeDesc(Long utilisateurId);

    List<Commande> findByUtilisateur_EmailOrderByDateCommandeDescIdCommandeDesc(String email);

    List<Commande> findByStatut(StatutCommande statut);

    boolean existsByUtilisateur_Id(Long utilisateurId);
}
