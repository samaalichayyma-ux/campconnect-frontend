package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.Reservation.Entity.UserNotification;
import com.esprit.campconnect.Reservation.Enum.NotificationType;
import com.esprit.campconnect.Reservation.Enum.PaymentStatus;
import com.esprit.campconnect.Reservation.Enum.ReservationStatus;
import com.esprit.campconnect.Reservation.Repository.UserNotificationRepository;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserNotificationServiceTest {

    @Mock
    private UserNotificationRepository userNotificationRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private NotificationEmailService notificationEmailService;

    private UserNotificationService userNotificationService;

    @BeforeEach
    void setUp() {
        userNotificationService = new UserNotificationService(
                userNotificationRepository,
                utilisateurRepository,
                notificationEmailService
        );
    }

    @Test
    void notifyBookingConfirmedPersistsNotificationAndDispatchesEmail() {
        Reservation reservation = buildReservation();
        when(userNotificationRepository.save(any(UserNotification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        userNotificationService.notifyBookingConfirmed(reservation);

        ArgumentCaptor<UserNotification> notificationCaptor = ArgumentCaptor.forClass(UserNotification.class);
        verify(userNotificationRepository).save(notificationCaptor.capture());
        verify(notificationEmailService).sendNotificationEmail(notificationCaptor.getValue());

        UserNotification savedNotification = notificationCaptor.getValue();
        assertThat(savedNotification.getType()).isEqualTo(NotificationType.BOOKING_CONFIRMED);
        assertThat(savedNotification.getTitle()).isEqualTo("Reservation confirmed");
        assertThat(savedNotification.getMessage()).contains("approved");
        assertThat(savedNotification.getMessage()).contains("Complete the payment step");
    }

    @Test
    void notifyPaymentConfirmedExplainsThatPaymentFinalizesTheBooking() {
        Reservation reservation = buildReservation();
        reservation.setStatutPaiement(PaymentStatus.PAID);
        when(userNotificationRepository.save(any(UserNotification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        userNotificationService.notifyPaymentConfirmed(reservation);

        ArgumentCaptor<UserNotification> notificationCaptor = ArgumentCaptor.forClass(UserNotification.class);
        verify(userNotificationRepository).save(notificationCaptor.capture());

        UserNotification savedNotification = notificationCaptor.getValue();
        assertThat(savedNotification.getType()).isEqualTo(NotificationType.PAYMENT_CONFIRMED);
        assertThat(savedNotification.getTitle()).isEqualTo("Payment confirmed");
        assertThat(savedNotification.getMessage()).contains("fully approved");
        assertThat(savedNotification.getMessage()).contains("no further payment action");
    }

    @Test
    void notifyEventPostponedBuildsProfessionalScheduleMessage() {
        Reservation reservation = buildReservation();
        reservation.getEvent().setDateDebut(LocalDateTime.of(2026, 7, 11, 10, 0));
        reservation.getEvent().setDateFin(LocalDateTime.of(2026, 7, 11, 14, 0));
        when(userNotificationRepository.save(any(UserNotification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        userNotificationService.notifyEventPostponed(
                reservation,
                LocalDateTime.of(2026, 7, 10, 10, 0),
                LocalDateTime.of(2026, 7, 10, 14, 0)
        );

        ArgumentCaptor<UserNotification> notificationCaptor = ArgumentCaptor.forClass(UserNotification.class);
        verify(userNotificationRepository).save(notificationCaptor.capture());

        UserNotification savedNotification = notificationCaptor.getValue();
        assertThat(savedNotification.getType()).isEqualTo(NotificationType.EVENT_POSTPONED);
        assertThat(savedNotification.getTitle()).isEqualTo("Event schedule updated");
        assertThat(savedNotification.getMessage()).contains("moved from");
        assertThat(savedNotification.getMessage()).contains("Your reservation is still active");
    }

    private Reservation buildReservation() {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setId(34L);
        utilisateur.setNom("Iheb");
        utilisateur.setEmail("ihebboughanmi17@gmail.com");

        Event event = new Event();
        event.setId(19L);
        event.setTitre("Sunrise Camp");
        event.setLieu("Sahara Gate");
        event.setDateDebut(LocalDateTime.of(2026, 7, 10, 10, 0));
        event.setDateFin(LocalDateTime.of(2026, 7, 10, 14, 0));

        Reservation reservation = new Reservation();
        reservation.setId(88L);
        reservation.setUtilisateur(utilisateur);
        reservation.setEvent(event);
        reservation.setNombreParticipants(2);
        reservation.setPrixTotal(new BigDecimal("120.00"));
        reservation.setStatut(ReservationStatus.CONFIRMED);
        reservation.setStatutPaiement(PaymentStatus.UNPAID);
        return reservation;
    }
}
