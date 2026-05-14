package com.esprit.campconnect.Notification.Entity;

import com.esprit.campconnect.User.Entity.Utilisateur;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class NotificationUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    String titre;

    String message;

    @Enumerated(EnumType.STRING)
    NotificationType type;

    boolean isRead;

    LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    @JsonIgnore
    Utilisateur utilisateur;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }
}