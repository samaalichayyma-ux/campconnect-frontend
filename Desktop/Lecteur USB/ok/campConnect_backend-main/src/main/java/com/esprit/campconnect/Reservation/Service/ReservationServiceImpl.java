package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Event.Enum.EventStatus;
import com.esprit.campconnect.Event.Repository.EventRepository;
import com.esprit.campconnect.Reservation.DTO.PaymentProcessDTO;
import com.esprit.campconnect.Reservation.DTO.ReservationCancellationPolicyDTO;
import com.esprit.campconnect.Reservation.DTO.ReservationFeedbackRequestDTO;
import com.esprit.campconnect.Reservation.DTO.ReservationRequestDTO;
import com.esprit.campconnect.Reservation.DTO.ReservationResponseDTO;
import com.esprit.campconnect.Reservation.DTO.StripeCheckoutSessionResponseDTO;
import com.esprit.campconnect.Reservation.DTO.UserReservationStatsDTO;
import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.Reservation.Enum.CancellationPolicyTier;
import com.esprit.campconnect.Reservation.Enum.PaymentStatus;
import com.esprit.campconnect.Reservation.Enum.ReservationStatus;
import com.esprit.campconnect.Reservation.Repository.ReservationRepository;
import com.esprit.campconnect.User.Entity.Role;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.Invoice;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ReservationServiceImpl implements IReservationService {

    private final ReservationRepository reservationRepository;
    private final EventRepository eventRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final StripeGatewayService stripeGatewayService;
    private final ReservationReceiptPdfService reservationReceiptPdfService;
    private final ReservationCalendarService reservationCalendarService;
    private final PromotionOfferService promotionOfferService;
    private final UserNotificationService userNotificationService;

    private static final int FULL_REFUND_WINDOW_HOURS = 48;
    private static final int PARTIAL_REFUND_WINDOW_HOURS = 24;
    private static final int WAITLIST_SEAT_HOLD_HOURS = 12;
    private static final BigDecimal PARTIAL_REFUND_RATE = new BigDecimal("0.50");
    private static final String WAITLIST_AUTO_REFUND_REASON =
            "Waitlist payment refunded automatically because no seat opened before the event started";
    private static final String WAITLIST_AUTO_CLOSE_REASON =
            "Waitlist request closed automatically because the event started without an opening";
    private static final String WAITLIST_OFFER_EXPIRED_REASON =
            "Temporary seat offer expired before payment was completed";
    private static final DateTimeFormatter RESERVATION_TIMELINE_FORMATTER =
            DateTimeFormatter.ofPattern("EEE, MMM d 'at' h:mm a");

    // ============== CRUD OPERATIONS ==============

    @Override
    public ReservationResponseDTO createReservation(ReservationRequestDTO requestDTO) {
        log.info("Creating new reservation for user: {} and event: {} with {} participants", 
                requestDTO.getUtilisateurId(), requestDTO.getEventId(), requestDTO.getNombreParticipants());

        Utilisateur user = getUserOrThrow(requestDTO.getUtilisateurId());
        Event event = getEventOrThrow(requestDTO.getEventId());

        validateEventBookingAvailability(event);
        validateParticipantsAgainstCapacity(event, requestDTO.getNombreParticipants());
        validateActiveReservationConflict(requestDTO.getUtilisateurId(), requestDTO.getEventId(), null);

        PromotionOfferService.PromotionEvaluationResult pricingResult =
                promotionOfferService.evaluateReservationPricing(
                        event,
                        requestDTO.getNombreParticipants(),
                        requestDTO.getPromoCode(),
                        true
                );

        // Create reservation
        Reservation reservation = new Reservation();
        reservation.setUtilisateur(user);
        reservation.setEvent(event);
        reservation.setNombreParticipants(requestDTO.getNombreParticipants());
        reservation.setRemarques(requestDTO.getRemarques());
        reservation.setPromotionOffer(pricingResult.getAppliedPromotion());
        reservation.setBasePriceTotal(pricingResult.getBasePriceTotal());
        reservation.setDiscountAmount(pricingResult.getDiscountAmount());
        reservation.setPromoCode(pricingResult.getAppliedPromoCode());
        reservation.setDiscountLabel(pricingResult.getDiscountLabel());
        reservation.setDiscountAutoApplied(pricingResult.isAutoApplied());
        reservation.setPrixTotal(pricingResult.getTotalPrice());

        boolean isWaitlist = shouldBeWaitlisted(event, null, requestDTO.getNombreParticipants());

        reservation.setEstEnAttente(isWaitlist);
        reservation.setStatut(resolveInitialReservationStatus(event, isWaitlist));
        reservation.setStatutPaiement(PaymentStatus.UNPAID);

        Reservation savedReservation = reservationRepository.save(reservation);
        log.info("Reservation {} created for event: {}, {} participants, waitlist: {}", 
                savedReservation.getId(), event.getId(), requestDTO.getNombreParticipants(), isWaitlist);

        notifyReservationCreated(savedReservation);

        return mapToResponseDTO(savedReservation);
    }

    @Override
    public ReservationResponseDTO getReservationById(Long id) {
        log.info("Fetching reservation with id: {}", id);
        Reservation reservation = reservationRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));
        return mapToResponseDTO(reservation, true);
    }

    @Override
    public List<ReservationResponseDTO> getAllReservations() {
        log.info("Fetching all reservations");
        return mapReservationsToResponseDTOs(reservationRepository.findAllWithDetails());
    }

    @Override
    public List<ReservationResponseDTO> getReservationsForAuthenticatedUser(String requesterEmail) {
        Utilisateur requester = getUserByEmailOrThrow(requesterEmail);
        log.info("Fetching reservations for authenticated user: {}", requester.getId());
        return mapReservationsToResponseDTOs(reservationRepository.findByUtilisateurIdWithDetails(requester.getId()));
    }

    @Override
    public List<ReservationResponseDTO> getReservationsByUser(Long userId) {
        log.info("Fetching reservations for user: {}", userId);
        return mapReservationsToResponseDTOs(reservationRepository.findByUtilisateurIdWithDetails(userId));
    }

    @Override
    public List<ReservationResponseDTO> getReservationsByEvent(Long eventId) {
        log.info("Fetching reservations for event: {}", eventId);
        return mapReservationsToResponseDTOs(reservationRepository.findByEventIdWithDetails(eventId));
    }

    @Override
    public ReservationResponseDTO updateReservation(Long id, ReservationRequestDTO requestDTO) {
        log.info("Updating reservation with id: {}", id);

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));

        if (!isEditableStatus(reservation.getStatut())) {
            throw new RuntimeException("Cannot update a reservation with status: " + reservation.getStatut());
        }

        Utilisateur user = getUserOrThrow(requestDTO.getUtilisateurId());
        Event event = getEventOrThrow(requestDTO.getEventId());

        validateEventBookingAvailability(event);
        validateParticipantsAgainstCapacity(event, requestDTO.getNombreParticipants());
        validateActiveReservationConflict(user.getId(), event.getId(), reservation.getId());

        PromotionOfferService.PromotionEvaluationResult pricingResult =
                promotionOfferService.evaluateReservationPricing(
                        event,
                        requestDTO.getNombreParticipants(),
                        requestDTO.getPromoCode(),
                        true
                );

        reservation.setUtilisateur(user);
        reservation.setEvent(event);
        reservation.setNombreParticipants(requestDTO.getNombreParticipants());
        reservation.setRemarques(requestDTO.getRemarques());
        reservation.setPromotionOffer(pricingResult.getAppliedPromotion());
        reservation.setBasePriceTotal(pricingResult.getBasePriceTotal());
        reservation.setDiscountAmount(pricingResult.getDiscountAmount());
        reservation.setPromoCode(pricingResult.getAppliedPromoCode());
        reservation.setDiscountLabel(pricingResult.getDiscountLabel());
        reservation.setDiscountAutoApplied(pricingResult.isAutoApplied());
        reservation.setPrixTotal(pricingResult.getTotalPrice());
        reservation.setEstEnAttente(shouldBeWaitlisted(event, reservation, requestDTO.getNombreParticipants()));
        if (reservation.getEstEnAttente()) {
            reservation.setStatut(ReservationStatus.PENDING);
        } else if (reservation.getStatutPaiement() == PaymentStatus.PAID) {
            reservation.setStatut(ReservationStatus.CONFIRMED);
        } else if (reservation.getStatut() == ReservationStatus.PENDING && !requiresReservationApproval(event)) {
            reservation.setStatut(ReservationStatus.CONFIRMED);
        }
        reservation.setDateModification(LocalDateTime.now());

        Reservation updatedReservation = reservationRepository.save(reservation);
        log.info("Reservation updated successfully");

        return mapToResponseDTO(updatedReservation);
    }

    @Override
    public void cancelReservation(Long id, String reason) {
        log.info("Cancelling reservation with id: {} - reason: {}", id, reason);

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));

        ReservationCancellationPolicyDTO cancellationPolicy = buildCancellationPolicy(reservation);
        if (!Boolean.TRUE.equals(cancellationPolicy.getCanCancel())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    cancellationPolicy.getDescription()
            );
        }

        if (hasCapturedFunds(reservation)) {
            applyAutomatedCancellationPolicy(reservation, cancellationPolicy, reason);
        } else {
            markReservationCancelled(reservation, reason);
            reservationRepository.save(reservation);
        }

        // If there's a waitlist, promote first person from waitlist
        if (!reservation.getEvent().getReservations().isEmpty()) {
            processWaitlistToConfirmed(reservation.getEvent().getId());
        }

        log.info("Reservation cancelled successfully");
    }

    // ============== RESERVATION MANAGEMENT ==============

    @Override
    public void confirmReservation(Long id) {
        log.info("Confirming reservation with id: {}", id);

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        if (reservation.getStatut() != ReservationStatus.PENDING) {
            throw new RuntimeException("Only pending reservations can be confirmed");
        }

        int availableSeats = getEffectiveAvailableSeats(reservation.getEvent(), null);
        if (reservation.getNombreParticipants() > availableSeats) {
            throw new RuntimeException("Not enough seats available to confirm this reservation");
        }

        reservation.setStatut(ReservationStatus.CONFIRMED);
        reservation.setEstEnAttente(false);
        clearWaitlistSeatOffer(reservation);
        reservation.setDateModification(LocalDateTime.now());
        Reservation savedReservation = reservationRepository.save(reservation);

        log.info("Reservation confirmed successfully");
        userNotificationService.notifyBookingConfirmed(savedReservation);
    }

    @Override
    public void rejectReservation(Long id, String reason) {
        log.info("Rejecting reservation with id: {} - reason: {}", id, reason);

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        if (reservation.getStatut() != ReservationStatus.PENDING) {
            throw new RuntimeException("Only pending reservations can be rejected");
        }

        if (hasCapturedFunds(reservation)) {
            forceFullRefund(
                    reservation,
                    StringUtils.hasText(reason) ? reason.trim() : "Reservation rejected by the organizer"
            );
            log.info("Rejected reservation {} with a full refund", reservation.getId());
            return;
        }

        reservation.setStatut(ReservationStatus.CANCELLED);
        reservation.setEstEnAttente(false);
        reservation.setDateModification(LocalDateTime.now());
        reservationRepository.save(reservation);

        log.info("Reservation rejected successfully");
    }

    @Override
    public void markAsAttended(Long id, String requesterEmail, boolean requesterIsAdmin) {
        log.info("Marking reservation as ATTENDED with id: {}", id);

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        validateAttendanceManagementAccess(reservation, requesterEmail, requesterIsAdmin);
        validateAttendanceRecordingEligibility(reservation);
        persistAttendanceRecordedReservation(reservation, LocalDateTime.now());

        log.info("Reservation marked as ATTENDED");
    }

    @Override
    public List<ReservationResponseDTO> markEligibleReservationsAsAttended(Long eventId, String requesterEmail, boolean requesterIsAdmin) {
        log.info("Marking eligible reservations as ATTENDED for event {}", eventId);

        Event event = getEventOrThrow(eventId);
        validateAttendanceManagementAccess(event, requesterEmail, requesterIsAdmin);

        LocalDateTime now = LocalDateTime.now();
        synchronizeEventLifecycleStatus(event, now);

        if (event.getDateDebut() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Attendance can only be recorded for reservations linked to a scheduled event"
            );
        }

        if (now.isBefore(event.getDateDebut())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Attendance can only be recorded on or after the event start time"
            );
        }

        List<Reservation> updatedReservations = reservationRepository.findByEventIdWithDetails(eventId).stream()
                .filter(this::isAttendanceRecordable)
                .map(reservation -> persistAttendanceRecordedReservation(reservation, now))
                .toList();

        log.info("Marked {} reservation(s) as ATTENDED for event {}", updatedReservations.size(), eventId);
        return mapReservationsToResponseDTOs(updatedReservations);
    }

    @Override
    public void markAsNoShow(Long id, String requesterEmail, boolean requesterIsAdmin) {
        log.info("Marking reservation as NO_SHOW with id: {}", id);

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        validateAttendanceManagementAccess(reservation, requesterEmail, requesterIsAdmin);
        validateNoShowRecordingEligibility(reservation);

        reservation.setStatut(ReservationStatus.NO_SHOW);
        reservation.setDateModification(LocalDateTime.now());
        reservationRepository.save(reservation);

        log.info("Reservation marked as NO_SHOW");
    }

    // ============== PAYMENT PROCESSING ==============

    @Override
    public ReservationResponseDTO processPayment(PaymentProcessDTO paymentDTO) {
        log.info("Processing payment for reservation: {}", paymentDTO.getReservationId());

        Reservation reservation = reservationRepository.findById(paymentDTO.getReservationId())
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        if (reservation.getStatutPaiement() == PaymentStatus.PAID) {
            throw new RuntimeException("Reservation already paid");
        }

        // Update payment status based on DTO
        reservation.setStatutPaiement(paymentDTO.getStatutPaiement());
        reservation.setTransactionId(paymentDTO.getTransactionId());

        boolean paymentConfirmed = paymentDTO.getStatutPaiement() == PaymentStatus.PAID;
        if (paymentConfirmed) {
            reservation.setStatut(resolvePostPaymentStatus(reservation));
            clearWaitlistSeatOffer(reservation);
            reservation.setDatePaiement(LocalDateTime.now());
            log.info("Payment successful for reservation: {}", reservation.getId());
        } else if (paymentDTO.getStatutPaiement() == PaymentStatus.FAILED) {
            log.warn("Payment failed for reservation: {}", reservation.getId());
        }

        reservation.setDateModification(LocalDateTime.now());
        Reservation updatedReservation = reservationRepository.save(reservation);

        if (paymentConfirmed) {
            userNotificationService.notifyPaymentConfirmed(updatedReservation);
        }

        return mapToResponseDTO(updatedReservation);

    }

    @Override
    public StripeCheckoutSessionResponseDTO createCheckoutSession(Long reservationId, String requesterEmail, boolean requesterIsAdmin) {
        log.info("Creating Stripe checkout session for reservation: {}", reservationId);

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));

        validatePaymentAccess(reservation, requesterEmail, requesterIsAdmin);
        validateStripePaymentEligibility(reservation);

        Session session = stripeGatewayService.createCheckoutSession(reservation);
        return new StripeCheckoutSessionResponseDTO(session.getId(), session.getUrl());
    }

    @Override
    public ReservationResponseDTO syncCheckoutSession(String sessionId, String requesterEmail, boolean requesterIsAdmin) {
        log.info("Synchronizing Stripe checkout session: {}", sessionId);

        if (!StringUtils.hasText(sessionId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe session ID is required");
        }

        Session session = stripeGatewayService.retrieveCheckoutSession(sessionId);
        Reservation reservation = resolveReservationFromStripeSession(session);

        validatePaymentAccess(reservation, requesterEmail, requesterIsAdmin);

        if ("paid".equalsIgnoreCase(session.getPaymentStatus())) {
            reservation = applySuccessfulStripePayment(reservation, session);
        }

        return mapToResponseDTO(reservation);
    }

    @Override
    public byte[] generateReceiptPdf(Long reservationId, String requesterEmail, boolean requesterIsAdmin) {
        log.info("Generating receipt PDF for reservation: {}", reservationId);

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));

        validateReservationAccess(reservation, requesterEmail, requesterIsAdmin);

        if (!isReceiptAvailable(reservation)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A receipt is only available after Stripe captures a payment or refund for this reservation"
            );
        }

        return reservationReceiptPdfService.generateReceipt(reservation);
    }

    @Override
    public byte[] generateCalendarInvite(Long reservationId, String requesterEmail, boolean requesterIsAdmin) {
        log.info("Generating calendar export for reservation: {}", reservationId);

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));

        validateReservationAccess(reservation, requesterEmail, requesterIsAdmin);

        if (!reservationCalendarService.isCalendarExportAvailable(reservation)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Calendar export is only available for active reservations with a scheduled event"
            );
        }

        return reservationCalendarService.generateIcsInvite(reservation);
    }

    @Override
    public ReservationResponseDTO submitFeedback(
            Long reservationId,
            ReservationFeedbackRequestDTO requestDTO,
            String requesterEmail,
            boolean requesterIsAdmin
    ) {
        log.info("Submitting feedback for reservation {}", reservationId);

        Reservation reservation = reservationRepository.findByIdWithDetails(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));

        validateReservationAccess(reservation, requesterEmail, requesterIsAdmin);
        validateFeedbackEligibility(reservation);

        reservation.setFeedbackRating(requestDTO.getRating());
        reservation.setFeedbackComment(StringUtils.hasText(requestDTO.getComment()) ? requestDTO.getComment().trim() : null);
        reservation.setFeedbackSubmittedAt(LocalDateTime.now());
        reservation.setDateModification(LocalDateTime.now());

        return mapToResponseDTO(reservationRepository.save(reservation));
    }

    @Override
    public UserReservationStatsDTO getReservationStatsForUser(String requesterEmail) {
        Utilisateur requester = getUserByEmailOrThrow(requesterEmail);
        List<Reservation> reservations = reservationRepository.findByUtilisateurIdWithDetails(requester.getId());
        LocalDateTime now = LocalDateTime.now();

        long totalReservations = reservations.size();
        long upcomingBookings = reservations.stream()
                .filter(this::isUpcomingActiveReservation)
                .count();
        long eventsAttended = reservations.stream()
                .filter(reservation -> hasEventCompleted(reservation, now))
                .filter(this::countsAsAttendedEvent)
                .count();
        BigDecimal totalSpent = reservations.stream()
                .map(this::calculateNetPaidAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String favoriteEventCategory = reservations.stream()
                .filter(this::countsTowardFavoriteCategory)
                .map(Reservation::getEvent)
                .filter(event -> event != null && event.getCategorie() != null)
                .map(event -> formatCategoryLabel(event.getCategorie().name()))
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet().stream()
                .max(Comparator.<java.util.Map.Entry<String, Long>>comparingLong(java.util.Map.Entry::getValue)
                        .thenComparing(java.util.Map.Entry::getKey))
                .map(java.util.Map.Entry::getKey)
                .orElse("No bookings yet");

        long billedReservations = reservations.stream()
                .filter(this::isReceiptAvailable)
                .count();
        long waitlistReservations = reservations.stream()
                .filter(reservation -> Boolean.TRUE.equals(reservation.getEstEnAttente()))
                .filter(reservation -> reservation.getStatut() == ReservationStatus.PENDING)
                .count();

        return new UserReservationStatsDTO(
                totalReservations,
                upcomingBookings,
                eventsAttended,
                totalSpent,
                favoriteEventCategory,
                billedReservations,
                waitlistReservations
        );
    }

    @Override
    public void handleStripeWebhook(String payload, String signatureHeader) {
        com.stripe.model.Event stripeEvent = stripeGatewayService.constructWebhookEvent(payload, signatureHeader);
        log.info("Received Stripe webhook event: {}", stripeEvent.getType());

        switch (stripeEvent.getType()) {
            case "checkout.session.completed" -> handleCheckoutSessionCompletedWebhook(stripeEvent);
            case "invoice.paid" -> handleInvoicePaidWebhook(stripeEvent);
            default -> log.debug("Ignoring Stripe webhook event type: {}", stripeEvent.getType());
        }
    }

    @Override
    public void refundReservation(Long reservationId, String reason) {
        log.info("Processing refund for reservation: {} - reason: {}", reservationId, reason);

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        if (!hasCapturedFunds(reservation)) {
            throw new RuntimeException("Only paid reservations can be refunded");
        }

        if (!StringUtils.hasText(reservation.getTransactionId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Reservation is missing the Stripe payment transaction needed for refund"
            );
        }

        ReservationCancellationPolicyDTO cancellationPolicy = buildCancellationPolicy(reservation);
        if (cancellationPolicy.getTier() != CancellationPolicyTier.FULL_REFUND
                && cancellationPolicy.getTier() != CancellationPolicyTier.PARTIAL_REFUND) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    cancellationPolicy.getDescription()
            );
        }

        applyAutomatedCancellationPolicy(reservation, cancellationPolicy, reason);

        log.info("Refund processed successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public Double calculateReservationPrice(Long eventId, Integer numberOfParticipants) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        validateEventBookingAvailability(event);
        return event.getPrix().doubleValue() * numberOfParticipants;
    }

    // ============== WAITLIST MANAGEMENT ==============

    @Override
    public void processWaitlistToConfirmed(Long eventId) {
        log.info("Processing waitlist for event: {}", eventId);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // Get first person from waitlist
        List<Reservation> waitlist = reservationRepository.findWaitlistByEvent(eventId);

        for (Reservation waitlistRes : waitlist) {
            int availableSeats = getEffectiveAvailableSeats(event, null);
            if (waitlistRes.getNombreParticipants() <= availableSeats) {
                waitlistRes.setEstEnAttente(false);
                waitlistRes.setStatut(resolveSeatPromotionStatus(waitlistRes));
                if (hasCapturedFunds(waitlistRes)) {
                    clearWaitlistSeatOffer(waitlistRes);
                } else {
                    LocalDateTime now = LocalDateTime.now();
                    waitlistRes.setWaitlistOfferedAt(now);
                    waitlistRes.setWaitlistOfferExpiresAt(resolveWaitlistOfferExpiry(waitlistRes, now));
                }
                waitlistRes.setDateModification(LocalDateTime.now());
                Reservation promotedReservation = reservationRepository.save(waitlistRes);
                log.info("Promoted reservation {} from waitlist to {}", waitlistRes.getId(), waitlistRes.getStatut());
                userNotificationService.notifyWaitlistPromoted(promotedReservation);
            } else {
                break;
            }
        }
    }

    @Override
    public void reconcileExpiredWaitlistReservations() {
        LocalDateTime now = LocalDateTime.now();
        List<Reservation> expiredWaitlistReservations = reservationRepository.findExpiredWaitlistReservations(now);
        if (expiredWaitlistReservations.isEmpty()) {
            return;
        }

        log.info("Reconciling {} expired waitlist reservation(s) at {}", expiredWaitlistReservations.size(), now);
        for (Reservation reservation : expiredWaitlistReservations) {
            if (!Boolean.TRUE.equals(reservation.getEstEnAttente()) || reservation.getStatut() != ReservationStatus.PENDING) {
                continue;
            }

            if (hasCapturedFunds(reservation)) {
                forceFullRefund(reservation, WAITLIST_AUTO_REFUND_REASON);
                log.info("Automatically refunded waitlist reservation {} because the event has started", reservation.getId());
                continue;
            }

            markReservationCancelled(reservation, WAITLIST_AUTO_CLOSE_REASON);
            reservationRepository.save(reservation);
            log.info("Automatically closed unpaid waitlist reservation {} because the event has started", reservation.getId());
        }
    }

    @Override
    public void reconcileExpiredWaitlistOffers() {
        LocalDateTime now = LocalDateTime.now();
        List<Reservation> expiredOffers = reservationRepository.findExpiredWaitlistOffers(now);
        if (expiredOffers.isEmpty()) {
            return;
        }

        log.info("Reconciling {} expired waitlist seat offer(s) at {}", expiredOffers.size(), now);
        for (Reservation reservation : expiredOffers) {
            if (!isExpiredWaitlistSeatOffer(reservation, now)) {
                continue;
            }

            markReservationCancelled(reservation, WAITLIST_OFFER_EXPIRED_REASON);
            clearWaitlistSeatOffer(reservation);
            Reservation savedReservation = reservationRepository.save(reservation);
            userNotificationService.notifyWaitlistOfferExpired(savedReservation);
            processWaitlistToConfirmed(savedReservation.getEvent().getId());
        }
    }

    @Override
    public void dispatchUpcomingReservationReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<Reservation> reservations = reservationRepository.findUpcomingActiveReservationsWithDetails(now);
        if (reservations.isEmpty()) {
            return;
        }

        for (Reservation reservation : reservations) {
            if (!canReceiveUpcomingReminder(reservation, now)) {
                continue;
            }

            if (shouldSendSevenDayReminder(reservation, now)) {
                reservation.setReminderSevenDaysSentAt(now);
                Reservation savedReservation = reservationRepository.save(reservation);
                userNotificationService.notifyEventReminder(savedReservation, "7 days");
                continue;
            }

            if (shouldSendOneDayReminder(reservation, now)) {
                reservation.setReminderOneDaySentAt(now);
                Reservation savedReservation = reservationRepository.save(reservation);
                userNotificationService.notifyEventReminder(savedReservation, "1 day");
                continue;
            }

            if (shouldSendTwoHourReminder(reservation, now)) {
                reservation.setReminderTwoHoursSentAt(now);
                Reservation savedReservation = reservationRepository.save(reservation);
                userNotificationService.notifyEventReminder(savedReservation, "2 hours");
            }
        }
    }

    @Override
    public void requestPostEventFeedback() {
        LocalDateTime now = LocalDateTime.now();
        List<Reservation> reservations = reservationRepository.findAttendedReservationsAwaitingFeedback(now);
        if (reservations.isEmpty()) {
            return;
        }

        log.info("Dispatching {} post-event feedback request(s)", reservations.size());
        for (Reservation reservation : reservations) {
            reservation.setFeedbackRequestedAt(now);
            Reservation savedReservation = reservationRepository.save(reservation);
            userNotificationService.notifyFeedbackRequested(savedReservation);
        }
    }

    @Override
    @Transactional
    public List<ReservationResponseDTO> getEventWaitlist(Long eventId) {
        log.info("Fetching waitlist for event: {}", eventId);
        return reservationRepository.findWaitlistByEvent(eventId).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserOnWaitlist(Long userId, Long eventId) {
        Optional<Reservation> reservation = reservationRepository.findByUtilisateurAndEvent(userId, eventId);
        return reservation.isPresent() && reservation.get().getEstEnAttente();
    }

    // ============== QUERY OPERATIONS ==============

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getPendingReservations() {
        log.info("Fetching pending reservations for admin approval");
        return mapReservationsToResponseDTOs(reservationRepository.findByStatutWithDetails(ReservationStatus.PENDING));
    }

    @Override
    public List<ReservationResponseDTO> getUnpaidReservations() {
        log.info("Fetching unpaid reservations");
        return mapReservationsToResponseDTOs(
                reservationRepository.findByStatutPaiementNotWithDetails(PaymentStatus.PAID)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getRefundableReservations() {
        log.info("Fetching refundable reservations");
        return reservationRepository.findRefundableReservationsWithDetails().stream()
                .filter(this::hasCapturedFunds)
                .filter(reservation -> {
                    CancellationPolicyTier tier = buildCancellationPolicy(reservation).getTier();
                    return tier == CancellationPolicyTier.FULL_REFUND || tier == CancellationPolicyTier.PARTIAL_REFUND;
                })
                .map(reservation -> mapToResponseDTO(reservation, false))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Double calculateEventRevenue(Long eventId) {
        log.info("Calculating revenue for event: {}", eventId);
        return reservationRepository.findByEventId(eventId).stream()
                .map(this::calculateNetPaidAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .doubleValue();
    }

    @Override
    @Transactional(readOnly = true)
    public Long countConfirmedReservationsForEvent(Long eventId) {
        log.info("Counting confirmed reservations for event: {}", eventId);
        return reservationRepository.countConfirmedReservations(eventId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getUserCancelledReservations(Long userId) {
        log.info("Fetching cancelled reservations for user: {}", userId);
        return mapReservationsToResponseDTOs(reservationRepository.findUserCancelledReservationsWithDetails(userId));
    }

    private void notifyReservationCreated(Reservation reservation) {
        if (reservation == null) {
            return;
        }

        if (Boolean.TRUE.equals(reservation.getEstEnAttente())) {
            userNotificationService.notifyWaitlistJoined(reservation);
            return;
        }

        if (resolveDisplayStatus(reservation) == ReservationStatus.CONFIRMED) {
            userNotificationService.notifyBookingConfirmed(reservation);
        }
    }

    private Utilisateur getUserOrThrow(Long userId) {
        return utilisateurRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }

    private Utilisateur getUserByEmailOrThrow(String email) {
        if (!StringUtils.hasText(email)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is missing");
        }

        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));
    }

    private Event getEventOrThrow(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + eventId));
    }

    private void validateEventBookingAvailability(Event event) {
        if (event == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
        }

        LocalDateTime now = LocalDateTime.now();
        EventStatus effectiveStatus = synchronizeEventLifecycleStatus(event, now);

        if (effectiveStatus == EventStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cancelled events cannot accept reservations");
        }

        if (effectiveStatus == EventStatus.COMPLETED
                || (event.getDateFin() != null && !event.getDateFin().isAfter(now))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This event has already finished");
        }

        if (event.getDateDebut() != null && !event.getDateDebut().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Reservations close once the event has started");
        }
    }

    private EventStatus synchronizeEventLifecycleStatus(Event event, LocalDateTime referenceTime) {
        if (event == null || event.getStatut() == null) {
            return null;
        }

        LocalDateTime effectiveReferenceTime = referenceTime != null ? referenceTime : LocalDateTime.now();
        EventStatus effectiveStatus = resolveEventLifecycleStatus(event, effectiveReferenceTime);
        if (effectiveStatus != null && effectiveStatus != event.getStatut()) {
            event.setStatut(effectiveStatus);
            event.setDateModification(effectiveReferenceTime);
            eventRepository.save(event);
        }

        return effectiveStatus;
    }

    private EventStatus resolveEventLifecycleStatus(Event event, LocalDateTime referenceTime) {
        if (event == null || event.getStatut() == null) {
            return null;
        }

        if (event.getStatut() == EventStatus.CANCELLED || event.getStatut() == EventStatus.COMPLETED) {
            return event.getStatut();
        }

        LocalDateTime effectiveReferenceTime = referenceTime != null ? referenceTime : LocalDateTime.now();
        if (event.getDateFin() != null && !event.getDateFin().isAfter(effectiveReferenceTime)) {
            return EventStatus.COMPLETED;
        }

        if (event.getDateDebut() != null && !event.getDateDebut().isAfter(effectiveReferenceTime)) {
            return EventStatus.ONGOING;
        }

        return event.getStatut();
    }

    private void validateParticipantsAgainstCapacity(Event event, Integer requestedParticipants) {
        if (requestedParticipants > event.getCapaciteMax()) {
            throw new RuntimeException("Requested participants (" + requestedParticipants
                    + ") exceeds event capacity (" + event.getCapaciteMax() + ")");
        }
    }

    private void validateActiveReservationConflict(Long userId, Long eventId, Long currentReservationId) {
        Optional<Reservation> existingReservation = reservationRepository.findByUtilisateurAndEvent(userId, eventId);
        if (existingReservation.isEmpty()) {
            return;
        }

        Reservation reservation = existingReservation.get();
        if (currentReservationId != null && reservation.getId().equals(currentReservationId)) {
            return;
        }

        if (isActiveReservationStatus(reservation.getStatut())) {
            throw new RuntimeException("User already has an active reservation for this event");
        }
    }

    private boolean shouldBeWaitlisted(Event event, Reservation currentReservation, Integer requestedParticipants) {
        return requestedParticipants > getEffectiveAvailableSeats(event, currentReservation);
    }

    private ReservationStatus resolveInitialReservationStatus(Event event, boolean isWaitlist) {
        if (isWaitlist || requiresReservationApproval(event)) {
            return ReservationStatus.PENDING;
        }

        return ReservationStatus.CONFIRMED;
    }

    private int getEffectiveAvailableSeats(Event event, Reservation currentReservation) {
        int availableSeats = event.getAvailableSeats();
        if (currentReservation == null) {
            return Math.max(0, availableSeats);
        }

        boolean sameEvent = currentReservation.getEvent() != null
                && currentReservation.getEvent().getId() != null
                && currentReservation.getEvent().getId().equals(event.getId());

        if (sameEvent && countsTowardCapacity(currentReservation)) {
            availableSeats += currentReservation.getNombreParticipants();
        }

        return Math.max(0, availableSeats);
    }

    private boolean countsTowardCapacity(Reservation reservation) {
        return reservation.getStatut() == ReservationStatus.CONFIRMED
                || reservation.getStatut() == ReservationStatus.PAID
                || reservation.getStatut() == ReservationStatus.ATTENDED;
    }

    private boolean requiresReservationApproval(Event event) {
        return event == null || !Boolean.FALSE.equals(event.getReservationApprovalRequired());
    }

    private boolean isActiveReservationStatus(ReservationStatus status) {
        return status == ReservationStatus.PENDING
                || status == ReservationStatus.CONFIRMED
                || status == ReservationStatus.PAID;
    }

    private boolean isEditableStatus(ReservationStatus status) {
        return status == ReservationStatus.PENDING || status == ReservationStatus.CONFIRMED;
    }

    private boolean isCancellableStatus(ReservationStatus status) {
        return status == ReservationStatus.PENDING
                || status == ReservationStatus.CONFIRMED
                || status == ReservationStatus.PAID;
    }

    private ReservationStatus resolveSeatPromotionStatus(Reservation reservation) {
        return ReservationStatus.CONFIRMED;
    }

    private LocalDateTime resolveWaitlistOfferExpiry(Reservation reservation, LocalDateTime offeredAt) {
        LocalDateTime baseTime = offeredAt != null ? offeredAt : LocalDateTime.now();
        LocalDateTime defaultExpiry = baseTime.plusHours(WAITLIST_SEAT_HOLD_HOURS);

        if (reservation == null || reservation.getEvent() == null || reservation.getEvent().getDateDebut() == null) {
            return defaultExpiry;
        }

        LocalDateTime eventStart = reservation.getEvent().getDateDebut();
        return eventStart.isBefore(defaultExpiry) ? eventStart : defaultExpiry;
    }

    private void clearWaitlistSeatOffer(Reservation reservation) {
        if (reservation == null) {
            return;
        }

        reservation.setWaitlistOfferedAt(null);
        reservation.setWaitlistOfferExpiresAt(null);
    }

    private boolean isWaitlistSeatOfferActive(Reservation reservation, LocalDateTime referenceTime) {
        if (reservation == null) {
            return false;
        }

        if (Boolean.TRUE.equals(reservation.getEstEnAttente()) || hasCapturedFunds(reservation)) {
            return false;
        }

        if (reservation.getWaitlistOfferExpiresAt() == null) {
            return false;
        }

        LocalDateTime effectiveReferenceTime = referenceTime != null ? referenceTime : LocalDateTime.now();
        return reservation.getStatut() == ReservationStatus.CONFIRMED
                && reservation.getWaitlistOfferExpiresAt().isAfter(effectiveReferenceTime);
    }

    private boolean isExpiredWaitlistSeatOffer(Reservation reservation, LocalDateTime referenceTime) {
        if (reservation == null
                || Boolean.TRUE.equals(reservation.getEstEnAttente())
                || hasCapturedFunds(reservation)
                || reservation.getWaitlistOfferExpiresAt() == null) {
            return false;
        }

        LocalDateTime effectiveReferenceTime = referenceTime != null ? referenceTime : LocalDateTime.now();
        return reservation.getStatut() == ReservationStatus.CONFIRMED
                && !reservation.getWaitlistOfferExpiresAt().isAfter(effectiveReferenceTime);
    }

    private void validateAttendanceRecordingEligibility(Reservation reservation) {
        String attendanceBlockReason = getAttendanceRecordingBlockReason(reservation);
        if (attendanceBlockReason == null) {
            return;
        }

        throw new ResponseStatusException(
                reservation == null ? HttpStatus.NOT_FOUND : HttpStatus.CONFLICT,
                attendanceBlockReason
        );
    }

    private void validateNoShowRecordingEligibility(Reservation reservation) {
        String noShowBlockReason = getNoShowRecordingBlockReason(reservation);
        if (noShowBlockReason == null) {
            return;
        }

        throw new ResponseStatusException(
                reservation == null ? HttpStatus.NOT_FOUND : HttpStatus.CONFLICT,
                noShowBlockReason
        );
    }

    private boolean isAttendanceRecordable(Reservation reservation) {
        return getAttendanceRecordingBlockReason(reservation) == null;
    }

    private String getAttendanceRecordingBlockReason(Reservation reservation) {
        if (reservation == null) {
            return "Reservation not found";
        }

        ReservationStatus status = reservation.getStatut();
        if (status != ReservationStatus.CONFIRMED && status != ReservationStatus.PAID) {
            return "Only approved reservations can be marked as attended or no-show";
        }

        if (Boolean.TRUE.equals(reservation.getEstEnAttente())) {
            return "Waitlist reservations cannot be marked as attended or no-show";
        }

        Event event = reservation.getEvent();
        if (event == null || event.getDateDebut() == null) {
            return "Attendance can only be recorded for reservations linked to a scheduled event";
        }

        if (LocalDateTime.now().isBefore(event.getDateDebut())) {
            return "Attendance can only be recorded on or after the event start time";
        }

        return null;
    }

    private String getNoShowRecordingBlockReason(Reservation reservation) {
        if (reservation == null) {
            return "Reservation not found";
        }

        ReservationStatus status = reservation.getStatut();
        if (status != ReservationStatus.CONFIRMED && status != ReservationStatus.PAID) {
            return "Only approved reservations can be marked as attended or no-show";
        }

        if (Boolean.TRUE.equals(reservation.getEstEnAttente())) {
            return "Waitlist reservations cannot be marked as attended or no-show";
        }

        Event event = reservation.getEvent();
        if (event == null || event.getDateFin() == null) {
            return "No-show can only be recorded after the event has finished";
        }

        if (LocalDateTime.now().isBefore(event.getDateFin())) {
            return "No-show can only be recorded after the event has finished";
        }

        return null;
    }

    private boolean canReceiveUpcomingReminder(Reservation reservation, LocalDateTime now) {
        if (reservation == null || reservation.getEvent() == null || reservation.getEvent().getDateDebut() == null) {
            return false;
        }

        if (Boolean.TRUE.equals(reservation.getEstEnAttente())) {
            return false;
        }

        if (reservation.getStatut() == ReservationStatus.CANCELLED
                || reservation.getStatut() == ReservationStatus.REFUNDED
                || reservation.getStatut() == ReservationStatus.NO_SHOW
                || reservation.getStatut() == ReservationStatus.ATTENDED) {
            return false;
        }

        if (isWaitlistSeatOfferActive(reservation, now) && reservation.getStatutPaiement() != PaymentStatus.PAID) {
            return false;
        }

        return reservation.getEvent().getDateDebut().isAfter(now);
    }

    private boolean shouldSendSevenDayReminder(Reservation reservation, LocalDateTime now) {
        LocalDateTime eventStart = reservation.getEvent().getDateDebut();
        return reservation.getReminderSevenDaysSentAt() == null
                && !now.isBefore(eventStart.minusDays(7))
                && now.isBefore(eventStart.minusDays(1));
    }

    private boolean shouldSendOneDayReminder(Reservation reservation, LocalDateTime now) {
        LocalDateTime eventStart = reservation.getEvent().getDateDebut();
        return reservation.getReminderOneDaySentAt() == null
                && !now.isBefore(eventStart.minusDays(1))
                && now.isBefore(eventStart.minusHours(2));
    }

    private boolean shouldSendTwoHourReminder(Reservation reservation, LocalDateTime now) {
        LocalDateTime eventStart = reservation.getEvent().getDateDebut();
        return reservation.getReminderTwoHoursSentAt() == null
                && !now.isBefore(eventStart.minusHours(2))
                && now.isBefore(eventStart);
    }

    private void validateFeedbackEligibility(Reservation reservation) {
        if (reservation == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found");
        }

        if (reservation.getStatut() != ReservationStatus.ATTENDED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Feedback can only be submitted after the organizer marks the reservation as attended"
            );
        }

        Event event = reservation.getEvent();
        if (event == null || event.getDateFin() == null || event.getDateFin().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Feedback opens only after the event has finished"
            );
        }
    }

    private void applyAutomatedCancellationPolicy(
            Reservation reservation,
            ReservationCancellationPolicyDTO cancellationPolicy,
            String reason
    ) {
        if (!StringUtils.hasText(reservation.getTransactionId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Reservation is missing the Stripe payment transaction needed for refund"
            );
        }

        CancellationPolicyTier tier = cancellationPolicy.getTier();
        if (tier == CancellationPolicyTier.FULL_REFUND) {
            applyRefundOutcome(
                    reservation,
                    cancellationPolicy.getEligibleRefundAmount(),
                    cancellationPolicy.getEligibleRefundPercentage(),
                    reason,
                    true
            );
            return;
        }

        if (tier == CancellationPolicyTier.PARTIAL_REFUND) {
            applyRefundOutcome(
                    reservation,
                    cancellationPolicy.getEligibleRefundAmount(),
                    cancellationPolicy.getEligibleRefundPercentage(),
                    reason,
                    false
            );
            return;
        }

        if (tier == CancellationPolicyTier.NO_REFUND) {
            markReservationCancelled(reservation, reason);
            reservation.setRefundAmount(BigDecimal.ZERO);
            reservation.setRefundPercentage(0);
            reservationRepository.save(reservation);
            return;
        }

        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                cancellationPolicy.getDescription()
        );
    }

    private Reservation applyRefundOutcome(
            Reservation reservation,
            BigDecimal refundAmount,
            Integer refundPercentage,
            String reason,
            boolean fullRefund
    ) {
        BigDecimal safeRefundAmount = refundAmount != null ? refundAmount : BigDecimal.ZERO;
        if (safeRefundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This reservation is not eligible for a Stripe refund");
        }

        stripeGatewayService.createRefund(reservation.getTransactionId(), safeRefundAmount);

        LocalDateTime now = LocalDateTime.now();
        reservation.setEstEnAttente(false);
        clearWaitlistSeatOffer(reservation);
        reservation.setCancelledAt(now);
        reservation.setRefundedAt(now);
        reservation.setCancellationReason(StringUtils.hasText(reason) ? reason.trim() : null);
        reservation.setRefundAmount(safeRefundAmount);
        reservation.setRefundPercentage(refundPercentage != null ? refundPercentage : 0);
        reservation.setDateModification(now);

        if (fullRefund) {
            reservation.setStatutPaiement(PaymentStatus.REFUNDED);
            reservation.setStatut(ReservationStatus.REFUNDED);
        } else {
            reservation.setStatutPaiement(PaymentStatus.PARTIALLY_REFUNDED);
            reservation.setStatut(ReservationStatus.CANCELLED);
        }

        Reservation savedReservation = reservationRepository.save(reservation);
        userNotificationService.notifyRefundProcessed(savedReservation);
        return savedReservation;
    }

    private Reservation forceFullRefund(Reservation reservation, String reason) {
        if (!hasCapturedFunds(reservation)) {
            return reservation;
        }

        if (!StringUtils.hasText(reservation.getTransactionId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Reservation is missing the Stripe payment transaction needed for refund"
            );
        }

        return applyRefundOutcome(reservation, calculateRefundableBaseAmount(reservation), 100, reason, true);
    }

    private void markReservationCancelled(Reservation reservation, String reason) {
        LocalDateTime now = LocalDateTime.now();
        reservation.setEstEnAttente(false);
        clearWaitlistSeatOffer(reservation);
        reservation.setCancelledAt(now);
        reservation.setCancellationReason(StringUtils.hasText(reason) ? reason.trim() : null);
        reservation.setStatut(ReservationStatus.CANCELLED);
        reservation.setDateModification(now);
    }

    private ReservationCancellationPolicyDTO buildCancellationPolicy(Reservation reservation) {
        ReservationCancellationPolicyDTO dto = new ReservationCancellationPolicyDTO();
        LocalDateTime eventStart = reservation.getEvent() != null ? reservation.getEvent().getDateDebut() : null;
        LocalDateTime now = LocalDateTime.now();

        dto.setFullRefundDeadline(eventStart != null ? eventStart.minusHours(FULL_REFUND_WINDOW_HOURS) : null);
        dto.setPartialRefundDeadline(eventStart != null ? eventStart.minusHours(PARTIAL_REFUND_WINDOW_HOURS) : null);
        dto.setEligibleRefundAmount(BigDecimal.ZERO);
        dto.setEligibleRefundPercentage(0);
        dto.setCanCancel(false);

        if (!isCancellableStatus(reservation.getStatut())) {
            dto.setTier(CancellationPolicyTier.CLOSED);
            dto.setTitle("Reservation already closed");
            dto.setDescription("This reservation has already been closed, so the cancellation policy no longer applies.");
            return dto;
        }

        if (eventStart == null) {
            dto.setTier(CancellationPolicyTier.CLOSED);
            dto.setTitle("Event schedule unavailable");
            dto.setDescription("The event start date is unavailable, so CampConnect cannot evaluate the cancellation window.");
            return dto;
        }

        if (!eventStart.isAfter(now)) {
            dto.setTier(CancellationPolicyTier.CLOSED);
            dto.setTitle("Event already started");
            dto.setDescription("Cancellations close when the event starts, so this reservation can no longer be cancelled.");
            return dto;
        }

        dto.setCanCancel(true);

        if (Boolean.TRUE.equals(reservation.getEstEnAttente()) && hasCapturedFunds(reservation)) {
            BigDecimal refundableBaseAmount = calculateRefundableBaseAmount(reservation);
            dto.setTier(CancellationPolicyTier.FULL_REFUND);
            dto.setTitle("Full refund while waitlisted");
            dto.setDescription("This booking is still on the waitlist. If you cancel before the event starts, CampConnect returns the full Stripe payment. If no seat opens, the refund is processed automatically when the event begins.");
            dto.setEligibleRefundAmount(refundableBaseAmount);
            dto.setEligibleRefundPercentage(100);
            return dto;
        }

        if (!hasCapturedFunds(reservation)) {
            dto.setTier(CancellationPolicyTier.FREE_CANCEL);
            dto.setTitle("Cancel before the event starts");
            dto.setDescription("No payment has been captured yet. You can cancel this reservation before the event begins, and the seat is released immediately.");
            return dto;
        }

        LocalDateTime fullRefundDeadline = dto.getFullRefundDeadline();
        LocalDateTime partialRefundDeadline = dto.getPartialRefundDeadline();
        BigDecimal refundableBaseAmount = calculateRefundableBaseAmount(reservation);

        if (fullRefundDeadline != null && !now.isAfter(fullRefundDeadline)) {
            dto.setTier(CancellationPolicyTier.FULL_REFUND);
            dto.setTitle("Full refund available");
            dto.setDescription("Cancel at least 48 hours before the event start to receive a full Stripe refund, and the seat goes back to inventory right away.");
            dto.setEligibleRefundAmount(refundableBaseAmount);
            dto.setEligibleRefundPercentage(100);
            return dto;
        }

        if (partialRefundDeadline != null && !now.isAfter(partialRefundDeadline)) {
            dto.setTier(CancellationPolicyTier.PARTIAL_REFUND);
            dto.setTitle("Partial refund window");
            dto.setDescription("Cancel between 24 and 48 hours before the event start to receive a 50% Stripe refund while the released seat becomes available again.");
            dto.setEligibleRefundAmount(calculatePartialRefundAmount(refundableBaseAmount));
            dto.setEligibleRefundPercentage(50);
            return dto;
        }

        dto.setTier(CancellationPolicyTier.NO_REFUND);
        dto.setTitle("Cancellation remains open");
        dto.setDescription("You can still cancel before the event starts, but refunds close inside the final 24 hours even though the seat is released immediately.");
        return dto;
    }

    private boolean hasCapturedFunds(Reservation reservation) {
        return reservation.getStatutPaiement() == PaymentStatus.PAID
                || reservation.getStatutPaiement() == PaymentStatus.PARTIALLY_REFUNDED
                || reservation.getStatutPaiement() == PaymentStatus.REFUNDED;
    }

    private boolean isReceiptAvailable(Reservation reservation) {
        return hasCapturedFunds(reservation)
                || StringUtils.hasText(reservation.getInvoiceHostedUrl())
                || StringUtils.hasText(reservation.getInvoicePdfUrl());
    }

    private BigDecimal calculateRefundableBaseAmount(Reservation reservation) {
        if (!hasCapturedFunds(reservation)) {
            return BigDecimal.ZERO;
        }

        return calculateNetPaidAmount(reservation);
    }

    private BigDecimal calculatePartialRefundAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        return amount.multiply(PARTIAL_REFUND_RATE).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateNetPaidAmount(Reservation reservation) {
        if (!hasCapturedFunds(reservation)) {
            return BigDecimal.ZERO;
        }

        BigDecimal chargedAmount = reservation.getPrixTotal() != null ? reservation.getPrixTotal() : BigDecimal.ZERO;
        BigDecimal refundedAmount = getEffectiveRefundAmount(reservation);
        return chargedAmount.subtract(refundedAmount).max(BigDecimal.ZERO);
    }

    private BigDecimal getEffectiveRefundAmount(Reservation reservation) {
        BigDecimal recordedRefundAmount = reservation.getRefundAmount() != null
                ? reservation.getRefundAmount()
                : BigDecimal.ZERO;

        if (recordedRefundAmount.compareTo(BigDecimal.ZERO) > 0) {
            return recordedRefundAmount;
        }

        if (reservation.getStatutPaiement() == PaymentStatus.REFUNDED) {
            return reservation.getPrixTotal() != null ? reservation.getPrixTotal() : BigDecimal.ZERO;
        }

        if (reservation.getStatutPaiement() == PaymentStatus.PARTIALLY_REFUNDED) {
            return calculatePartialRefundAmount(reservation.getPrixTotal());
        }

        return BigDecimal.ZERO;
    }

    private boolean isUpcomingActiveReservation(Reservation reservation) {
        return reservation.getEvent() != null
                && reservation.getEvent().getDateDebut() != null
                && reservation.getEvent().getDateDebut().isAfter(LocalDateTime.now())
                && reservation.getStatut() != ReservationStatus.CANCELLED
                && reservation.getStatut() != ReservationStatus.REFUNDED
                && reservation.getStatut() != ReservationStatus.NO_SHOW;
    }

    private boolean hasEventCompleted(Reservation reservation, LocalDateTime now) {
        return reservation.getEvent() != null
                && reservation.getEvent().getDateFin() != null
                && reservation.getEvent().getDateFin().isBefore(now);
    }

    private boolean countsAsAttendedEvent(Reservation reservation) {
        return reservation.getStatut() == ReservationStatus.ATTENDED;
    }

    private boolean isFeedbackEligible(Reservation reservation) {
        if (reservation == null || reservation.getStatut() != ReservationStatus.ATTENDED) {
            return false;
        }

        if (reservation.getFeedbackSubmittedAt() != null) {
            return false;
        }

        return reservation.getEvent() != null
                && reservation.getEvent().getDateFin() != null
                && !reservation.getEvent().getDateFin().isAfter(LocalDateTime.now());
    }

    private Reservation persistAttendanceRecordedReservation(Reservation reservation, LocalDateTime referenceTime) {
        LocalDateTime effectiveReferenceTime = referenceTime != null ? referenceTime : LocalDateTime.now();
        boolean requestFeedbackImmediately = shouldRequestFeedbackImmediately(reservation, effectiveReferenceTime);

        reservation.setStatut(ReservationStatus.ATTENDED);
        reservation.setEstEnAttente(false);
        clearWaitlistSeatOffer(reservation);
        if (requestFeedbackImmediately) {
            reservation.setFeedbackRequestedAt(effectiveReferenceTime);
        }
        reservation.setDateModification(effectiveReferenceTime);

        Reservation savedReservation = reservationRepository.save(reservation);
        if (requestFeedbackImmediately) {
            userNotificationService.notifyFeedbackRequested(savedReservation);
        }

        return savedReservation;
    }

    private boolean shouldRequestFeedbackImmediately(Reservation reservation, LocalDateTime referenceTime) {
        if (reservation == null || reservation.getFeedbackSubmittedAt() != null || reservation.getFeedbackRequestedAt() != null) {
            return false;
        }

        Event event = reservation.getEvent();
        return event != null
                && event.getDateFin() != null
                && !event.getDateFin().isAfter(referenceTime != null ? referenceTime : LocalDateTime.now());
    }

    private boolean countsTowardFavoriteCategory(Reservation reservation) {
        return reservation.getEvent() != null
                && reservation.getEvent().getCategorie() != null
                && reservation.getStatut() != ReservationStatus.CANCELLED
                && reservation.getStatut() != ReservationStatus.REFUNDED
                && reservation.getStatut() != ReservationStatus.NO_SHOW;
    }

    private String formatCategoryLabel(String rawCategory) {
        if (!StringUtils.hasText(rawCategory)) {
            return "No bookings yet";
        }

        return java.util.Arrays.stream(rawCategory.toLowerCase().split("_"))
                .map(segment -> segment.isEmpty() ? segment : Character.toUpperCase(segment.charAt(0)) + segment.substring(1))
                .collect(Collectors.joining(" "));
    }

    private void validatePaymentAccess(Reservation reservation, String requesterEmail, boolean requesterIsAdmin) {
        validateReservationAccess(reservation, requesterEmail, requesterIsAdmin);
    }

    private void validateAttendanceManagementAccess(Reservation reservation, String requesterEmail, boolean requesterIsAdmin) {
        validateAttendanceManagementAccess(reservation != null ? reservation.getEvent() : null, requesterEmail, requesterIsAdmin);
    }

    private void validateAttendanceManagementAccess(Event event, String requesterEmail, boolean requesterIsAdmin) {
        if (requesterIsAdmin) {
            return;
        }

        Utilisateur requester = getUserByEmailOrThrow(requesterEmail);
        boolean isOrganizer = event != null
                && event.getOrganizer() != null
                && event.getOrganizer().getId() != null
                && requester.getId() != null
                && event.getOrganizer().getId().equals(requester.getId());

        if (!isOrganizer || !hasEventManagementRole(requester)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to record attendance for this reservation"
            );
        }
    }

    private void validateReservationAccess(Reservation reservation, String requesterEmail, boolean requesterIsAdmin) {
        if (requesterIsAdmin) {
            return;
        }

        if (!StringUtils.hasText(requesterEmail)
                || reservation.getUtilisateur() == null
                || !requesterEmail.equalsIgnoreCase(reservation.getUtilisateur().getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to access this reservation"
            );
        }
    }

    private boolean hasEventManagementRole(Utilisateur requester) {
        return requester != null
                && requester.getRole() != null
                && (requester.getRole() == Role.ADMINISTRATEUR
                || requester.getRole() == Role.GERANT_RESTAU
                || requester.getRole() == Role.GUIDE);
    }

    private void validateStripePaymentEligibility(Reservation reservation) {
        if (reservation.getStatutPaiement() == PaymentStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Reservation is already paid");
        }

        if (reservation.getStatutPaiement() == PaymentStatus.REFUNDED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Refunded reservations cannot be paid again");
        }

        if (reservation.getStatutPaiement() == PaymentStatus.PARTIALLY_REFUNDED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Partially refunded reservations cannot be paid again");
        }

        boolean waitlistPaymentAllowed = Boolean.TRUE.equals(reservation.getEstEnAttente())
                && reservation.getStatut() == ReservationStatus.PENDING;

        boolean limitedSeatOfferAllowed = isWaitlistSeatOfferActive(reservation, LocalDateTime.now());

        if (reservation.getStatut() != ReservationStatus.CONFIRMED && !waitlistPaymentAllowed && !limitedSeatOfferAllowed) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only confirmed reservations or active waitlist reservations can be paid"
            );
        }

        if (reservation.getPrixTotal() == null || reservation.getPrixTotal().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reservation total must be greater than zero");
        }
    }

    private Session extractCheckoutSession(com.stripe.model.Event stripeEvent) {
        EventDataObjectDeserializer dataObjectDeserializer = stripeEvent.getDataObjectDeserializer();
        Optional<StripeObject> stripeObject = dataObjectDeserializer.getObject();

        if (stripeObject.isEmpty() || !(stripeObject.get() instanceof Session session)) {
            return null;
        }

        return session;
    }

    private Invoice extractInvoice(com.stripe.model.Event stripeEvent) {
        EventDataObjectDeserializer dataObjectDeserializer = stripeEvent.getDataObjectDeserializer();
        Optional<StripeObject> stripeObject = dataObjectDeserializer.getObject();

        if (stripeObject.isEmpty() || !(stripeObject.get() instanceof Invoice invoice)) {
            return null;
        }

        return invoice;
    }

    private Reservation resolveReservationFromStripeSession(Session session) {
        String reservationIdValue = null;

        if (session.getMetadata() != null) {
            reservationIdValue = session.getMetadata().get("reservationId");
        }

        if (!StringUtils.hasText(reservationIdValue)) {
            reservationIdValue = session.getClientReferenceId();
        }

        if (!StringUtils.hasText(reservationIdValue)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Stripe checkout session is missing reservation metadata"
            );
        }

        try {
            Long reservationId = Long.parseLong(reservationIdValue);
            return reservationRepository.findById(reservationId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Stripe checkout session contains an invalid reservation ID",
                    exception
            );
        }
    }

    private Reservation resolveReservationFromStripeInvoice(Invoice invoice) {
        String reservationIdValue = null;

        if (invoice.getMetadata() != null) {
            reservationIdValue = invoice.getMetadata().get("reservationId");
        }

        if (StringUtils.hasText(reservationIdValue)) {
            try {
                Long reservationId = Long.parseLong(reservationIdValue);
                return reservationRepository.findById(reservationId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
            } catch (NumberFormatException exception) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Stripe invoice contains an invalid reservation ID",
                        exception
                );
            }
        }

        if (StringUtils.hasText(invoice.getId())) {
            return reservationRepository.findByStripeInvoiceId(invoice.getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Reservation not found for Stripe invoice " + invoice.getId()
                    ));
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Stripe invoice is missing reservation metadata"
        );
    }

    private Reservation applySuccessfulStripePayment(Reservation reservation, Session session) {
        String transactionId = session.getPaymentIntent();

        if (!StringUtils.hasText(transactionId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Stripe did not return a payment transaction ID for this checkout session"
            );
        }

        if (reservation.getStatutPaiement() == PaymentStatus.REFUNDED || reservation.getStatut() == ReservationStatus.REFUNDED) {
            log.warn("Ignoring Stripe payment confirmation for already refunded reservation {}", reservation.getId());
            return reservation;
        }

        if (reservation.getStatutPaiement() == PaymentStatus.PAID
                && transactionId.equals(reservation.getTransactionId())) {
            return persistStripeInvoiceDetails(reservation, resolveInvoiceForSession(session));
        }

        reservation.setTransactionId(transactionId);
        reservation.setStatutPaiement(PaymentStatus.PAID);
        reservation.setDatePaiement(reservation.getDatePaiement() != null ? reservation.getDatePaiement() : LocalDateTime.now());
        reservation.setDateModification(LocalDateTime.now());
        clearWaitlistSeatOffer(reservation);

        if (reservation.getStatut() != ReservationStatus.CANCELLED && reservation.getStatut() != ReservationStatus.REFUNDED) {
            reservation.setStatut(resolvePostPaymentStatus(reservation));
        }

        Reservation updatedReservation = reservationRepository.save(reservation);
        updatedReservation = persistStripeInvoiceDetails(updatedReservation, resolveInvoiceForSession(session));
        log.info("Stripe payment confirmed for reservation {} with transaction {}", updatedReservation.getId(), transactionId);
        if (updatedReservation.getStatut() == ReservationStatus.CANCELLED) {
            log.warn("Reservation {} was cancelled before Stripe payment confirmation. Triggering immediate refund.", updatedReservation.getId());
            Reservation refundedReservation = forceFullRefund(updatedReservation, "Reservation cancelled before payment confirmation");
            return reservationRepository.findById(refundedReservation.getId()).orElse(refundedReservation);
        }

        userNotificationService.notifyPaymentConfirmed(updatedReservation);

        return updatedReservation;

    }

    private ReservationStatus resolvePostPaymentStatus(Reservation reservation) {
        if (reservation != null && Boolean.TRUE.equals(reservation.getEstEnAttente())) {
            return ReservationStatus.PENDING;
        }

        return ReservationStatus.CONFIRMED;
    }

    private void handleCheckoutSessionCompletedWebhook(com.stripe.model.Event stripeEvent) {
        Session session = extractCheckoutSession(stripeEvent);
        if (session == null) {
            log.warn("Stripe checkout.session.completed webhook did not contain a session payload");
            return;
        }

        if (!"paid".equalsIgnoreCase(session.getPaymentStatus())) {
            log.info("Stripe checkout session {} completed without paid status: {}", session.getId(), session.getPaymentStatus());
            return;
        }

        Session enrichedSession = StringUtils.hasText(session.getId())
                ? stripeGatewayService.retrieveCheckoutSession(session.getId())
                : session;

        Reservation reservation = resolveReservationFromStripeSession(enrichedSession);
        applySuccessfulStripePayment(reservation, enrichedSession);
    }

    private void handleInvoicePaidWebhook(com.stripe.model.Event stripeEvent) {
        Invoice invoice = extractInvoice(stripeEvent);
        if (invoice == null) {
            log.warn("Stripe invoice.paid webhook did not contain an invoice payload");
            return;
        }

        Reservation reservation = resolveReservationFromStripeInvoice(invoice);
        persistStripeInvoiceDetails(reservation, invoice);
        log.info("Stripe invoice details synchronized for reservation {} from invoice {}", reservation.getId(), invoice.getId());
    }

    private Invoice resolveInvoiceForSession(Session session) {
        if (session == null) {
            return null;
        }

        if (session.getInvoiceObject() != null) {
            return session.getInvoiceObject();
        }

        if (StringUtils.hasText(session.getInvoice())) {
            return stripeGatewayService.retrieveInvoice(session.getInvoice());
        }

        return null;
    }

    private Reservation persistStripeInvoiceDetails(Reservation reservation, Invoice invoice) {
        if (reservation == null || invoice == null) {
            return reservation;
        }

        boolean updated = false;

        if (hasChanged(reservation.getStripeInvoiceId(), invoice.getId())) {
            reservation.setStripeInvoiceId(invoice.getId());
            updated = true;
        }

        if (hasChanged(reservation.getStripeInvoiceNumber(), invoice.getNumber())) {
            reservation.setStripeInvoiceNumber(invoice.getNumber());
            updated = true;
        }

        if (hasChanged(reservation.getInvoiceHostedUrl(), invoice.getHostedInvoiceUrl())) {
            reservation.setInvoiceHostedUrl(invoice.getHostedInvoiceUrl());
            updated = true;
        }

        if (hasChanged(reservation.getInvoicePdfUrl(), invoice.getInvoicePdf())) {
            reservation.setInvoicePdfUrl(invoice.getInvoicePdf());
            updated = true;
        }

        if (!updated) {
            return reservation;
        }

        reservation.setDateModification(LocalDateTime.now());
        return reservationRepository.save(reservation);
    }

    private boolean hasChanged(String currentValue, String nextValue) {
        return StringUtils.hasText(nextValue) && !nextValue.equals(currentValue);
    }

    private ReservationResponseDTO mapToResponseDTO(Reservation reservation) {
        return mapToResponseDTO(reservation, true);
    }

    private List<ReservationResponseDTO> mapReservationsToResponseDTOs(List<Reservation> reservations) {
        return reservations.stream()
                .map(reservation -> mapToResponseDTO(reservation, false))
                .collect(Collectors.toList());
    }

    private ReservationResponseDTO mapToResponseDTO(Reservation reservation, boolean hydrateInvoiceDetails) {
        Reservation effectiveReservation = hydrateInvoiceDetails
                ? hydrateInvoiceDetailsForResponse(reservation)
                : reservation;
        ReservationStatus displayStatus = resolveDisplayStatus(effectiveReservation);
        ReservationResponseDTO dto = new ReservationResponseDTO();
        dto.setId(effectiveReservation.getId());

        if (effectiveReservation.getUtilisateur() != null) {
            dto.setUtilisateurId(effectiveReservation.getUtilisateur().getId());
            dto.setUtilisateurNom(effectiveReservation.getUtilisateur().getNom());
            dto.setUtilisateurEmail(effectiveReservation.getUtilisateur().getEmail());
        }

        if (effectiveReservation.getEvent() != null) {
            dto.setEventId(effectiveReservation.getEvent().getId());
            dto.setEventTitre(effectiveReservation.getEvent().getTitre());
            dto.setEventDateDebut(effectiveReservation.getEvent().getDateDebut());
            dto.setEventDateFin(effectiveReservation.getEvent().getDateFin());
            dto.setEventLieu(effectiveReservation.getEvent().getLieu());
        }

        dto.setStatut(displayStatus);
        dto.setStatusDescription(buildStatusDescription(effectiveReservation));
        dto.setNextStepMessage(buildNextStepMessage(effectiveReservation));
        dto.setNombreParticipants(effectiveReservation.getNombreParticipants());
        dto.setBasePriceTotal(effectiveReservation.getBasePriceTotal());
        dto.setDiscountAmount(effectiveReservation.getDiscountAmount());
        dto.setPromoCode(effectiveReservation.getPromoCode());
        dto.setDiscountLabel(effectiveReservation.getDiscountLabel());
        dto.setDiscountAutoApplied(effectiveReservation.getDiscountAutoApplied());
        dto.setPrixTotal(effectiveReservation.getPrixTotal());
        dto.setEstEnAttente(effectiveReservation.getEstEnAttente());
        dto.setStatutPaiement(effectiveReservation.getStatutPaiement());
        dto.setRemarques(effectiveReservation.getRemarques());
        dto.setDateCreation(effectiveReservation.getDateCreation());
        dto.setDateModification(effectiveReservation.getDateModification());
        dto.setDatePaiement(effectiveReservation.getDatePaiement());
        dto.setTransactionId(effectiveReservation.getTransactionId());
        dto.setInvoiceId(effectiveReservation.getStripeInvoiceId());
        dto.setInvoiceNumber(effectiveReservation.getStripeInvoiceNumber());
        dto.setInvoiceHostedUrl(effectiveReservation.getInvoiceHostedUrl());
        dto.setInvoicePdfUrl(effectiveReservation.getInvoicePdfUrl());
        dto.setRefundAmount(getEffectiveRefundAmount(effectiveReservation));
        dto.setRefundPercentage(effectiveReservation.getRefundPercentage());
        dto.setNetPaidAmount(calculateNetPaidAmount(effectiveReservation));
        dto.setCancelledAt(effectiveReservation.getCancelledAt());
        dto.setRefundedAt(effectiveReservation.getRefundedAt());
        dto.setCancellationReason(effectiveReservation.getCancellationReason());
        dto.setWaitlistOfferedAt(effectiveReservation.getWaitlistOfferedAt());
        dto.setWaitlistOfferExpiresAt(effectiveReservation.getWaitlistOfferExpiresAt());
        dto.setWaitlistOfferActive(isWaitlistSeatOfferActive(effectiveReservation, LocalDateTime.now()));
        dto.setReceiptAvailable(isReceiptAvailable(effectiveReservation));
        dto.setCancellationPolicy(buildCancellationPolicy(effectiveReservation));
        boolean calendarExportAvailable = reservationCalendarService.isCalendarExportAvailable(effectiveReservation);
        dto.setCalendarExportAvailable(calendarExportAvailable);
        dto.setGoogleCalendarUrl(calendarExportAvailable ? reservationCalendarService.buildGoogleCalendarUrl(effectiveReservation) : null);
        dto.setCalendarIcsDownloadUrl(calendarExportAvailable ? reservationCalendarService.buildIcsDownloadUrl(effectiveReservation.getId()) : null);
        dto.setCalendarIcsFileName(calendarExportAvailable ? reservationCalendarService.buildSuggestedFilename(effectiveReservation) : null);
        dto.setAttendanceRecordable(isAttendanceRecordable(effectiveReservation));
        dto.setFeedbackRating(effectiveReservation.getFeedbackRating());
        dto.setFeedbackComment(effectiveReservation.getFeedbackComment());
        dto.setFeedbackSubmittedAt(effectiveReservation.getFeedbackSubmittedAt());
        dto.setFeedbackEligible(isFeedbackEligible(effectiveReservation));

        return dto;
    }

    private String buildStatusDescription(Reservation reservation) {
        if (reservation == null) {
            return null;
        }

        ReservationStatus displayStatus = resolveDisplayStatus(reservation);
        if (displayStatus == null) {
            return null;
        }
        if (Boolean.TRUE.equals(reservation.getEstEnAttente()) && displayStatus == ReservationStatus.PENDING) {
            return "Waitlist request received";
        }

        if (isWaitlistSeatOfferActive(reservation, LocalDateTime.now())) {
            return "Seat offered from the waitlist";
        }

        return switch (displayStatus) {
            case PENDING -> "Reservation pending review";
            case CONFIRMED -> reservation.getStatutPaiement() == PaymentStatus.PAID
                    ? "Reservation confirmed and fully paid"
                    : "Reservation confirmed";
            case PAID -> "Reservation confirmed and fully paid";
            case ATTENDED -> "Checked in by organizer";
            case NO_SHOW -> "Marked as no-show by organizer";
            case CANCELLED -> "Reservation cancelled";
            case REFUNDED -> "Reservation refunded";
        };
    }

    private String buildNextStepMessage(Reservation reservation) {
        if (reservation == null) {
            return null;
        }

        ReservationStatus displayStatus = resolveDisplayStatus(reservation);
        if (displayStatus == null) {
            return null;
        }
        String eventStartLabel = formatReservationDateTime(
                reservation.getEvent() != null ? reservation.getEvent().getDateDebut() : null
        );

        if (Boolean.TRUE.equals(reservation.getEstEnAttente()) && displayStatus == ReservationStatus.PENDING) {
            return hasCapturedFunds(reservation)
                    ? "Your waitlist payment is secured. If a seat opens before the event starts, CampConnect promotes this reservation automatically; otherwise the full payment is refunded when the event starts."
                    : "This reservation is still waiting for a seat to open. If payment is required for the waitlist, complete it before the event starts to keep your place in line.";
        }

        if (isWaitlistSeatOfferActive(reservation, LocalDateTime.now())) {
            return StringUtils.hasText(formatReservationDateTime(reservation.getWaitlistOfferExpiresAt()))
                    ? "A seat opened for you from the waitlist. Complete payment by "
                    + formatReservationDateTime(reservation.getWaitlistOfferExpiresAt())
                    + " or the spot will be released to the next guest automatically."
                    : "A seat opened for you from the waitlist. Complete payment soon to keep the booking.";
        }

        return switch (displayStatus) {
            case PENDING ->
                    "The organizer still needs to review this reservation. Once it is approved, you can finish the remaining payment steps.";
            case CONFIRMED -> reservation.getStatutPaiement() == PaymentStatus.PAID
                    ? StringUtils.hasText(eventStartLabel)
                            ? "Your booking is fully approved and paid. Bring this reservation with you on " + eventStartLabel + ". The organizer will record attended or no-show during check-in."
                            : "Your booking is fully approved and paid. Bring this reservation on event day. The organizer will record attended or no-show during check-in."
                    : StringUtils.hasText(eventStartLabel)
                            ? "Your spot is approved. Complete payment before " + eventStartLabel + " to fully secure the booking."
                            : "Your spot is approved. Complete payment before the event starts to fully secure the booking.";
            case PAID ->
                    StringUtils.hasText(eventStartLabel)
                            ? "Your booking is fully approved and paid. Bring this reservation with you on " + eventStartLabel + ". The organizer will record attended or no-show during check-in."
                            : "Your booking is fully approved and paid. Bring this reservation on event day. The organizer will record attended or no-show during check-in.";
            case ATTENDED ->
                    isFeedbackEligible(reservation)
                            ? "Thanks for attending. You can now leave a quick rating and comment to help improve future events."
                            : hasCapturedFunds(reservation)
                            ? "The organizer marked this reservation as attended. Your receipt, invoice trail, and reservation history stay available here."
                            : "The organizer marked this reservation as attended. Your reservation history stays available here for reference.";
            case NO_SHOW ->
                    "The organizer marked this reservation as no-show. Contact the organizer if this status was recorded by mistake.";
            case CANCELLED ->
                    hasCapturedFunds(reservation)
                            ? "This reservation is closed. Any completed payment or refund trail stays available in the billing history."
                            : "This reservation is closed and no further action is required.";
            case REFUNDED ->
                    "The reservation is closed and the completed refund trail stays available in your billing history.";
        };
    }

    private ReservationStatus resolveDisplayStatus(Reservation reservation) {
        if (reservation == null || reservation.getStatut() == null) {
            return null;
        }

        if (reservation.getStatut() == ReservationStatus.PAID) {
            return Boolean.TRUE.equals(reservation.getEstEnAttente())
                    ? ReservationStatus.PENDING
                    : ReservationStatus.CONFIRMED;
        }

        return reservation.getStatut();
    }

    private String formatReservationDateTime(LocalDateTime value) {
        if (value == null) {
            return null;
        }

        return RESERVATION_TIMELINE_FORMATTER.format(value);
    }

    private Reservation hydrateInvoiceDetailsForResponse(Reservation reservation) {
        if (reservation == null) {
            return null;
        }

        if (!hasCapturedFunds(reservation)) {
            return reservation;
        }

        if (!StringUtils.hasText(reservation.getStripeInvoiceId())) {
            return reservation;
        }

        if (StringUtils.hasText(reservation.getInvoiceHostedUrl()) && StringUtils.hasText(reservation.getInvoicePdfUrl())) {
            return reservation;
        }

        Invoice invoice = stripeGatewayService.retrieveInvoice(reservation.getStripeInvoiceId());
        return persistStripeInvoiceDetails(reservation, invoice);
    }
}
