package com.esprit.campconnect.Livraison.repository;

import com.esprit.campconnect.Livraison.entity.LivreurWithdraw;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LivreurWithdrawRepository extends JpaRepository<LivreurWithdraw, Long> {

    List<LivreurWithdraw> findByLivreurIdOrderByCreatedAtDesc(Long livreurId);
}