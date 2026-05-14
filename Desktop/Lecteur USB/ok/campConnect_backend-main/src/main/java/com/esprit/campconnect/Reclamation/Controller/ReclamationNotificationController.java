package com.esprit.campconnect.Reclamation.Controller;

import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import com.esprit.campconnect.Reclamation.DTO.ReclamationNotificationDTO;
import com.esprit.campconnect.Reclamation.DTO.UnreadCountDTO;
import com.esprit.campconnect.Reclamation.Service.IReclamationNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reclamation-notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ReclamationNotificationController {

    private final IReclamationNotificationService notifService;
    private final UtilisateurRepository utilisateurRepository;

    // Récupère l'id de l'utilisateur connecté via son email (JWT)
    private Long getCurrentUserId(Authentication authentication) {
        String email = authentication.getName();
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email).get();
        return utilisateur.getId();
    }

    // GET /api/reclamation-notifications/me
    @GetMapping("/me")
    public List<ReclamationNotificationDTO> getMyNotifications(Authentication authentication) {
        return notifService.getMyNotifications(getCurrentUserId(authentication));
    }

    // GET /api/reclamation-notifications/me/unread-count
    @GetMapping("/me/unread-count")
    public UnreadCountDTO getUnreadCount(Authentication authentication) {
        return notifService.getUnreadCount(getCurrentUserId(authentication));
    }

    // PUT /api/reclamation-notifications/{id}/read
    @PutMapping("/{id}/read")
    public ReclamationNotificationDTO markAsRead(@PathVariable Long id,
                                                 Authentication authentication) {
        return notifService.markAsRead(id, getCurrentUserId(authentication));
    }

    // PUT /api/reclamation-notifications/me/read-all
    @PutMapping("/me/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        notifService.markAllAsRead(getCurrentUserId(authentication));
        return ResponseEntity.noContent().build();
    }
}