package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Event.Enum.EventStatus;
import com.esprit.campconnect.Event.Repository.EventRepository;
import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.Reservation.Enum.PaymentStatus;
import com.esprit.campconnect.Reservation.Enum.ReservationStatus;
import com.esprit.campconnect.Reservation.Repository.ReservationRepository;
import com.esprit.campconnect.User.Entity.Role;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.HashSet;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.eq;

@ExtendWith(MockitoExtension.class)
class ReservationServiceImplTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private StripeGatewayService stripeGatewayService;

    @Mock
    private ReservationReceiptPdfService reservationReceiptPdfService;

    @Mock
    private ReservationCalendarService reservationCalendarService;

    @Mock
    private PromotionOfferService promotionOfferService;

    @Mock
    private UserNotificationService userNotificationService;

    private ReservationServiceImpl reservationService;

    @BeforeEach
    void setUp() {
        reservationService = new ReservationServiceImpl(
                reservationRepository,
                eventRepository,
                utilisateurRepository,
                stripeGatewayService,
                reservationReceiptPdfService,
                reservationCalendarService,
                promotionOfferService,
                userNotificationService
        );
    }

    @Test
    void getAllReservationsDoesNotHydrateStripeInvoicesForListResponses() {
        Reservation reservation = buildReservation();

        when(reservationRepository.findAllWithDetails()).thenReturn(List.of(reservation));
        when(reservationCalendarService.isCalendarExportAvailable(any(Reservation.class))).thenReturn(false);

        List<com.esprit.campconnect.Reservation.DTO.ReservationResponseDTO> reservations =
                reservationService.getAllReservations();

        assertThat(reservations).hasSize(1);
        assertThat(reservations.get(0).getInvoiceId()).isEqualTo("inv_123");
        verify(reservationRepository).findAllWithDetails();
        verify(stripeGatewayService, never()).retrieveInvoice(anyString());
    }

    @Test
    void getReservationsForAuthenticatedUserKeepsCompletedReservationsConfirmedUntilAdminRecordsAttendance() {
        Reservation reservation = buildReservation();
        reservation.setStatut(ReservationStatus.CONFIRMED);
        reservation.setStatutPaiement(PaymentStatus.UNPAID);
        reservation.setDatePaiement(null);
        reservation.getEvent().setDateDebut(LocalDateTime.now().minusDays(2));
        reservation.getEvent().setDateFin(LocalDateTime.now().minusDays(2).plusHours(5));

        when(utilisateurRepository.findByEmail("admin@campconnect.test"))
                .thenReturn(Optional.of(reservation.getUtilisateur()));
        when(reservationRepository.findByUtilisateurIdWithDetails(5L)).thenReturn(List.of(reservation));
        when(reservationCalendarService.isCalendarExportAvailable(any(Reservation.class))).thenReturn(false);

        List<com.esprit.campconnect.Reservation.DTO.ReservationResponseDTO> reservations =
                reservationService.getReservationsForAuthenticatedUser("admin@campconnect.test");

        assertThat(reservations).hasSize(1);
        assertThat(reservations.get(0).getStatut()).isEqualTo(ReservationStatus.CONFIRMED);
        assertThat(reservations.get(0).getAttendanceRecordable()).isTrue();
        assertThat(reservations.get(0).getStatusDescription()).isEqualTo("Reservation confirmed");
        assertThat(reservations.get(0).getNextStepMessage()).contains("Complete payment");
        verify(reservationRepository, never()).saveAll(any(List.class));
    }

    @Test
    void markAsAttendedRequiresEventToHaveStarted() {
        Reservation reservation = buildReservation();
        reservation.setStatut(ReservationStatus.CONFIRMED);
        reservation.getEvent().setDateDebut(LocalDateTime.now().plusHours(2));

        when(reservationRepository.findById(19L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.markAsAttended(19L, "admin@campconnect.test", true))
                .hasMessageContaining("Attendance can only be recorded on or after the event start time");
    }

    @Test
    void markAsAttendedUpdatesReservationWithoutSendingAttendanceNotification() {
        Reservation reservation = buildReservation();
        reservation.setStatut(ReservationStatus.CONFIRMED);
        reservation.getEvent().setDateDebut(LocalDateTime.now().minusHours(2));
        reservation.getEvent().setDateFin(LocalDateTime.now().plusHours(2));

        when(reservationRepository.findById(19L)).thenReturn(Optional.of(reservation));

        reservationService.markAsAttended(19L, "admin@campconnect.test", true);

        assertThat(reservation.getStatut()).isEqualTo(ReservationStatus.ATTENDED);
        verify(reservationRepository).save(reservation);
        verify(userNotificationService, never()).notifyPaymentConfirmed(any(Reservation.class));
        verify(userNotificationService, never()).notifyBookingConfirmed(any(Reservation.class));
    }

    @Test
    void markAsAttendedAllowsEventOrganizerToRecordAttendance() {
        Reservation reservation = buildReservation();
        reservation.setStatut(ReservationStatus.CONFIRMED);
        reservation.getEvent().setDateDebut(LocalDateTime.now().minusHours(3));
        reservation.getEvent().setDateFin(LocalDateTime.now().minusHours(1));

        Utilisateur organizer = new Utilisateur();
        organizer.setId(42L);
        organizer.setNom("Event Manager");
        organizer.setEmail("organizer@campconnect.test");
        organizer.setRole(Role.GUIDE);
        reservation.getEvent().setOrganizer(organizer);

        when(reservationRepository.findById(19L)).thenReturn(Optional.of(reservation));
        when(utilisateurRepository.findByEmail("organizer@campconnect.test")).thenReturn(Optional.of(organizer));

        reservationService.markAsAttended(19L, "organizer@campconnect.test", false);

        assertThat(reservation.getStatut()).isEqualTo(ReservationStatus.ATTENDED);
        verify(reservationRepository).save(reservation);
    }

    @Test
    void markAsAttendedForCompletedEventRequestsFeedbackImmediately() {
        Reservation reservation = buildReservation();
        reservation.setStatut(ReservationStatus.CONFIRMED);
        reservation.getEvent().setDateDebut(LocalDateTime.now().minusHours(4));
        reservation.getEvent().setDateFin(LocalDateTime.now().minusHours(1));
        reservation.setFeedbackRequestedAt(null);
        reservation.setFeedbackSubmittedAt(null);

        when(reservationRepository.findById(19L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.markAsAttended(19L, "admin@campconnect.test", true);

        assertThat(reservation.getStatut()).isEqualTo(ReservationStatus.ATTENDED);
        assertThat(reservation.getFeedbackRequestedAt()).isNotNull();
        verify(userNotificationService).notifyFeedbackRequested(reservation);
    }

    @Test
    void markAsAttendedRejectsNonOrganizerEventManager() {
        Reservation reservation = buildReservation();
        reservation.setStatut(ReservationStatus.CONFIRMED);
        reservation.getEvent().setDateDebut(LocalDateTime.now().minusHours(3));
        reservation.getEvent().setDateFin(LocalDateTime.now().minusHours(1));

        Utilisateur organizer = new Utilisateur();
        organizer.setId(42L);
        organizer.setEmail("organizer@campconnect.test");
        organizer.setRole(Role.GUIDE);
        reservation.getEvent().setOrganizer(organizer);

        Utilisateur otherManager = new Utilisateur();
        otherManager.setId(99L);
        otherManager.setEmail("other-manager@campconnect.test");
        otherManager.setRole(Role.GERANT_RESTAU);

        when(reservationRepository.findById(19L)).thenReturn(Optional.of(reservation));
        when(utilisateurRepository.findByEmail("other-manager@campconnect.test")).thenReturn(Optional.of(otherManager));

        assertThatThrownBy(() -> reservationService.markAsAttended(19L, "other-manager@campconnect.test", false))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("You are not allowed to record attendance for this reservation");
    }

    @Test
    void markAsNoShowRequiresEventToBeCompleted() {
        Reservation reservation = buildReservation();
        reservation.setStatut(ReservationStatus.CONFIRMED);
        reservation.getEvent().setDateDebut(LocalDateTime.now().minusHours(2));
        reservation.getEvent().setDateFin(LocalDateTime.now().plusHours(2));

        when(reservationRepository.findById(19L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.markAsNoShow(19L, "admin@campconnect.test", true))
                .hasMessageContaining("No-show can only be recorded after the event has finished");
    }

    @Test
    void markAsNoShowAllowsCompletedEvents() {
        Reservation reservation = buildReservation();
        reservation.setStatut(ReservationStatus.CONFIRMED);
        reservation.getEvent().setDateDebut(LocalDateTime.now().minusHours(5));
        reservation.getEvent().setDateFin(LocalDateTime.now().minusHours(1));

        when(reservationRepository.findById(19L)).thenReturn(Optional.of(reservation));

        reservationService.markAsNoShow(19L, "admin@campconnect.test", true);

        assertThat(reservation.getStatut()).isEqualTo(ReservationStatus.NO_SHOW);
        verify(reservationRepository).save(reservation);
    }

    @Test
    void createReservationRejectsEventsThatAlreadyFinished() {
        Utilisateur user = new Utilisateur();
        user.setId(5L);
        user.setEmail("admin@campconnect.test");
        user.setRole(Role.ADMINISTRATEUR);

        Event event = new Event();
        event.setId(11L);
        event.setTitre("Finished Event");
        event.setStatut(EventStatus.SCHEDULED);
        event.setDateDebut(LocalDateTime.now().minusDays(2));
        event.setDateFin(LocalDateTime.now().minusDays(1));
        event.setCapaciteMax(25);
        event.setPrix(new BigDecimal("80.00"));

        com.esprit.campconnect.Reservation.DTO.ReservationRequestDTO requestDTO =
                new com.esprit.campconnect.Reservation.DTO.ReservationRequestDTO();
        requestDTO.setUtilisateurId(5L);
        requestDTO.setEventId(11L);
        requestDTO.setNombreParticipants(2);

        when(utilisateurRepository.findById(5L)).thenReturn(Optional.of(user));
        when(eventRepository.findById(11L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> reservationService.createReservation(requestDTO))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("This event has already finished");

        assertThat(event.getStatut()).isEqualTo(EventStatus.COMPLETED);
        verify(eventRepository).save(event);
    }

    @Test
    void processPaymentKeepsReservationLifecycleConfirmedAfterSuccessfulPayment() {
        Reservation reservation = buildReservation();
        reservation.setStatut(ReservationStatus.CONFIRMED);
        reservation.setStatutPaiement(PaymentStatus.UNPAID);

        when(reservationRepository.findById(19L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationCalendarService.isCalendarExportAvailable(any(Reservation.class))).thenReturn(false);

        com.esprit.campconnect.Reservation.DTO.PaymentProcessDTO paymentProcessDTO =
                new com.esprit.campconnect.Reservation.DTO.PaymentProcessDTO();
        paymentProcessDTO.setReservationId(19L);
        paymentProcessDTO.setTransactionId("txn_123");
        paymentProcessDTO.setStatutPaiement(PaymentStatus.PAID);

        com.esprit.campconnect.Reservation.DTO.ReservationResponseDTO response =
                reservationService.processPayment(paymentProcessDTO);

        assertThat(response.getStatut()).isEqualTo(ReservationStatus.CONFIRMED);
        assertThat(response.getStatutPaiement()).isEqualTo(PaymentStatus.PAID);
        assertThat(response.getStatusDescription()).isEqualTo("Reservation confirmed and fully paid");
        assertThat(response.getNextStepMessage()).contains("fully approved and paid");
        verify(userNotificationService).notifyPaymentConfirmed(reservation);
    }

    @Test
    void submitFeedbackStoresRatingAndCommentForCompletedAttendedReservation() {
        Reservation reservation = buildReservation();
        reservation.setStatut(ReservationStatus.ATTENDED);
        reservation.getEvent().setDateDebut(LocalDateTime.now().minusDays(1));
        reservation.getEvent().setDateFin(LocalDateTime.now().minusHours(2));

        when(reservationRepository.findByIdWithDetails(19L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationCalendarService.isCalendarExportAvailable(any(Reservation.class))).thenReturn(false);

        com.esprit.campconnect.Reservation.DTO.ReservationFeedbackRequestDTO requestDTO =
                new com.esprit.campconnect.Reservation.DTO.ReservationFeedbackRequestDTO();
        requestDTO.setRating(5);
        requestDTO.setComment("Excellent event flow");

        com.esprit.campconnect.Reservation.DTO.ReservationResponseDTO response =
                reservationService.submitFeedback(19L, requestDTO, "admin@campconnect.test", true);

        assertThat(response.getFeedbackRating()).isEqualTo(5);
        assertThat(response.getFeedbackComment()).isEqualTo("Excellent event flow");
        assertThat(response.getFeedbackSubmittedAt()).isNotNull();
        assertThat(response.getFeedbackEligible()).isFalse();
    }

    @Test
    void reconcileExpiredWaitlistOffersCancelsExpiredOfferAndPromotesNextWaitlistedGuest() {
        Event event = new Event();
        event.setId(31L);
        event.setTitre("Sunrise Camp");
        event.setLieu("Lagoon Base");
        event.setCapaciteMax(4);
        event.setDateDebut(LocalDateTime.now().plusDays(1));
        event.setDateFin(LocalDateTime.now().plusDays(1).plusHours(4));
        event.setReservations(new HashSet<>());

        Reservation expiredOffer = buildReservation();
        expiredOffer.setEvent(event);
        expiredOffer.setStatut(ReservationStatus.CONFIRMED);
        expiredOffer.setStatutPaiement(PaymentStatus.UNPAID);
        expiredOffer.setEstEnAttente(false);
        expiredOffer.setWaitlistOfferedAt(LocalDateTime.now().minusHours(15));
        expiredOffer.setWaitlistOfferExpiresAt(LocalDateTime.now().minusHours(1));

        Reservation nextWaitlistReservation = buildReservation();
        nextWaitlistReservation.setId(22L);
        nextWaitlistReservation.setEvent(event);
        nextWaitlistReservation.setStatut(ReservationStatus.PENDING);
        nextWaitlistReservation.setStatutPaiement(PaymentStatus.UNPAID);
        nextWaitlistReservation.setEstEnAttente(true);
        nextWaitlistReservation.setDateCreation(LocalDateTime.now().minusHours(3));

        event.getReservations().add(expiredOffer);
        event.getReservations().add(nextWaitlistReservation);

        when(reservationRepository.findExpiredWaitlistOffers(any(LocalDateTime.class))).thenReturn(List.of(expiredOffer));
        when(eventRepository.findById(31L)).thenReturn(Optional.of(event));
        when(reservationRepository.findWaitlistByEvent(31L)).thenReturn(List.of(nextWaitlistReservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.reconcileExpiredWaitlistOffers();

        assertThat(expiredOffer.getStatut()).isEqualTo(ReservationStatus.CANCELLED);
        assertThat(expiredOffer.getWaitlistOfferExpiresAt()).isNull();
        assertThat(nextWaitlistReservation.getStatut()).isEqualTo(ReservationStatus.CONFIRMED);
        assertThat(nextWaitlistReservation.getEstEnAttente()).isFalse();
        assertThat(nextWaitlistReservation.getWaitlistOfferExpiresAt()).isNotNull();
        verify(userNotificationService).notifyWaitlistOfferExpired(expiredOffer);
        verify(userNotificationService).notifyWaitlistPromoted(nextWaitlistReservation);
    }

    @Test
    void dispatchUpcomingReservationRemindersSendsOneDayReminderWithinWindow() {
        Reservation reservation = buildReservation();
        reservation.setStatut(ReservationStatus.CONFIRMED);
        reservation.setStatutPaiement(PaymentStatus.PAID);
        reservation.setEstEnAttente(false);
        reservation.getEvent().setDateDebut(LocalDateTime.now().plusHours(12));
        reservation.getEvent().setDateFin(LocalDateTime.now().plusHours(17));

        when(reservationRepository.findUpcomingActiveReservationsWithDetails(any(LocalDateTime.class)))
                .thenReturn(List.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.dispatchUpcomingReservationReminders();

        assertThat(reservation.getReminderOneDaySentAt()).isNotNull();
        assertThat(reservation.getReminderSevenDaysSentAt()).isNull();
        assertThat(reservation.getReminderTwoHoursSentAt()).isNull();
        verify(userNotificationService).notifyEventReminder(eq(reservation), eq("1 day"));
    }

    @Test
    void markEligibleReservationsAsAttendedUpdatesAllEligibleReservationsForEvent() {
        Reservation eligibleReservation = buildReservation();
        eligibleReservation.setStatut(ReservationStatus.CONFIRMED);
        eligibleReservation.getEvent().setDateDebut(LocalDateTime.now().minusHours(5));
        eligibleReservation.getEvent().setDateFin(LocalDateTime.now().minusHours(1));
        eligibleReservation.setFeedbackRequestedAt(null);
        eligibleReservation.setFeedbackSubmittedAt(null);

        Reservation secondEligibleReservation = buildReservation();
        secondEligibleReservation.setId(20L);
        secondEligibleReservation.setStatut(ReservationStatus.PAID);
        secondEligibleReservation.getEvent().setId(11L);
        secondEligibleReservation.getEvent().setDateDebut(LocalDateTime.now().minusHours(5));
        secondEligibleReservation.getEvent().setDateFin(LocalDateTime.now().minusHours(1));
        secondEligibleReservation.setFeedbackRequestedAt(null);
        secondEligibleReservation.setFeedbackSubmittedAt(null);

        Reservation ineligibleReservation = buildReservation();
        ineligibleReservation.setId(21L);
        ineligibleReservation.setStatut(ReservationStatus.NO_SHOW);
        ineligibleReservation.getEvent().setId(11L);
        ineligibleReservation.getEvent().setDateDebut(LocalDateTime.now().minusHours(5));
        ineligibleReservation.getEvent().setDateFin(LocalDateTime.now().minusHours(1));

        when(eventRepository.findById(11L)).thenReturn(Optional.of(eligibleReservation.getEvent()));
        when(reservationRepository.findByEventIdWithDetails(11L))
                .thenReturn(List.of(eligibleReservation, secondEligibleReservation, ineligibleReservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationCalendarService.isCalendarExportAvailable(any(Reservation.class))).thenReturn(false);

        List<com.esprit.campconnect.Reservation.DTO.ReservationResponseDTO> updatedReservations =
                reservationService.markEligibleReservationsAsAttended(11L, "admin@campconnect.test", true);

        assertThat(updatedReservations).hasSize(2);
        assertThat(updatedReservations)
                .extracting(com.esprit.campconnect.Reservation.DTO.ReservationResponseDTO::getId)
                .containsExactlyInAnyOrder(19L, 20L);
        assertThat(eligibleReservation.getStatut()).isEqualTo(ReservationStatus.ATTENDED);
        assertThat(secondEligibleReservation.getStatut()).isEqualTo(ReservationStatus.ATTENDED);
        assertThat(ineligibleReservation.getStatut()).isEqualTo(ReservationStatus.NO_SHOW);
        verify(userNotificationService, times(2)).notifyFeedbackRequested(any(Reservation.class));
    }

    @Test
    void requestPostEventFeedbackMarksRequestAndSendsNotification() {
        Reservation reservation = buildReservation();
        reservation.setStatut(ReservationStatus.ATTENDED);
        reservation.getEvent().setDateDebut(LocalDateTime.now().minusDays(1));
        reservation.getEvent().setDateFin(LocalDateTime.now().minusHours(3));
        reservation.setFeedbackSubmittedAt(null);
        reservation.setFeedbackRequestedAt(null);

        when(reservationRepository.findAttendedReservationsAwaitingFeedback(any(LocalDateTime.class)))
                .thenReturn(List.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.requestPostEventFeedback();

        assertThat(reservation.getFeedbackRequestedAt()).isNotNull();
        verify(userNotificationService).notifyFeedbackRequested(reservation);
    }

    private Reservation buildReservation() {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setId(5L);
        utilisateur.setNom("Admin");
        utilisateur.setEmail("admin@campconnect.test");
        utilisateur.setRole(Role.ADMINISTRATEUR);

        Event event = new Event();
        event.setId(11L);
        event.setTitre("Sunrise Camp");
        event.setLieu("Lagoon Base");
        event.setDateDebut(LocalDateTime.of(2026, 5, 1, 10, 0));
        event.setDateFin(LocalDateTime.of(2026, 5, 1, 15, 0));
        event.setOrganizer(utilisateur);

        Reservation reservation = new Reservation();
        reservation.setId(19L);
        reservation.setUtilisateur(utilisateur);
        reservation.setEvent(event);
        reservation.setStatut(ReservationStatus.PAID);
        reservation.setNombreParticipants(2);
        reservation.setBasePriceTotal(new BigDecimal("120.00"));
        reservation.setDiscountAmount(new BigDecimal("20.00"));
        reservation.setPrixTotal(new BigDecimal("100.00"));
        reservation.setEstEnAttente(false);
        reservation.setStatutPaiement(PaymentStatus.PAID);
        reservation.setDateCreation(LocalDateTime.of(2026, 4, 1, 9, 0));
        reservation.setDateModification(LocalDateTime.of(2026, 4, 1, 9, 15));
        reservation.setDatePaiement(LocalDateTime.of(2026, 4, 1, 9, 10));
        reservation.setStripeInvoiceId("inv_123");
        reservation.setStripeInvoiceNumber("CC-INV-123");
        reservation.setInvoiceHostedUrl(null);
        reservation.setInvoicePdfUrl(null);
        reservation.setRefundAmount(BigDecimal.ZERO);
        reservation.setRefundPercentage(0);
        return reservation;
    }
}
