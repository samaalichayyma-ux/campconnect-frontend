package com.esprit.campconnect.Livraison.repository;

import com.esprit.campconnect.Livraison.entity.LivreurTip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LivreurTipRepository extends JpaRepository<LivreurTip, Long> {
    List<LivreurTip> findByLivraisonIdOrderByCreatedAtDesc(Long livraisonId);

    List<LivreurTip> findByLivreurIdOrderByCreatedAtDesc(Long livreurId);
    boolean existsByLivraisonIdAndClientId(Long livraisonId, Long clientId);
}