package com.esprit.campconnect.Assurance.Repository;

import com.esprit.campconnect.Assurance.Entity.DocumentAssurance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentAssuranceRepository extends JpaRepository<DocumentAssurance, Long> {
    List<DocumentAssurance> findBySinistreId(Long sinistreId);
}
