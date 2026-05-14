package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Event.Repository.EventRepository;
import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.Reservation.Enum.PaymentStatus;
import com.esprit.campconnect.Reservation.Enum.ReservationExportFormat;
import com.esprit.campconnect.Reservation.Enum.ReservationStatus;
import com.esprit.campconnect.Reservation.Repository.ReservationRepository;
import com.esprit.campconnect.User.Entity.Utilisateur;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationExportServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private EventRepository eventRepository;

    private ReservationExportService reservationExportService;

    @BeforeEach
    void setUp() {
        reservationExportService = new ReservationExportService(reservationRepository, eventRepository);
    }

    @Test
    void generateRevenueReportCsvIncludesFeedbackMetrics() {
        Reservation reservation = buildReservation();

        when(reservationRepository.findAllWithDetails()).thenReturn(List.of(reservation));

        ReservationExportService.ExportArtifact artifact =
                reservationExportService.generateRevenueReport(ReservationExportFormat.CSV);

        String csv = new String(artifact.content(), StandardCharsets.UTF_8);

        assertThat(artifact.fileName()).isEqualTo("revenue-report.csv");
        assertThat(artifact.contentType()).isEqualTo("text/csv");
        assertThat(csv).contains("Average Rating");
        assertThat(csv).contains("Sunrise Camp");
        assertThat(csv).contains("4.0");
        assertThat(csv).contains("1");
    }

    @Test
    void generateGuestListCsvIncludesConfirmedGuestsOnly() {
        Event event = buildEvent();
        Reservation confirmedReservation = buildReservation();
        confirmedReservation.setEvent(event);
        confirmedReservation.setStatut(ReservationStatus.CONFIRMED);

        Reservation cancelledReservation = buildReservation();
        cancelledReservation.setId(33L);
        cancelledReservation.setEvent(event);
        cancelledReservation.setStatut(ReservationStatus.CANCELLED);

        when(eventRepository.findById(11L)).thenReturn(java.util.Optional.of(event));
        when(reservationRepository.findByEventIdWithDetails(11L))
                .thenReturn(List.of(confirmedReservation, cancelledReservation));

        ReservationExportService.ExportArtifact artifact =
                reservationExportService.generateGuestList(11L, ReservationExportFormat.CSV);

        String csv = new String(artifact.content(), StandardCharsets.UTF_8);

        assertThat(artifact.fileName()).startsWith("guest-list-sunrise-camp");
        assertThat(csv).contains("Guest Name");
        assertThat(csv).contains("Admin");
        assertThat(csv).doesNotContain("#33");
    }

    private Reservation buildReservation() {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setId(5L);
        utilisateur.setNom("Admin");
        utilisateur.setEmail("admin@campconnect.test");

        Event event = buildEvent();

        Reservation reservation = new Reservation();
        reservation.setId(19L);
        reservation.setUtilisateur(utilisateur);
        reservation.setEvent(event);
        reservation.setStatut(ReservationStatus.ATTENDED);
        reservation.setNombreParticipants(2);
        reservation.setPrixTotal(new BigDecimal("100.00"));
        reservation.setEstEnAttente(false);
        reservation.setStatutPaiement(PaymentStatus.PAID);
        reservation.setDateCreation(LocalDateTime.of(2026, 4, 1, 9, 0));
        reservation.setRefundAmount(BigDecimal.ZERO);
        reservation.setFeedbackRating(4);
        reservation.setFeedbackComment("Strong event operations");
        reservation.setFeedbackSubmittedAt(LocalDateTime.of(2026, 4, 2, 12, 0));
        return reservation;
    }

    private Event buildEvent() {
        Event event = new Event();
        event.setId(11L);
        event.setTitre("Sunrise Camp");
        event.setLieu("Lagoon Base");
        event.setDateDebut(LocalDateTime.of(2026, 5, 1, 10, 0));
        event.setDateFin(LocalDateTime.of(2026, 5, 1, 15, 0));
        event.setCapaciteMax(40);
        return event;
    }
}
