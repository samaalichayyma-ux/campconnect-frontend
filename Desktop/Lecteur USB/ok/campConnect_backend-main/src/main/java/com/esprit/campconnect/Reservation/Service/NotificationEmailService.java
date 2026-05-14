package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.Reservation.Entity.UserNotification;
import com.esprit.campconnect.Reservation.Enum.NotificationType;
import com.esprit.campconnect.Reservation.Enum.ReservationStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationEmailService {

    private static final DateTimeFormatter EMAIL_DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy 'at' h:mm a", Locale.ENGLISH);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.notifications.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${app.notifications.email.brevo.base-url:https://api.brevo.com/v3}")
    private String brevoBaseUrl;

    @Value("${app.notifications.email.brevo.api-key:}")
    private String brevoApiKey;

    @Value("${app.notifications.email.sender-email:}")
    private String senderEmail;

    @Value("${app.notifications.email.sender-name:CampConnect}")
    private String senderName;

    @Value("${app.notifications.email.sandbox-mode:false}")
    private boolean sandboxMode;

    @Value("${app.notifications.email.frontend-base-url:http://localhost:4200}")
    private String frontendBaseUrl;

    public void sendNotificationEmail(UserNotification notification) {
        if (!emailEnabled || notification == null || notification.getUtilisateur() == null) {
            return;
        }

        String recipientEmail = notification.getUtilisateur().getEmail();
        if (!isConfigured() || !StringUtils.hasText(recipientEmail)) {
            return;
        }

        try {
            BrevoEmailRequest request = buildRequest(notification);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(trimTrailingSlash(brevoBaseUrl) + "/smtp/email"))
                    .timeout(Duration.ofSeconds(20))
                    .header("accept", "application/json")
                    .header("content-type", "application/json")
                    .header("api-key", brevoApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(request)))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn(
                        "Brevo email send failed for notification {} and recipient {} with status {}: {}",
                        notification.getId(),
                        recipientEmail,
                        response.statusCode(),
                        response.body()
                );
                return;
            }

            BrevoEmailResponse emailResponse = objectMapper.readValue(response.body(), BrevoEmailResponse.class);
            log.info(
                    "Sent {} notification email to {} with Brevo messageId {}",
                    notification.getType(),
                    recipientEmail,
                    emailResponse.messageId()
            );
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn(
                    "Could not send {} notification email to {}: {}",
                    notification.getType(),
                    recipientEmail,
                    ex.getMessage()
            );
        }
    }

    private boolean isConfigured() {
        return StringUtils.hasText(brevoApiKey) && StringUtils.hasText(senderEmail);
    }

    private BrevoEmailRequest buildRequest(UserNotification notification) {
        String recipientName = StringUtils.hasText(notification.getUtilisateur().getNom())
                ? notification.getUtilisateur().getNom()
                : "CampConnect guest";

        Map<String, String> headers = new LinkedHashMap<>();
        if (sandboxMode) {
            headers.put("X-Sib-Sandbox", "drop");
        }

        return new BrevoEmailRequest(
                new EmailParty(senderEmail, senderName),
                List.of(new EmailParty(notification.getUtilisateur().getEmail(), recipientName)),
                "[CampConnect] " + notification.getTitle(),
                buildHtmlContent(notification, recipientName),
                buildTextContent(notification, recipientName),
                List.of("campconnect-notification", notification.getType().name().toLowerCase(Locale.ROOT)),
                headers.isEmpty() ? null : headers
        );
    }

    private String buildHtmlContent(UserNotification notification, String recipientName) {
        Reservation reservation = notification.getReservation();
        Event event = notification.getEvent();
        String kicker = escape(resolveEmailKicker(notification.getType()));
        String title = escape(notification.getTitle());
        String message = escape(notification.getMessage());
        String actionUrl = buildActionUrl(notification.getActionUrl());
        String actionLabel = escape(StringUtils.hasText(notification.getActionLabel())
                ? notification.getActionLabel()
                : "Open CampConnect");

        String eventTitle = event != null ? escape(event.getTitre()) : "CampConnect update";
        String eventSchedule = event != null ? escape(formatEventSchedule(event.getDateDebut(), event.getDateFin())) : "Schedule pending";
        String eventLocation = event != null ? escape(safeText(event.getLieu())) : "CampConnect";
        String reservationSummary = reservation != null
                ? escape(buildReservationSummary(reservation))
                : "Your event timeline has a new update.";
        String reservationMeta = reservation != null
                ? escape(buildReservationMeta(reservation))
                : "Open CampConnect for the latest reservation details.";

        return """
                <!DOCTYPE html>
                <html lang="en">
                  <body style="margin:0;padding:0;background:#f3efe7;font-family:Arial,sans-serif;color:#17352a;">
                    <div style="max-width:680px;margin:0 auto;padding:32px 18px;">
                      <div style="background:#ffffff;border:1px solid #e7dfd0;border-radius:24px;overflow:hidden;">
                        <div style="background:#17352a;padding:28px 30px;color:#ffffff;">
                          <p style="margin:0 0 10px;font-size:12px;letter-spacing:1.8px;text-transform:uppercase;opacity:0.78;">CampConnect</p>
                          <p style="margin:0 0 8px;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#cfdccf;">%s</p>
                          <h1 style="margin:0;font-size:28px;line-height:1.25;">%s</h1>
                        </div>
                        <div style="padding:28px 30px 30px;">
                          <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Hello %s,</p>
                          <p style="margin:0 0 24px;font-size:16px;line-height:1.75;color:#355146;">%s</p>
                          <div style="border:1px solid #e7dfd0;border-radius:20px;padding:20px 22px;background:#fcfaf6;margin:0 0 18px;">
                            <p style="margin:0 0 10px;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#7a6540;">Event details</p>
                            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#17352a;">%s</p>
                            <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#4d6358;">%s</p>
                            <p style="margin:0;font-size:14px;line-height:1.6;color:#4d6358;">%s</p>
                          </div>
                          <div style="border:1px solid #efe5d7;border-radius:20px;padding:18px 22px;background:#f8f3eb;margin:0 0 24px;">
                            <p style="margin:0 0 8px;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#7a6540;">Reservation</p>
                            <p style="margin:0 0 6px;font-size:15px;line-height:1.7;color:#355146;">%s</p>
                            <p style="margin:0;font-size:14px;line-height:1.7;color:#5d7368;">%s</p>
                          </div>
                          <a href="%s" style="display:inline-block;background:#1f5c3f;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">%s</a>
                          <p style="margin:20px 0 0;font-size:13px;line-height:1.7;color:#71806f;">
                            Keep this email for your records. You can review the same reservation from CampConnect at any time.
                          </p>
                        </div>
                      </div>
                    </div>
                  </body>
                </html>
                """.formatted(kicker, title, escape(recipientName), message, eventTitle, eventSchedule, eventLocation, reservationSummary, reservationMeta, escape(actionUrl), actionLabel);
    }

    private String buildTextContent(UserNotification notification, String recipientName) {
        StringBuilder builder = new StringBuilder();
        builder.append("CampConnect").append(System.lineSeparator()).append(System.lineSeparator());
        builder.append(resolveEmailKicker(notification.getType())).append(System.lineSeparator());
        builder.append(notification.getTitle()).append(System.lineSeparator()).append(System.lineSeparator());
        builder.append("Hello ").append(recipientName).append(",").append(System.lineSeparator()).append(System.lineSeparator());
        builder.append(notification.getMessage()).append(System.lineSeparator()).append(System.lineSeparator());

        Event event = notification.getEvent();
        if (event != null) {
            builder.append("Event: ").append(safeText(event.getTitre())).append(System.lineSeparator());
            builder.append("Schedule: ").append(formatEventSchedule(event.getDateDebut(), event.getDateFin())).append(System.lineSeparator());
            builder.append("Location: ").append(safeText(event.getLieu())).append(System.lineSeparator()).append(System.lineSeparator());
        }

        Reservation reservation = notification.getReservation();
        if (reservation != null) {
            builder.append(buildReservationSummary(reservation)).append(System.lineSeparator());
            builder.append(buildReservationMeta(reservation)).append(System.lineSeparator()).append(System.lineSeparator());
        }

        builder.append("Open in CampConnect: ").append(buildActionUrl(notification.getActionUrl()));
        return builder.toString();
    }

    private String buildReservationSummary(Reservation reservation) {
        Integer participants = reservation.getNombreParticipants() != null ? reservation.getNombreParticipants() : 0;
        return "Reservation #" + reservation.getId()
                + " for " + participants + " guest" + (participants == 1 ? "" : "s")
                + ". Status: " + formatReservationStatus(reservation) + ".";
    }

    private String buildReservationMeta(Reservation reservation) {
        String paymentStatus = formatEnumLabel(
                reservation.getStatutPaiement() != null ? reservation.getStatutPaiement().name() : "UNKNOWN"
        );
        String total = reservation.getPrixTotal() != null ? formatMoney(reservation.getPrixTotal()) : "-";
        return "Payment: " + paymentStatus + " | Total: " + total;
    }

    private String formatEventSchedule(LocalDateTime start, LocalDateTime end) {
        if (start == null && end == null) {
            return "Schedule pending";
        }

        if (start != null && end != null && start.toLocalDate().equals(end.toLocalDate())) {
            return start.format(EMAIL_DATE_TIME_FORMATTER)
                    + " until "
                    + end.format(DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH));
        }

        if (start != null && end != null) {
            return start.format(EMAIL_DATE_TIME_FORMATTER)
                    + " until "
                    + end.format(EMAIL_DATE_TIME_FORMATTER);
        }

        return (start != null ? start : end).format(EMAIL_DATE_TIME_FORMATTER);
    }

    private String buildActionUrl(String actionUrl) {
        if (!StringUtils.hasText(actionUrl)) {
            return trimTrailingSlash(frontendBaseUrl) + "/public/events/my-reservations";
        }

        if (actionUrl.startsWith("http://") || actionUrl.startsWith("https://")) {
            return actionUrl;
        }

        if (actionUrl.startsWith("/")) {
            return trimTrailingSlash(frontendBaseUrl) + actionUrl;
        }

        return trimTrailingSlash(frontendBaseUrl) + "/" + actionUrl;
    }

    private String resolveEmailKicker(NotificationType notificationType) {
        if (notificationType == null) {
            return "Reservation update";
        }

        return switch (notificationType) {
            case BOOKING_CONFIRMED -> "Reservation approved";
            case PAYMENT_CONFIRMED -> "Final payment confirmation";
            case WAITLIST_JOINED, WAITLIST_PROMOTED, WAITLIST_OFFER_EXPIRED -> "Waitlist update";
            case EVENT_REMINDER -> "Upcoming event reminder";
            case EVENT_POSTPONED, EVENT_CANCELLED -> "Event schedule update";
            case REFUND_PROCESSED -> "Billing update";
            case FEEDBACK_REQUESTED -> "Post-event follow-up";
            default -> "Reservation update";
        };
    }

    private String formatReservationStatus(Reservation reservation) {
        if (reservation == null || reservation.getStatut() == null) {
            return "Pending";
        }

        ReservationStatus status = reservation.getStatut();
        if (status == ReservationStatus.PAID) {
            return "Confirmed";
        }

        return formatEnumLabel(status.name());
    }

    private String formatEnumLabel(String rawValue) {
        if (!StringUtils.hasText(rawValue)) {
            return "-";
        }

        return java.util.Arrays.stream(rawValue.toLowerCase(Locale.ENGLISH).split("_"))
                .map(segment -> segment.isEmpty() ? segment : Character.toUpperCase(segment.charAt(0)) + segment.substring(1))
                .reduce((left, right) -> left + " " + right)
                .orElse(rawValue);
    }

    private String trimTrailingSlash(String value) {
        if (!StringUtils.hasText(value)) {
            return "http://localhost:4200";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String formatMoney(BigDecimal amount) {
        return "$" + amount.stripTrailingZeros().toPlainString();
    }

    private String safeText(String value) {
        return StringUtils.hasText(value) ? value.trim() : "-";
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(safeText(value));
    }

    private record EmailParty(String email, String name) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record BrevoEmailRequest(
            EmailParty sender,
            List<EmailParty> to,
            String subject,
            String htmlContent,
            String textContent,
            List<String> tags,
            Map<String, String> headers
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record BrevoEmailResponse(String messageId, List<String> messageIds) {
    }
}
