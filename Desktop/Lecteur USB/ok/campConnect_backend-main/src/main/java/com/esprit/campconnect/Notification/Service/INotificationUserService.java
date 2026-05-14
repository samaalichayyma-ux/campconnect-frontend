package com.esprit.campconnect.Notification.Service;

import com.esprit.campconnect.Notification.Entity.NotificationType;
import com.esprit.campconnect.Notification.Entity.NotificationUser;
import com.esprit.campconnect.User.Entity.Utilisateur;

import java.util.List;

public interface INotificationUserService {
    NotificationUser createNotification(Utilisateur utilisateur, String titre, String message, NotificationType type);
    List<NotificationUser> getMyNotifications(String email);
    NotificationUser markAsRead(Long id, String email);
    void markAllAsRead(String email);
}