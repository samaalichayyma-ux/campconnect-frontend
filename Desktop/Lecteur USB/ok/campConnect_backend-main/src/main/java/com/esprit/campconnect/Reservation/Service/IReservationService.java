package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Reservation.DTO.PaymentProcessDTO;
import com.esprit.campconnect.Reservation.DTO.ReservationFeedbackRequestDTO;
import com.esprit.campconnect.Reservation.DTO.ReservationRequestDTO;
import com.esprit.campconnect.Reservation.DTO.ReservationResponseDTO;
import com.esprit.campconnect.Reservation.DTO.StripeCheckoutSessionResponseDTO;
import com.esprit.campconnect.Reservation.DTO.UserReservationStatsDTO;
import java.util.List;

public interface IReservationService {

    // CRUD operations
    ReservationResponseDTO createReservation(ReservationRequestDTO requestDTO);
    ReservationResponseDTO getReservationById(Long id);
    List<ReservationResponseDTO> getAllReservations();
    List<ReservationResponseDTO> getReservationsForAuthenticatedUser(String requesterEmail);
    List<ReservationResponseDTO> getReservationsByUser(Long userId);
    List<ReservationResponseDTO> getReservationsByEvent(Long eventId);
    ReservationResponseDTO updateReservation(Long id, ReservationRequestDTO requestDTO);
    void cancelReservation(Long id, String reason);

    // Reservation management
    void confirmReservation(Long id);
    void rejectReservation(Long id, String reason);
    void markAsAttended(Long id, String requesterEmail, boolean requesterIsAdmin);
    List<ReservationResponseDTO> markEligibleReservationsAsAttended(Long eventId, String requesterEmail, boolean requesterIsAdmin);
    void markAsNoShow(Long id, String requesterEmail, boolean requesterIsAdmin);

    // Payment processing
    ReservationResponseDTO processPayment(PaymentProcessDTO paymentDTO);
    StripeCheckoutSessionResponseDTO createCheckoutSession(Long reservationId, String requesterEmail, boolean requesterIsAdmin);
    ReservationResponseDTO syncCheckoutSession(String sessionId, String requesterEmail, boolean requesterIsAdmin);
    byte[] generateReceiptPdf(Long reservationId, String requesterEmail, boolean requesterIsAdmin);
    byte[] generateCalendarInvite(Long reservationId, String requesterEmail, boolean requesterIsAdmin);
    ReservationResponseDTO submitFeedback(Long reservationId, ReservationFeedbackRequestDTO requestDTO, String requesterEmail, boolean requesterIsAdmin);
    UserReservationStatsDTO getReservationStatsForUser(String requesterEmail);
    void handleStripeWebhook(String payload, String signatureHeader);
    void refundReservation(Long reservationId, String reason);
    Double calculateReservationPrice(Long eventId, Integer numberOfParticipants);

    // Waitlist management
    void processWaitlistToConfirmed(Long eventId);
    void reconcileExpiredWaitlistReservations();
    void reconcileExpiredWaitlistOffers();
    void dispatchUpcomingReservationReminders();
    void requestPostEventFeedback();
    List<ReservationResponseDTO> getEventWaitlist(Long eventId);
    boolean isUserOnWaitlist(Long userId, Long eventId);

    // Query operations
    List<ReservationResponseDTO> getPendingReservations();
    List<ReservationResponseDTO> getUnpaidReservations();
    List<ReservationResponseDTO> getRefundableReservations();
    Double calculateEventRevenue(Long eventId);

    // Statistics
    Long countConfirmedReservationsForEvent(Long eventId);
    List<ReservationResponseDTO> getUserCancelledReservations(Long userId);
}
