package com.esprit.campconnect.Assurance.Repository;

import com.esprit.campconnect.Assurance.Entity.Sinistre;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SinistreRepository extends JpaRepository<Sinistre, Long> {
    List<Sinistre> findBySouscriptionAssuranceId(Long souscriptionId);
}
