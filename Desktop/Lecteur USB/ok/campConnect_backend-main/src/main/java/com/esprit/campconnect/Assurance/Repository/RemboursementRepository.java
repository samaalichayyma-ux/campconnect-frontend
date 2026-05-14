package com.esprit.campconnect.Assurance.Repository;

import com.esprit.campconnect.Assurance.Entity.Remboursement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RemboursementRepository extends JpaRepository<Remboursement, Long> {
    List<Remboursement> findBySinistreId(Long sinistreId);
}
