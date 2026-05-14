package com.esprit.campconnect.Reclamation.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.esprit.campconnect.Reclamation.Entity.ReclamationNotification;

import java.util.List;
import java.util.Optional;

public interface ReclamationNotificationRepository extends JpaRepository<ReclamationNotification, Long> {

    // Toutes les notifs d'un user, triées par date décroissante
    List<ReclamationNotification> findByUtilisateurIdOrderByDateCreationDesc(Long utilisateurId);

    // Comptage des non-lues pour le badge 🔔
    long countByUtilisateurIdAndReadFalse(Long utilisateurId);

    // Récupérer une notif appartenant à un user précis (sécurité)
    Optional<ReclamationNotification> findByIdAndUtilisateurId(Long id, Long utilisateurId);

    // Marquer toutes comme lues en une seule requête
    @Modifying
    @Query("""
        UPDATE ReclamationNotification n
        SET n.read = true, n.readAt = CURRENT_TIMESTAMP
        WHERE n.utilisateurId = :userId AND n.read = false
    """)
    void markAllAsReadByUserId(@Param("userId") Long userId);
}