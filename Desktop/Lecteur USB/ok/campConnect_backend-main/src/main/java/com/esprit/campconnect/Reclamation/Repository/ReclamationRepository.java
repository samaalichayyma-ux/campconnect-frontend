package com.esprit.campconnect.Reclamation.Repository;
import com.esprit.campconnect.Reclamation.Entity.Reclamation;
import com.esprit.campconnect.Reclamation.Entity.StatutReclamation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ReclamationRepository extends JpaRepository<Reclamation, Long> {
    List<Reclamation> findByStatut(StatutReclamation statut);
    List<Reclamation> findByUtilisateurId(Long utilisateurId);
    long countByStatut(StatutReclamation statut);
}
