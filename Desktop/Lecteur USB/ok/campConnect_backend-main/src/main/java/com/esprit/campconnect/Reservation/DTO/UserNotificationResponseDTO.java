package com.esprit.campconnect.Reservation.DTO;

import com.esprit.campconnect.Reservation.Enum.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserNotificationResponseDTO {

    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private Boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    private Long reservationId;
    private Long eventId;
    private String actionLabel;
    private String actionUrl;
}
