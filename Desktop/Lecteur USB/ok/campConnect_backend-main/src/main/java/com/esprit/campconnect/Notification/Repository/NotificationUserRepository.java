package com.esprit.campconnect.Notification.Repository;

import com.esprit.campconnect.Notification.Entity.NotificationUser;
import com.esprit.campconnect.User.Entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationUserRepository extends JpaRepository<NotificationUser, Long> {
    List<NotificationUser> findByUtilisateurOrderByCreatedAtDesc(Utilisateur utilisateur);
}