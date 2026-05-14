package com.esprit.campconnect.Event.Service;

import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Event.Enum.EventStatus;
import com.esprit.campconnect.Event.Repository.EventFavoriteRepository;
import com.esprit.campconnect.Event.Repository.EventImageRepository;
import com.esprit.campconnect.Event.Repository.EventRepository;
import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.Reservation.Enum.ReservationStatus;
import com.esprit.campconnect.Reservation.Repository.ReservationRepository;
import com.esprit.campconnect.Reservation.Service.UserNotificationService;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import com.esprit.campconnect.config.GoogleMapsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private EventFavoriteRepository eventFavoriteRepository;

    @Mock
    private EventImageRepository eventImageRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private UserNotificationService userNotificationService;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private GoogleMapsService googleMapsService;

    private EventServiceImpl eventService;

    @BeforeEach
    void setUp() {
        eventService = new EventServiceImpl(
                eventRepository,
                utilisateurRepository,
                eventFavoriteRepository,
                eventImageRepository,
                reservationRepository,
                userNotificationService,
                fileStorageService,
                objectMapper,
                googleMapsService
        );

        lenient().when(reservationRepository.summarizeParticipantsByEventIds(anyCollection())).thenReturn(List.of());
        lenient().when(reservationRepository.summarizeFeedbackByEventIds(anyCollection())).thenReturn(List.of());
        lenient().when(reservationRepository.findSubmittedFeedbackByEventId(anyLong())).thenReturn(List.of());
        lenient().when(eventFavoriteRepository.countFavoritesByEventIds(anyCollection())).thenReturn(List.of());
    }

    @Test
    void getAvailableSeatsUsesAggregatedParticipantCounts() {
        Event event = new Event();
        event.setId(7L);
        event.setTitre("Mountain Trek");
        event.setPrix(new BigDecimal("80.00"));
        event.setCapaciteMax(10);
        event.setStatut(EventStatus.SCHEDULED);
        event.setDateDebut(LocalDateTime.of(2026, 6, 1, 8, 0));
        event.setDateFin(LocalDateTime.of(2026, 6, 1, 18, 0));

        ReservationRepository.EventReservationStatsView statsView = new ReservationRepository.EventReservationStatsView() {
            @Override
            public Long getEventId() {
                return 7L;
            }

            @Override
            public Long getConfirmedParticipants() {
                return 6L;
            }

            @Override
            public Long getWaitlistParticipants() {
                return 2L;
            }
        };

        when(eventRepository.findById(7L)).thenReturn(Optional.of(event));
        when(reservationRepository.summarizeParticipantsByEventIds(anyCollection())).thenReturn(List.of(statsView));

        Integer availableSeats = eventService.getAvailableSeats(7L);

        assertThat(availableSeats).isEqualTo(4);
    }

    @Test
    void postponeEventNotifiesActiveReservationsOnly() {
        Event event = new Event();
        event.setId(9L);
        event.setTitre("Campfire Jam");
        event.setStatut(EventStatus.SCHEDULED);
        event.setDateDebut(LocalDateTime.of(2026, 6, 10, 18, 0));
        event.setDateFin(LocalDateTime.of(2026, 6, 10, 21, 0));

        Utilisateur activeUser = new Utilisateur();
        activeUser.setId(34L);
        activeUser.setNom("Active Guest");
        activeUser.setEmail("active@example.com");

        Reservation activeReservation = new Reservation();
        activeReservation.setId(91L);
        activeReservation.setUtilisateur(activeUser);
        activeReservation.setEvent(event);
        activeReservation.setStatut(ReservationStatus.CONFIRMED);

        Reservation cancelledReservation = new Reservation();
        cancelledReservation.setId(92L);
        cancelledReservation.setUtilisateur(activeUser);
        cancelledReservation.setEvent(event);
        cancelledReservation.setStatut(ReservationStatus.CANCELLED);

        when(eventRepository.findById(9L)).thenReturn(Optional.of(event));
        when(eventRepository.save(event)).thenReturn(event);
        when(reservationRepository.findByEventIdWithDetails(9L)).thenReturn(List.of(activeReservation, cancelledReservation));

        eventService.postponeEvent(
                9L,
                LocalDateTime.of(2026, 6, 11, 18, 0),
                LocalDateTime.of(2026, 6, 11, 21, 0)
        );

        verify(userNotificationService).notifyEventPostponed(
                activeReservation,
                LocalDateTime.of(2026, 6, 10, 18, 0),
                LocalDateTime.of(2026, 6, 10, 21, 0)
        );
    }

    @Test
    void getEventByIdDerivesCompletedStatusForPastEvent() {
        Event event = new Event();
        event.setId(12L);
        event.setTitre("Desert Forum");
        event.setPrix(new BigDecimal("40.00"));
        event.setCapaciteMax(50);
        event.setStatut(EventStatus.SCHEDULED);
        event.setDateDebut(LocalDateTime.now().minusDays(3));
        event.setDateFin(LocalDateTime.now().minusDays(2));

        when(eventRepository.findById(12L)).thenReturn(Optional.of(event));
        var response = eventService.getEventById(12L);

        assertThat(response.getStatut()).isEqualTo(EventStatus.COMPLETED);
        assertThat(response.getAvailableSeats()).isZero();
    }

    @Test
    void getAvailableEventsExcludesEventsThatAlreadyStartedOrFinished() {
        Event pastEvent = new Event();
        pastEvent.setId(21L);
        pastEvent.setTitre("Past Event");
        pastEvent.setPrix(new BigDecimal("20.00"));
        pastEvent.setCapaciteMax(20);
        pastEvent.setStatut(EventStatus.SCHEDULED);
        pastEvent.setDateDebut(LocalDateTime.now().minusDays(2));
        pastEvent.setDateFin(LocalDateTime.now().minusDays(1));

        Event ongoingEvent = new Event();
        ongoingEvent.setId(22L);
        ongoingEvent.setTitre("Ongoing Event");
        ongoingEvent.setPrix(new BigDecimal("25.00"));
        ongoingEvent.setCapaciteMax(30);
        ongoingEvent.setStatut(EventStatus.SCHEDULED);
        ongoingEvent.setDateDebut(LocalDateTime.now().minusHours(1));
        ongoingEvent.setDateFin(LocalDateTime.now().plusHours(2));

        Event futureEvent = new Event();
        futureEvent.setId(23L);
        futureEvent.setTitre("Future Event");
        futureEvent.setPrix(new BigDecimal("30.00"));
        futureEvent.setCapaciteMax(40);
        futureEvent.setStatut(EventStatus.SCHEDULED);
        futureEvent.setDateDebut(LocalDateTime.now().plusDays(2));
        futureEvent.setDateFin(LocalDateTime.now().plusDays(2).plusHours(4));

        when(eventRepository.findAll()).thenReturn(List.of(pastEvent, ongoingEvent, futureEvent));
        List<com.esprit.campconnect.Event.DTO.EventResponseDTO> availableEvents = eventService.getAvailableEvents();

        assertThat(availableEvents).extracting(com.esprit.campconnect.Event.DTO.EventResponseDTO::getId)
                .containsExactly(23L);
    }

    @Test
    void synchronizeLifecycleStatusesMarksPastEventsCompleted() {
        Event pastEvent = new Event();
        pastEvent.setId(31L);
        pastEvent.setTitre("Expired Event");
        pastEvent.setStatut(EventStatus.SCHEDULED);
        pastEvent.setDateDebut(LocalDateTime.now().minusDays(4));
        pastEvent.setDateFin(LocalDateTime.now().minusDays(1));

        Event futureEvent = new Event();
        futureEvent.setId(32L);
        futureEvent.setTitre("Future Event");
        futureEvent.setStatut(EventStatus.SCHEDULED);
        futureEvent.setDateDebut(LocalDateTime.now().plusDays(4));
        futureEvent.setDateFin(LocalDateTime.now().plusDays(4).plusHours(2));

        when(eventRepository.findAll()).thenReturn(List.of(pastEvent, futureEvent));

        eventService.synchronizeLifecycleStatuses();

        assertThat(pastEvent.getStatut()).isEqualTo(EventStatus.COMPLETED);
        assertThat(futureEvent.getStatut()).isEqualTo(EventStatus.SCHEDULED);
        verify(eventRepository).saveAll(anyList());
    }

    @Test
    void getEventByIdIncludesFeedbackSummaryAndRecentEntries() {
        Event event = new Event();
        event.setId(41L);
        event.setTitre("Forest Escape");
        event.setPrix(new BigDecimal("55.00"));
        event.setCapaciteMax(20);
        event.setStatut(EventStatus.COMPLETED);
        event.setDateDebut(LocalDateTime.now().minusDays(4));
        event.setDateFin(LocalDateTime.now().minusDays(3));

        Utilisateur reviewer = new Utilisateur();
        reviewer.setId(8L);
        reviewer.setNom("Sarra Ben Salah");

        Reservation feedbackReservation = new Reservation();
        feedbackReservation.setId(700L);
        feedbackReservation.setEvent(event);
        feedbackReservation.setUtilisateur(reviewer);
        feedbackReservation.setStatut(ReservationStatus.ATTENDED);
        feedbackReservation.setFeedbackRating(5);
        feedbackReservation.setFeedbackComment("Wonderful organization and atmosphere.");
        feedbackReservation.setFeedbackSubmittedAt(LocalDateTime.now().minusDays(2));

        ReservationRepository.EventFeedbackSummaryView feedbackSummaryView = new ReservationRepository.EventFeedbackSummaryView() {
            @Override
            public Long getEventId() {
                return 41L;
            }

            @Override
            public Double getAverageRating() {
                return 4.75D;
            }

            @Override
            public Long getFeedbackResponses() {
                return 4L;
            }
        };

        when(eventRepository.findById(41L)).thenReturn(Optional.of(event));
        when(reservationRepository.summarizeFeedbackByEventIds(anyCollection())).thenReturn(List.of(feedbackSummaryView));
        when(reservationRepository.findSubmittedFeedbackByEventId(41L)).thenReturn(List.of(feedbackReservation));

        var response = eventService.getEventById(41L);

        assertThat(response.getAverageRating()).isEqualTo(4.75D);
        assertThat(response.getFeedbackCount()).isEqualTo(4L);
        assertThat(response.getFeedbackEntries()).hasSize(1);
        assertThat(response.getFeedbackEntries().get(0).getReviewerName()).isEqualTo("Sarra Ben Salah");
        assertThat(response.getFeedbackEntries().get(0).getRating()).isEqualTo(5);
    }
}
