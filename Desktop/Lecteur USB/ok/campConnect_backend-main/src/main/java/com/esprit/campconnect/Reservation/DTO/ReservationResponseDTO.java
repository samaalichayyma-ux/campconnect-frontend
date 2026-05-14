package com.esprit.campconnect.Reservation.DTO;

import com.esprit.campconnect.Reservation.Enum.PaymentStatus;
import com.esprit.campconnect.Reservation.Enum.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ReservationResponseDTO {

    private Long id;
    private Long utilisateurId;
    private String utilisateurNom;
    private String utilisateurEmail;
    private Long eventId;
    private String eventTitre;
    private LocalDateTime eventDateDebut;
    private LocalDateTime eventDateFin;
    private String eventLieu;
    private ReservationStatus statut;
    private String statusDescription;
    private String nextStepMessage;
    private Integer nombreParticipants;
    private BigDecimal basePriceTotal;
    private BigDecimal discountAmount;
    private String promoCode;
    private String discountLabel;
    private Boolean discountAutoApplied;
    private BigDecimal prixTotal;
    private Boolean estEnAttente;
    private PaymentStatus statutPaiement;
    private String remarques;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
    private LocalDateTime datePaiement;
    private String transactionId;
    private String invoiceId;
    private String invoiceNumber;
    private String invoiceHostedUrl;
    private String invoicePdfUrl;
    private BigDecimal refundAmount;
    private Integer refundPercentage;
    private BigDecimal netPaidAmount;
    private LocalDateTime cancelledAt;
    private LocalDateTime refundedAt;
    private String cancellationReason;
    private LocalDateTime waitlistOfferedAt;
    private LocalDateTime waitlistOfferExpiresAt;
    private Boolean waitlistOfferActive;
    private Boolean receiptAvailable;
    private ReservationCancellationPolicyDTO cancellationPolicy;
    private Boolean calendarExportAvailable;
    private String googleCalendarUrl;
    private String calendarIcsDownloadUrl;
    private String calendarIcsFileName;
    private Boolean attendanceRecordable;
    private Integer feedbackRating;
    private String feedbackComment;
    private LocalDateTime feedbackSubmittedAt;
    private Boolean feedbackEligible;
}
