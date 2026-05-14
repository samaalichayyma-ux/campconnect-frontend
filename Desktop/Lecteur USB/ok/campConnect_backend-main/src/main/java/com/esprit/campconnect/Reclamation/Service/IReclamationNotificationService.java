package com.esprit.campconnect.Reclamation.Service;
import com.esprit.campconnect.Reclamation.DTO.ReclamationNotificationDTO;
import com.esprit.campconnect.Reclamation.DTO.UnreadCountDTO;
import com.esprit.campconnect.Reclamation.Entity.Reclamation;
import java.util.List;



public interface IReclamationNotificationService {

    /** Appelé automatiquement par ReclamationService lors d'un changement de statut */
    void createNotification(Reclamation reclamation, String oldStatut, String newStatut);

    /** GET /me → liste de toutes les notifications de l'utilisateur */
    List<ReclamationNotificationDTO> getMyNotifications(Long userId);

    /** GET /me/unread-count → { unreadCount: N } */
    UnreadCountDTO getUnreadCount(Long userId);

    /** PUT /{id}/read → marque une notification comme lue */
    ReclamationNotificationDTO markAsRead(Long notificationId, Long userId);

    /** PUT /me/read-all → toutes les notifs marquées lues */
    void markAllAsRead(Long userId);
}