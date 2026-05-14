package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Reservation.DTO.UserNotificationResponseDTO;
import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.Reservation.Entity.UserNotification;
import com.esprit.campconnect.Reservation.Enum.NotificationType;
import com.esprit.campconnect.Reservation.Repository.UserNotificationRepository;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class UserNotificationService {

    private static final DateTimeFormatter NOTIFICATION_DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("EEE, MMM d, yyyy 'at' h:mm a", Locale.ENGLISH);

    private final UserNotificationRepository userNotificationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationEmailService notificationEmailService;

    public void notifyBookingConfirmed(Reservation reservation) {
        Integer guestCount = reservation.getNombreParticipants() != null ? reservation.getNombreParticipants() : 0;
        boolean alreadyPaid = reservation.getStatutPaiement() == com.esprit.campconnect.Reservation.Enum.PaymentStatus.PAID;
        createNotification(
                reservation,
                NotificationType.BOOKING_CONFIRMED,
                "Reservation confirmed",
                "Your reservation for " + reservation.getEvent().getTitre()
                        + " has been approved for " + guestCount + " guest" + (guestCount == 1 ? "." : "s.")
                        + (alreadyPaid
                        ? " Your payment is already recorded and the booking is fully secured."
                        : " Complete the payment step to fully secure your place."),
                "View reservation"
        );
    }

    public void notifyPaymentConfirmed(Reservation reservation) {
        BigDecimal paidAmount = reservation.getPrixTotal() != null
                ? reservation.getPrixTotal()
                : BigDecimal.ZERO;
        boolean waitlistHold = Boolean.TRUE.equals(reservation.getEstEnAttente());

        createNotification(
                reservation,
                NotificationType.PAYMENT_CONFIRMED,
                waitlistHold ? "Waitlist payment secured" : "Payment confirmed",
                waitlistHold
                        ? "CampConnect received your payment of $" + paidAmount.stripTrailingZeros().toPlainString()
                        + " for " + reservation.getEvent().getTitre()
                        + ". If a seat opens, the booking will move forward automatically."
                        : "CampConnect received your payment of $" + paidAmount.stripTrailingZeros().toPlainString()
                        + " for " + reservation.getEvent().getTitre()
                        + ". Your booking is now fully approved and no further payment action is required.",
                waitlistHold ? "Track waitlist" : "Open receipt"
        );
    }

    public void notifyWaitlistJoined(Reservation reservation) {
        createNotification(
                reservation,
                NotificationType.WAITLIST_JOINED,
                "Waitlist spot secured",
                "Your reservation for " + reservation.getEvent().getTitre()
                        + " is on the waitlist. CampConnect will alert you if a seat opens.",
                "Track waitlist"
        );
    }

    public void notifyWaitlistPromoted(Reservation reservation) {
        String paymentMessage = reservation.getWaitlistOfferExpiresAt() != null
                && reservation.getStatutPaiement() != com.esprit.campconnect.Reservation.Enum.PaymentStatus.PAID
                ? " Complete payment before "
                + formatEventWindow(reservation.getWaitlistOfferExpiresAt(), null)
                + " to keep the seat."
                : " Your booking is now active.";

        createNotification(
                reservation,
                NotificationType.WAITLIST_PROMOTED,
                "A seat just opened",
                "Your waitlist booking for " + reservation.getEvent().getTitre()
                        + " has been promoted automatically." + paymentMessage,
                "View booking"
        );
    }

    public void notifyWaitlistOfferExpired(Reservation reservation) {
        createNotification(
                reservation,
                NotificationType.WAITLIST_OFFER_EXPIRED,
                "Seat offer expired",
                "The temporary seat offer for " + reservation.getEvent().getTitre()
                        + " expired before payment was completed, so the spot moved to the next guest on the waitlist.",
                "Review booking"
        );
    }

    public void notifyRefundProcessed(Reservation reservation) {
        BigDecimal refundAmount = reservation.getRefundAmount() != null
                ? reservation.getRefundAmount()
                : BigDecimal.ZERO;

        createNotification(
                reservation,
                NotificationType.REFUND_PROCESSED,
                "Refund processed",
                "CampConnect processed a refund of $" + refundAmount.stripTrailingZeros().toPlainString()
                        + " for " + reservation.getEvent().getTitre() + ".",
                "Review refund"
        );
    }

    public void notifyEventPostponed(Reservation reservation, LocalDateTime previousStart, LocalDateTime previousEnd) {
        String eventTitle = reservation.getEvent().getTitre();
        String oldWindow = formatEventWindow(previousStart, previousEnd);
        String newWindow = formatEventWindow(
                reservation.getEvent().getDateDebut(),
                reservation.getEvent().getDateFin()
        );

        createNotification(
                reservation,
                NotificationType.EVENT_POSTPONED,
                "Event schedule updated",
                eventTitle + " moved from " + oldWindow + " to " + newWindow
                        + ". Your reservation is still active and ready for the new schedule.",
                "Review new schedule"
        );
    }

    public void notifyEventCancelled(Reservation reservation, String reason) {
        String eventTitle = reservation.getEvent().getTitre();
        String trimmedReason = StringUtils.hasText(reason) ? reason.trim() : "";

        createNotification(
                reservation,
                NotificationType.EVENT_CANCELLED,
                "Event cancelled",
                eventTitle + " has been cancelled."
                        + (trimmedReason.isBlank() ? "" : " Reason: " + trimmedReason + ".")
                        + " CampConnect will keep your reservation timeline updated if follow-up actions are needed.",
                "Review booking"
        );
    }

    public void notifyEventReminder(Reservation reservation, String leadTimeLabel) {
        String eventWindow = formatEventWindow(
                reservation.getEvent() != null ? reservation.getEvent().getDateDebut() : null,
                reservation.getEvent() != null ? reservation.getEvent().getDateFin() : null
        );

        createNotification(
                reservation,
                NotificationType.EVENT_REMINDER,
                "Event reminder",
                reservation.getEvent().getTitre()
                        + " starts in " + leadTimeLabel + ". It is scheduled for " + eventWindow
                        + " at " + safeValue(reservation.getEvent().getLieu()) + ".",
                "Open reservation"
        );
    }

    public void notifyFeedbackRequested(Reservation reservation) {
        createNotification(
                reservation,
                NotificationType.FEEDBACK_REQUESTED,
                "Share your event feedback",
                "Thanks for attending " + reservation.getEvent().getTitre()
                        + ". Leave a quick rating and comment to help improve future CampConnect events.",
                "Leave feedback"
        );
    }

    @Transactional(readOnly = true)
    public List<UserNotificationResponseDTO> getNotificationsForUser(String requesterEmail) {
        Utilisateur utilisateur = getUserByEmailOrThrow(requesterEmail);
        return userNotificationRepository.findByUtilisateurIdOrderByCreatedAtDesc(utilisateur.getId()).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCountForUser(String requesterEmail) {
        Utilisateur utilisateur = getUserByEmailOrThrow(requesterEmail);
        return userNotificationRepository.countByUtilisateurIdAndReadFalse(utilisateur.getId());
    }

    public UserNotificationResponseDTO markAsRead(Long notificationId, String requesterEmail) {
        Utilisateur utilisateur = getUserByEmailOrThrow(requesterEmail);
        UserNotification notification = userNotificationRepository.findByIdAndUtilisateurId(notificationId, utilisateur.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!Boolean.TRUE.equals(notification.getRead())) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
        }

        return mapToResponseDTO(userNotificationRepository.save(notification));
    }

    public void markAllAsRead(String requesterEmail) {
        Utilisateur utilisateur = getUserByEmailOrThrow(requesterEmail);
        List<UserNotification> notifications = userNotificationRepository.findByUtilisateurIdOrderByCreatedAtDesc(utilisateur.getId());
        LocalDateTime now = LocalDateTime.now();

        notifications.stream()
                .filter(notification -> !Boolean.TRUE.equals(notification.getRead()))
                .forEach(notification -> {
                    notification.setRead(true);
                    notification.setReadAt(now);
                });

        userNotificationRepository.saveAll(notifications);
    }

    private void createNotification(
            Reservation reservation,
            NotificationType type,
            String title,
            String message,
            String actionLabel
    ) {
        if (reservation == null || reservation.getUtilisateur() == null || reservation.getEvent() == null) {
            return;
        }

        UserNotification notification = new UserNotification();
        notification.setUtilisateur(reservation.getUtilisateur());
        notification.setReservation(reservation);
        notification.setEvent(reservation.getEvent());
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setActionLabel(actionLabel);
        notification.setActionUrl("/public/events/my-reservations?focusReservation=" + reservation.getId());
        UserNotification savedNotification = userNotificationRepository.save(notification);
        notificationEmailService.sendNotificationEmail(savedNotification);
    }

    private String formatEventWindow(LocalDateTime start, LocalDateTime end) {
        if (start == null && end == null) {
            return "the updated schedule";
        }

        if (start != null && end != null && start.toLocalDate().equals(end.toLocalDate())) {
            return start.format(NOTIFICATION_DATE_TIME_FORMATTER)
                    + " until "
                    + end.format(DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH));
        }

        if (start != null && end != null) {
            return start.format(NOTIFICATION_DATE_TIME_FORMATTER)
                    + " until "
                    + end.format(NOTIFICATION_DATE_TIME_FORMATTER);
        }

        return (start != null ? start : end).format(NOTIFICATION_DATE_TIME_FORMATTER);
    }

    private String safeValue(String value) {
        return StringUtils.hasText(value) ? value.trim() : "the event venue";
    }

    private UserNotificationResponseDTO mapToResponseDTO(UserNotification notification) {
        return new UserNotificationResponseDTO(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getRead(),
                notification.getCreatedAt(),
                notification.getReadAt(),
                notification.getReservation() != null ? notification.getReservation().getId() : null,
                notification.getEvent() != null ? notification.getEvent().getId() : null,
                notification.getActionLabel(),
                notification.getActionUrl()
        );
    }

    private Utilisateur getUserByEmailOrThrow(String email) {
        if (!StringUtils.hasText(email)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is missing");
        }

        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));
    }
}
