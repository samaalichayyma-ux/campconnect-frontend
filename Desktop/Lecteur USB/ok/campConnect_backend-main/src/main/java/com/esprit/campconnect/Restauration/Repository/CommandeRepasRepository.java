package com.esprit.campconnect.Restauration.Repository;

import com.esprit.campconnect.Restauration.Entity.CommandeRepas;
import com.esprit.campconnect.Restauration.Enum.StatutCommandeRepas;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommandeRepasRepository extends JpaRepository<CommandeRepas, Long> {
    List<CommandeRepas> findByUtilisateurId(Long utilisateurId);

    List<CommandeRepas> findByStatut(StatutCommandeRepas statut);
}