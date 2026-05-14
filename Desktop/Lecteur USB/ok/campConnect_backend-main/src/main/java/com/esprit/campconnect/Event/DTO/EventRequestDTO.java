package com.esprit.campconnect.Event.DTO;

import com.esprit.campconnect.Event.Enum.EventCategory;
import com.esprit.campconnect.Event.Enum.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EventRequestDTO {

    @NotBlank(message = "Le titre de l'événement est requis")
    @Size(min = 3, max = 255, message = "Le titre doit être entre 3 et 255 caractères")
    private String titre;

    @NotBlank(message = "La description est requise")
    @Size(min = 10, max = 2000, message = "La description doit être entre 10 et 2000 caractères")
    private String description;

    @NotNull(message = "La catégorie est requise")
    private EventCategory categorie;

    @NotNull(message = "La date de début est requise")
    private LocalDateTime dateDebut;

    @NotNull(message = "La date de fin est requise")
    private LocalDateTime dateFin;

    @NotBlank(message = "Le lieu est requis")
    @Size(min = 3, max = 255, message = "Le lieu doit être entre 3 et 255 caractères")
    private String lieu;

    @DecimalMin(value = "-90.0", message = "La latitude doit Ãªtre supÃ©rieure ou Ã©gale Ã  -90")
    @DecimalMax(value = "90.0", message = "La latitude doit Ãªtre infÃ©rieure ou Ã©gale Ã  90")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0", message = "La longitude doit Ãªtre supÃ©rieure ou Ã©gale Ã  -180")
    @DecimalMax(value = "180.0", message = "La longitude doit Ãªtre infÃ©rieure ou Ã©gale Ã  180")
    private BigDecimal longitude;

    @Size(max = 255, message = "Le place ID Google ne peut pas dÃ©passer 255 caractÃ¨res")
    private String googlePlaceId;

    @NotNull(message = "La capacité maximale est requise")
    @Min(value = 1, message = "La capacité doit être au minimum 1")
    @Max(value = 10000, message = "La capacité ne peut pas dépasser 10000")
    private Integer capaciteMax;

    @Min(value = 0, message = "La capacité de la liste d'attente doit être au minimum 0")
    @Max(value = 1000, message = "La capacité de la liste d'attente ne peut pas dépasser 1000")
    private Integer capaciteWaitlist = 10;

    private Boolean reservationApprovalRequired = true;

    @NotNull(message = "Le prix est requis")
    @DecimalMin(value = "0.0", inclusive = true, message = "Le prix doit être positif")
    @DecimalMax(value = "99999.99", message = "Le prix est trop élevé")
    private BigDecimal prix;

    @NotNull(message = "La durée est requise")
    @Min(value = 15, message = "La durée minimale est 15 minutes")
    private Integer dureeMinutes;

    private Boolean published;

    @Size(max = 500, message = "L'URL de l'image bannière ne peut pas dépasser 500 caractères")
    private String bannerImage; // URL or path to banner/main image

    @Size(max = 500, message = "L'URL de l'image miniature ne peut pas dépasser 500 caractères")
    private String thumbnailImage; // URL or path to thumbnail image

    @Size(max = 5000, message = "La galerie d'images ne peut pas dépasser 5000 caractères")
    private String galleryImages; // JSON array of image URLs: ["url1", "url2", ...]

    // Validation: dateFin must be after dateDebut
    @AssertTrue(message = "La date de fin doit être après la date de début")
    private boolean isDateValid() {
        return dateDebut != null && dateFin != null && dateFin.isAfter(dateDebut);
    }

    // Validation: event duration must match dates (with 1 hour tolerance)
    @AssertTrue(message = "La durée ne correspond pas aux dates fournies")
    private boolean isDurationValid() {
        if (dateDebut == null || dateFin == null || dureeMinutes == null) return true;
        long minutesDiff = java.time.temporal.ChronoUnit.MINUTES.between(dateDebut, dateFin);
        return Math.abs(minutesDiff - dureeMinutes) <= 60; // 1 hour tolerance
    }

    @AssertTrue(message = "La latitude et la longitude doivent Ãªtre fournies ensemble")
    private boolean isCoordinatesPairValid() {
        return (latitude == null && longitude == null) || (latitude != null && longitude != null);
    }
}
