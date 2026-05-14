package com.esprit.campconnect.Livraison.repository;

import com.esprit.campconnect.Livraison.entity.Livraison;
import com.esprit.campconnect.Livraison.entity.StatutLivraison;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LivraisonRepository extends JpaRepository<Livraison, Long> {
    List<Livraison> findByLivreur_Id(Long livreurId);

    long countByLivreur_IdAndStatutIn(Long livreurId, List<StatutLivraison> statuts);

    long countByLivreur_Id(Long livreurId);

    long countByLivreur_IdAndStatut(Long livreurId, StatutLivraison statut);

    @Query("""
    select l
    from Livraison l
    join l.livraisonCommande lc
    where
        (
            lc.typeCommande = com.esprit.campconnect.Livraison.entity.TypeCommandeLivraison.CLASSIQUE
            and lc.commandeId in (
                select c.idCommande
                from Commande c
                where c.utilisateur.id = :clientId
            )
        )
        or
        (
            lc.typeCommande = com.esprit.campconnect.Livraison.entity.TypeCommandeLivraison.REPAS
            and lc.commandeId in (
                select cr.id
                from CommandeRepas cr
                where cr.utilisateur.id = :clientId
            )
        )
""")
    List<Livraison> findClientLivraisons(@Param("clientId") Long clientId);
}