package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.Reservation.Enum.ReservationStatus;
import com.esprit.campconnect.config.GoogleMapsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ReservationCalendarService {

    private static final String GOOGLE_CALENDAR_TEMPLATE_URL = "https://calendar.google.com/calendar/render";
    private static final String FALLBACK_DOWNLOAD_PATH_TEMPLATE = "/api/reservations/%d/calendar.ics";
    private static final DateTimeFormatter GOOGLE_DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");
    private static final DateTimeFormatter ICS_UTC_FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");
    private static final ZoneId DEFAULT_ZONE_ID = ZoneId.of("Africa/Lagos");

    private final GoogleMapsService googleMapsService;

    public boolean isCalendarExportAvailable(Reservation reservation) {
        if (reservation == null || reservation.getEvent() == null || reservation.getEvent().getDateDebut() == null) {
            return false;
        }

        ReservationStatus status = reservation.getStatut();
        return status != ReservationStatus.CANCELLED
                && status != ReservationStatus.REFUNDED
                && status != ReservationStatus.NO_SHOW;
    }

    public String buildGoogleCalendarUrl(Reservation reservation) {
        if (!isCalendarExportAvailable(reservation)) {
            return null;
        }

        Event event = reservation.getEvent();
        ZoneId zoneId = DEFAULT_ZONE_ID;
        ZonedDateTime startDateTime = resolveStartDateTime(event, zoneId);
        ZonedDateTime endDateTime = resolveEndDateTime(event, zoneId, startDateTime);

        return UriComponentsBuilder.fromHttpUrl(GOOGLE_CALENDAR_TEMPLATE_URL)
                .queryParam("action", "TEMPLATE")
                .queryParam("text", buildCalendarTitle(event, reservation))
                .queryParam("dates", GOOGLE_DATE_TIME_FORMATTER.format(startDateTime) + "/" + GOOGLE_DATE_TIME_FORMATTER.format(endDateTime))
                .queryParam("ctz", zoneId.getId())
                .queryParam("location", safeText(event.getLieu()))
                .queryParam("details", buildCalendarDescription(reservation))
                .build()
                .encode()
                .toUriString();
    }

    public byte[] generateIcsInvite(Reservation reservation) {
        Event event = reservation.getEvent();
        ZoneId zoneId = DEFAULT_ZONE_ID;
        ZonedDateTime startDateTime = resolveStartDateTime(event, zoneId);
        ZonedDateTime endDateTime = resolveEndDateTime(event, zoneId, startDateTime);
        ZonedDateTime startUtc = startDateTime.withZoneSameInstant(ZoneOffset.UTC);
        ZonedDateTime endUtc = endDateTime.withZoneSameInstant(ZoneOffset.UTC);
        String organizerEmail = event.getOrganizer() != null ? safeText(event.getOrganizer().getEmail()) : "";
        String organizerName = event.getOrganizer() != null ? safeText(event.getOrganizer().getNom()) : "";

        List<String> lines = new ArrayList<>();
        lines.add("BEGIN:VCALENDAR");
        lines.add("PRODID:-//CampConnect//Reservation Calendar//EN");
        lines.add("VERSION:2.0");
        lines.add("CALSCALE:GREGORIAN");
        lines.add("METHOD:PUBLISH");
        lines.add("BEGIN:VEVENT");
        lines.add("UID:" + buildUid(reservation));
        lines.add("DTSTAMP:" + ICS_UTC_FORMATTER.format(Instant.now().atZone(ZoneOffset.UTC)));
        lines.add("DTSTART:" + ICS_UTC_FORMATTER.format(startUtc));
        lines.add("DTEND:" + ICS_UTC_FORMATTER.format(endUtc));
        lines.add("SUMMARY:" + escapeIcsText(buildCalendarTitle(event, reservation)));
        lines.add("DESCRIPTION:" + escapeIcsText(buildCalendarDescription(reservation)));
        lines.add("LOCATION:" + escapeIcsText(safeText(event.getLieu())));
        lines.add("STATUS:" + buildIcsStatus(reservation));
        lines.add("TRANSP:OPAQUE");

        String mapUrl = safeText(googleMapsService.buildGoogleMapsUrl(event));
        if (!mapUrl.isBlank()) {
            lines.add("URL:" + escapeIcsText(mapUrl));
        }

        if (!organizerEmail.isBlank()) {
            lines.add("ORGANIZER;CN=" + escapeIcsText(organizerName.isBlank() ? "CampConnect" : organizerName)
                    + ":MAILTO:" + organizerEmail);
        }

        lines.add("BEGIN:VALARM");
        lines.add("ACTION:DISPLAY");
        lines.add("DESCRIPTION:" + escapeIcsText("Reminder: " + buildCalendarTitle(event, reservation)));
        lines.add("TRIGGER:-PT24H");
        lines.add("END:VALARM");
        lines.add("END:VEVENT");
        lines.add("END:VCALENDAR");

        StringBuilder builder = new StringBuilder();
        for (String line : lines) {
            builder.append(foldIcsLine(line)).append("\r\n");
        }

        return builder.toString().getBytes(StandardCharsets.UTF_8);
    }

    public String buildIcsDownloadUrl(Long reservationId) {
        if (reservationId == null) {
            return null;
        }

        try {
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/reservations/{id}/calendar.ics")
                    .buildAndExpand(reservationId)
                    .toUriString();
        } catch (IllegalStateException exception) {
            return FALLBACK_DOWNLOAD_PATH_TEMPLATE.formatted(reservationId);
        }
    }

    public String buildSuggestedFilename(Reservation reservation) {
        if (reservation == null || reservation.getId() == null) {
            return "campconnect-reservation.ics";
        }

        String eventSlug = reservation.getEvent() != null ? toSlug(reservation.getEvent().getTitre()) : "event";
        return "reservation-" + reservation.getId() + "-" + eventSlug + ".ics";
    }

    private ZonedDateTime resolveStartDateTime(Event event, ZoneId zoneId) {
        return event.getDateDebut().atZone(zoneId);
    }

    private ZonedDateTime resolveEndDateTime(Event event, ZoneId zoneId, ZonedDateTime startDateTime) {
        LocalDateTime eventEnd = event.getDateFin();
        if (eventEnd != null && eventEnd.isAfter(event.getDateDebut())) {
            return eventEnd.atZone(zoneId);
        }

        if (event.getDureeMinutes() != null && event.getDureeMinutes() > 0) {
            return startDateTime.plusMinutes(event.getDureeMinutes());
        }

        return startDateTime.plusHours(2);
    }

    private String buildCalendarTitle(Event event, Reservation reservation) {
        String title = safeText(event.getTitre());
        if (Boolean.TRUE.equals(reservation.getEstEnAttente())) {
            return title + " (Waitlist)";
        }
        return title;
    }

    private String buildCalendarDescription(Reservation reservation) {
        Event event = reservation.getEvent();
        List<String> lines = new ArrayList<>();
        lines.add("Booked with CampConnect");
        lines.add("Reservation #" + reservation.getId());
        lines.add("Reservation status: " + formatLabel(reservation.getStatut() != null ? reservation.getStatut().name() : "PENDING"));
        lines.add("Participants: " + (reservation.getNombreParticipants() != null ? reservation.getNombreParticipants() : 1));

        if (event.getOrganizer() != null) {
            String organizerLine = safeText(event.getOrganizer().getNom());
            if (!safeText(event.getOrganizer().getEmail()).isBlank()) {
                organizerLine = organizerLine.isBlank()
                        ? event.getOrganizer().getEmail()
                        : organizerLine + " <" + event.getOrganizer().getEmail() + ">";
            }
            if (!organizerLine.isBlank()) {
                lines.add("Organizer: " + organizerLine);
            }
        }

        String mapUrl = safeText(googleMapsService.buildGoogleMapsUrl(event));
        if (!mapUrl.isBlank()) {
            lines.add("Maps: " + mapUrl);
        }

        String remarks = safeText(reservation.getRemarques());
        if (!remarks.isBlank()) {
            lines.add("Booking notes: " + remarks);
        }

        String description = safeText(event.getDescription());
        if (!description.isBlank()) {
            lines.add("");
            lines.add("Event details:");
            lines.add(trimToLength(description, 900));
        }

        return String.join("\n", lines);
    }

    private String buildUid(Reservation reservation) {
        return "reservation-" + reservation.getId() + "@campconnect.local";
    }

    private String buildIcsStatus(Reservation reservation) {
        if (Boolean.TRUE.equals(reservation.getEstEnAttente()) || reservation.getStatut() == ReservationStatus.PENDING) {
            return "TENTATIVE";
        }
        return "CONFIRMED";
    }

    private String escapeIcsText(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
                .replace("\r\n", "\\n")
                .replace("\n", "\\n")
                .replace("\r", "\\n");
    }

    private String foldIcsLine(String value) {
        final int maxLineLength = 73;
        if (value.length() <= maxLineLength) {
            return value;
        }

        StringBuilder builder = new StringBuilder();
        int index = 0;
        while (index < value.length()) {
            int nextIndex = Math.min(index + maxLineLength, value.length());
            if (index == 0) {
                builder.append(value, index, nextIndex);
            } else {
                builder.append("\r\n ").append(value, index, nextIndex);
            }
            index = nextIndex;
        }

        return builder.toString();
    }

    private String toSlug(String value) {
        String normalized = safeText(value).toLowerCase(Locale.ENGLISH)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized.isBlank() ? "event" : normalized;
    }

    private String formatLabel(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return "";
        }

        String[] segments = rawValue.toLowerCase(Locale.ENGLISH).split("_");
        List<String> words = new ArrayList<>();
        for (String segment : segments) {
            if (!segment.isBlank()) {
                words.add(Character.toUpperCase(segment.charAt(0)) + segment.substring(1));
            }
        }
        return String.join(" ", words);
    }

    private String trimToLength(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return safeText(value);
        }

        return value.substring(0, maxLength - 3).trim() + "...";
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }
}
