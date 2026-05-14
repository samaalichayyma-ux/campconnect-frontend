package com.esprit.campconnect.Notification.Controller;

import com.esprit.campconnect.Notification.Entity.NotificationUser;
import com.esprit.campconnect.Notification.Service.INotificationUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/me/notifications")
@RequiredArgsConstructor
@CrossOrigin("*")
public class NotificationUserController {

    private final INotificationUserService notificationUserService;

    @GetMapping
    public List<NotificationUser> getMyNotifications(Authentication authentication) {
        return notificationUserService.getMyNotifications(authentication.getName());
    }

    @PutMapping("/{id}/read")
    public NotificationUser markAsRead(@PathVariable Long id, Authentication authentication) {
        return notificationUserService.markAsRead(id, authentication.getName());
    }

    @PutMapping("/read-all")
    public void markAllAsRead(Authentication authentication) {
        notificationUserService.markAllAsRead(authentication.getName());
    }
}