package com.esprit.campconnect.Reservation.Controller;

import com.esprit.campconnect.Reservation.DTO.UserNotificationResponseDTO;
import com.esprit.campconnect.Reservation.Service.UserNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@CrossOrigin("*")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('CLIENT', 'ADMINISTRATEUR')")
@Tag(name = "Notifications", description = "Reservation notification center endpoints")
public class UserNotificationController {

    private final UserNotificationService userNotificationService;

    @GetMapping("/me")
    @Operation(summary = "Get my notifications", description = "Fetch the authenticated user's reservation notifications")
    @ApiResponse(responseCode = "200", description = "Notifications retrieved")
    public ResponseEntity<List<UserNotificationResponseDTO>> getMyNotifications(Authentication authentication) {
        return ResponseEntity.ok(
                userNotificationService.getNotificationsForUser(authentication != null ? authentication.getName() : null)
        );
    }

    @GetMapping("/me/unread-count")
    @Operation(summary = "Get unread notification count", description = "Fetch the authenticated user's unread notification count")
    @ApiResponse(responseCode = "200", description = "Unread count retrieved")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        long unreadCount = userNotificationService.getUnreadCountForUser(authentication != null ? authentication.getName() : null);
        return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
    }

    @PutMapping("/{notificationId}/read")
    @Operation(summary = "Mark a notification as read", description = "Mark one reservation notification as read")
    @ApiResponse(responseCode = "200", description = "Notification updated")
    public ResponseEntity<UserNotificationResponseDTO> markAsRead(
            @PathVariable Long notificationId,
            Authentication authentication) {
        return ResponseEntity.ok(
                userNotificationService.markAsRead(notificationId, authentication != null ? authentication.getName() : null)
        );
    }

    @PutMapping("/me/read-all")
    @Operation(summary = "Mark all notifications as read", description = "Mark all reservation notifications as read for the authenticated user")
    @ApiResponse(responseCode = "200", description = "Notifications updated")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        userNotificationService.markAllAsRead(authentication != null ? authentication.getName() : null);
        return ResponseEntity.noContent().build();
    }
}
