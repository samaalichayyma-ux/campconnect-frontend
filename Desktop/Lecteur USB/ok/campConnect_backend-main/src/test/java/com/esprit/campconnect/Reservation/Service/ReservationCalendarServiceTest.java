package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.Reservation.Enum.ReservationStatus;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.config.GoogleMapsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationCalendarServiceTest {

    @Mock
    private GoogleMapsService googleMapsService;

    private ReservationCalendarService reservationCalendarService;

    @BeforeEach
    void setUp() {
        reservationCalendarService = new ReservationCalendarService(googleMapsService);
    }

    @Test
    void buildGoogleCalendarUrlIncludesExpectedFields() {
        Reservation reservation = buildReservation();
        when(googleMapsService.buildGoogleMapsUrl(reservation.getEvent()))
                .thenReturn("https://www.google.com/maps/search/?api=1&query=Laguna%20Beach,%20California");

        String calendarUrl = reservationCalendarService.buildGoogleCalendarUrl(reservation);

        assertThat(calendarUrl)
                .contains("https://calendar.google.com/calendar/render")
                .contains("action=TEMPLATE")
                .contains("Beach%20Volleyball%20Tournament")
                .contains("dates=20260625T100000/20260625T180000")
                .contains("ctz=Africa/Lagos")
                .contains("location=Laguna%20Beach,%20California")
                .contains("Reservation%20%2326")
                .contains("Participants:%201");
    }

    @Test
    void generateIcsInviteIncludesEventAndReminderDetails() {
        Reservation reservation = buildReservation();
        when(googleMapsService.buildGoogleMapsUrl(reservation.getEvent()))
                .thenReturn("https://www.google.com/maps/search/?api=1&query=Laguna%20Beach,%20California");

        String icsPayload = new String(
                reservationCalendarService.generateIcsInvite(reservation),
                StandardCharsets.UTF_8
        );
        String unfoldedIcsPayload = icsPayload.replace("\r\n ", "");

        assertThat(unfoldedIcsPayload)
                .contains("BEGIN:VCALENDAR")
                .contains("BEGIN:VEVENT")
                .contains("UID:reservation-26@campconnect.local")
                .contains("DTSTART:20260625T090000Z")
                .contains("DTEND:20260625T170000Z")
                .contains("SUMMARY:Beach Volleyball Tournament")
                .contains("LOCATION:Laguna Beach\\, California")
                .contains("STATUS:CONFIRMED")
                .contains("ORGANIZER;CN=Cultural Expert - Luis:MAILTO:luis.culture@campconnect.com")
                .contains("BEGIN:VALARM")
                .contains("TRIGGER:-PT24H")
                .contains("URL:https://www.google.com/maps/search/?api=1&query=Laguna%20Beach\\,%20California");
    }

    @Test
    void isCalendarExportAvailableReturnsFalseForCancelledReservation() {
        Reservation reservation = buildReservation();
        reservation.setStatut(ReservationStatus.CANCELLED);

        assertThat(reservationCalendarService.isCalendarExportAvailable(reservation)).isFalse();
    }

    private Reservation buildReservation() {
        Utilisateur organizer = new Utilisateur();
        organizer.setNom("Cultural Expert - Luis");
        organizer.setEmail("luis.culture@campconnect.com");

        Event event = new Event();
        event.setTitre("Beach Volleyball Tournament");
        event.setDescription("2v2 beach volleyball with coaching and team activities throughout the day.");
        event.setLieu("Laguna Beach, California");
        event.setDateDebut(LocalDateTime.of(2026, 6, 25, 10, 0));
        event.setDateFin(LocalDateTime.of(2026, 6, 25, 18, 0));
        event.setDureeMinutes(480);
        event.setOrganizer(organizer);

        Reservation reservation = new Reservation();
        reservation.setId(26L);
        reservation.setEvent(event);
        reservation.setStatut(ReservationStatus.PAID);
        reservation.setNombreParticipants(1);
        reservation.setPrixTotal(BigDecimal.valueOf(180));
        reservation.setEstEnAttente(false);
        reservation.setRemarques("Bring sunscreen");

        return reservation;
    }
}
