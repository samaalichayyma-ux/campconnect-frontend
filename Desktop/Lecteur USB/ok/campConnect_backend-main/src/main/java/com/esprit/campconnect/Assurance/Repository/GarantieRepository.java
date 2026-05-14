package com.esprit.campconnect.Assurance.Repository;

import com.esprit.campconnect.Assurance.Entity.Garantie;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GarantieRepository extends JpaRepository<Garantie, Long> {
    List<Garantie> findByAssuranceId(Long assuranceId);
}
