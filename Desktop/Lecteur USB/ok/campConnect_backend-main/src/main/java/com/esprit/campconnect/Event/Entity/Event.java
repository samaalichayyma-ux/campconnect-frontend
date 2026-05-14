package com.esprit.campconnect.Event.Entity;

import lombok.*;
import com.esprit.campconnect.Event.Enum.EventCategory;
import com.esprit.campconnect.Event.Enum.EventStatus;
import com.esprit.campconnect.Event.Enum.RecurrenceFrequency;
import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "event")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = {"organizer", "reservations", "images", "favorites"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private EventCategory categorie;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private EventStatus statut;

    @Column(nullable = false)
    private LocalDateTime dateDebut;

    @Column(nullable = false)
    private LocalDateTime dateFin;

    @Column(nullable = false)
    private String lieu;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(length = 255)
    private String googlePlaceId;

    @Column(nullable = false)
    private Integer capaciteMax;

    @Column(nullable = false)
    private Integer capaciteWaitlist = 10; // Default waitlist capacity

    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean reservationApprovalRequired = true;

    @Column(nullable = false)
    private BigDecimal prix;

    @Column(nullable = false)
    private Integer dureeMinutes; // Event duration in minutes

    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean published = true;

    private LocalDateTime publishedAt;

    private Long sourceEventId;

    @Enumerated(EnumType.STRING)
    private RecurrenceFrequency recurrenceFrequency;

    @Column(length = 500)
    private String bannerImage; // URL or path to banner/main image

    @Column(length = 500)
    private String thumbnailImage; // URL or path to thumbnail image

    @Column(columnDefinition = "TEXT")
    private String galleryImages; // JSON array of image URLs for gallery

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organisateur_id", nullable = false)
    private Utilisateur organizer;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime dateModification = LocalDateTime.now();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<Reservation> reservations;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private Set<EventImage> images;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<EventFavorite> favorites;

    // Helper method to get current participant count - SUM of all nombreParticipants for confirmed/paid
    public long getParticipantsCount() {
        if (reservations == null) return 0;
        return reservations.stream()
                .filter(r -> r.getStatut() == com.esprit.campconnect.Reservation.Enum.ReservationStatus.CONFIRMED 
                          || r.getStatut() == com.esprit.campconnect.Reservation.Enum.ReservationStatus.PAID)
                .mapToLong(r -> r.getNombreParticipants().longValue())
                .sum();
    }

    // Helper method to check if event is full
    public boolean isFullyBooked() {
        return getParticipantsCount() >= capaciteMax;
    }

    // Helper method to get waitlist count
    public long getWaitlistCount() {
        if (reservations == null) return 0;
        return reservations.stream()
                .filter(r -> Boolean.TRUE.equals(r.getEstEnAttente())
                        && r.getStatut() == com.esprit.campconnect.Reservation.Enum.ReservationStatus.PENDING)
                .mapToLong(r -> r.getNombreParticipants() != null ? r.getNombreParticipants().longValue() : 0L)
                .sum();
    }

    // Helper method to get available seats
    public Integer getAvailableSeats() {
        long currentParticipants = getParticipantsCount();
        return (int) Math.max(0, capaciteMax - currentParticipants);
    }

    public double getOccupancyRate() {
        if (capaciteMax == null || capaciteMax <= 0) {
            return 0D;
        }

        return Math.min(1D, Math.max(0D, (double) getParticipantsCount() / capaciteMax));
    }

    public boolean isAlmostFull() {
        if (isFullyBooked()) {
            return false;
        }

        int availableSeats = getAvailableSeats();
        int capacity = capaciteMax != null ? capaciteMax : 0;
        int urgencyThreshold = Math.max(3, (int) Math.ceil(capacity * 0.15));

        return availableSeats > 0 && (availableSeats <= urgencyThreshold || getOccupancyRate() >= 0.8D);
    }

    public long getFavoriteCount() {
        return favorites == null ? 0 : favorites.size();
    }
}
