package com.esprit.campconnect.Livraison.repository;

import com.esprit.campconnect.Livraison.entity.LivreurLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LivreurLocationRepository extends JpaRepository<LivreurLocation, Long> {
    Optional<LivreurLocation> findByLivraisonId(Long livraisonId);
}