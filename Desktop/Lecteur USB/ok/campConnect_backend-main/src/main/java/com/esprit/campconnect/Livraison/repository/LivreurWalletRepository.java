package com.esprit.campconnect.Livraison.repository;

import com.esprit.campconnect.Livraison.entity.LivreurWallet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LivreurWalletRepository extends JpaRepository<LivreurWallet, Long> {
    Optional<LivreurWallet> findByLivreurId(Long livreurId);
}