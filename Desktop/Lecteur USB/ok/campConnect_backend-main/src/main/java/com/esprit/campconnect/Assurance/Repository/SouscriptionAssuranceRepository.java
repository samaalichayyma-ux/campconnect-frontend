package com.esprit.campconnect.Assurance.Repository;

import com.esprit.campconnect.Assurance.Entity.SouscriptionAssurance;
import com.esprit.campconnect.Assurance.Entity.StatutSouscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface SouscriptionAssuranceRepository extends JpaRepository<SouscriptionAssurance, Long> {
    List<SouscriptionAssurance> findByUtilisateurId(Long utilisateurId);
    boolean existsByUtilisateurIdAndAssuranceIdAndStatut(
            Long utilisateurId,
            Long assuranceId,
            StatutSouscription statut
    );
    List<SouscriptionAssurance> findByStatutAndDateFin(
            StatutSouscription statut,
            LocalDate dateFin
    );
}
