package com.esprit.campconnect.Reservation.Repository;

import com.esprit.campconnect.Reservation.Entity.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    List<UserNotification> findByUtilisateurIdOrderByCreatedAtDesc(Long utilisateurId);

    long countByUtilisateurIdAndReadFalse(Long utilisateurId);

    Optional<UserNotification> findByIdAndUtilisateurId(Long notificationId, Long utilisateurId);
}
