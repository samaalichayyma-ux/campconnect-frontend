package com.esprit.campconnect.Reclamation.Service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.esprit.campconnect.Reclamation.DTO.ReclamationNotificationDTO;
import com.esprit.campconnect.Reclamation.DTO.UnreadCountDTO;
import com.esprit.campconnect.Reclamation.Entity.Reclamation;
import com.esprit.campconnect.Reclamation.Entity.ReclamationNotification;
import com.esprit.campconnect.Reclamation.Repository.ReclamationNotificationRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReclamationNotificationServiceImpl implements IReclamationNotificationService {

    private final ReclamationNotificationRepository notifRepo;

    // ── Création automatique lors d'un changement de statut ────────────────
    @Override
    public void createNotification(Reclamation reclamation, String oldStatut, String newStatut) {
        ReclamationNotification notif = ReclamationNotification.builder()
                .reclamation(reclamation)
                .utilisateurId(reclamation.getUtilisateur().getId())
                .message(buildMessage(reclamation.getId(), newStatut))
                .oldStatut(oldStatut)
                .newStatut(newStatut)
                .dateCreation(LocalDateTime.now())
                .read(false)
                .build();

        notifRepo.save(notif);
    }

    // ── GET /me ────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<ReclamationNotificationDTO> getMyNotifications(Long userId) {
        return notifRepo.findByUtilisateurIdOrderByDateCreationDesc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ── GET /me/unread-count ───────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public UnreadCountDTO getUnreadCount(Long userId) {
        return new UnreadCountDTO(notifRepo.countByUtilisateurIdAndReadFalse(userId));
    }

    // ── PUT /{id}/read ─────────────────────────────────────────────────────
    @Override
    public ReclamationNotificationDTO markAsRead(Long notifId, Long userId) {
        ReclamationNotification notif = notifRepo
                .findByIdAndUtilisateurId(notifId, userId)
                .orElseThrow(() -> new RuntimeException(
                        "Notification " + notifId + " not found for user " + userId));

        notif.setRead(true);
        notif.setReadAt(LocalDateTime.now());
        return toDTO(notifRepo.save(notif));
    }

    // ── PUT /me/read-all ───────────────────────────────────────────────────
    @Override
    public void markAllAsRead(Long userId) {
        notifRepo.markAllAsReadByUserId(userId);
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    private String buildMessage(Long reclamationId, String newStatut) {
        String label = switch (newStatut) {
            case "EN_COURS"  -> "is now being processed";
            case "RESOLUE"   -> "has been resolved ✅";
            case "REJETEE"   -> "has been rejected ❌";
            case "EN_ATTENTE"-> "is pending review";
            default          -> "has been updated";
        };
        return "Your complaint #" + reclamationId + " " + label + ".";
    }

    private ReclamationNotificationDTO toDTO(ReclamationNotification n) {
        return ReclamationNotificationDTO.builder()
                .id(n.getId())
                .reclamationId(n.getReclamation().getId())
                .message(n.getMessage())
                .oldStatut(n.getOldStatut())
                .newStatut(n.getNewStatut())
                .dateCreation(n.getDateCreation())
                .read(n.isRead())
                .readAt(n.getReadAt())
                .build();
    }
}