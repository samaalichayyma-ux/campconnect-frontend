package com.esprit.campconnect.Reclamation.DTO;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder

public class ReclamationNotificationDTO  {
    private Long id;
    private Long reclamationId;
    private String message;
    private String oldStatut;
    private String newStatut;
    private LocalDateTime dateCreation;
    private boolean read;
    private LocalDateTime readAt;
}