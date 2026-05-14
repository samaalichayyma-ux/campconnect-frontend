package com.esprit.campconnect.Notification.Service;

import com.esprit.campconnect.Notification.Entity.NotificationType;
import com.esprit.campconnect.Notification.Entity.NotificationUser;
import com.esprit.campconnect.Notification.Repository.NotificationUserRepository;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationUserServiceImp implements INotificationUserService {

    private final NotificationUserRepository notificationUserRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Override
    public NotificationUser createNotification(Utilisateur utilisateur, String titre, String message, NotificationType type) {
        NotificationUser notification = new NotificationUser();
        notification.setUtilisateur(utilisateur);
        notification.setTitre(titre);
        notification.setMessage(message);
        notification.setType(type);
        return notificationUserRepository.save(notification);
    }

    @Override
    public List<NotificationUser> getMyNotifications(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return notificationUserRepository.findByUtilisateurOrderByCreatedAtDesc(utilisateur);
    }

    @Override
    public NotificationUser markAsRead(Long id, String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        NotificationUser notification = notificationUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable"));

        if (!notification.getUtilisateur().getId().equals(utilisateur.getId())) {
            throw new RuntimeException("Accès refusé");
        }

        notification.setRead(true);
        return notificationUserRepository.save(notification);
    }

    @Override
    public void markAllAsRead(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        List<NotificationUser> notifications = notificationUserRepository.findByUtilisateurOrderByCreatedAtDesc(utilisateur);
        notifications.forEach(n -> n.setRead(true));
        notificationUserRepository.saveAll(notifications);
    }
}