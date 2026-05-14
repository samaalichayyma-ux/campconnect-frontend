package com.esprit.campconnect.Event.DTO;

import com.esprit.campconnect.Event.Enum.EventCategory;
import com.esprit.campconnect.Event.Enum.EventStatus;
import com.esprit.campconnect.Event.Enum.RecurrenceFrequency;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EventResponseDTO {

    private Long id;
    private String titre;
    private String description;
    private EventCategory categorie;
    private EventStatus statut;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private String lieu;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String googlePlaceId;
    private String googleMapsUrl;
    private Boolean hasMapLocation;
    private Integer capaciteMax;
    private Integer capaciteWaitlist;
    private Boolean reservationApprovalRequired;
    private BigDecimal prix;
    private Integer dureeMinutes;
    private Boolean published;
    private LocalDateTime publishedAt;
    private Long sourceEventId;
    private RecurrenceFrequency recurrenceFrequency;
    private String bannerImage;
    private String thumbnailImage;
    private String galleryImages;
    private String primaryImageUrl;
    private List<String> galleryImageUrls;
    private Integer imageCount;
    private Long organizerId;
    private String organizerNom;
    private String organizerEmail;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;

    // Computed fields
    private Long participantsCount;
    private Long waitlistCount;
    private Integer availableSeats;
    private Boolean isFullyBooked;
    private Boolean isAlmostFull;
    private Double occupancyRate;
    private Long favoriteCount;
    private Double averageRating;
    private Long feedbackCount;
    
    // Image gallery
    private List<EventImageDTO> images;
    private List<EventFeedbackDTO> feedbackEntries;
}
