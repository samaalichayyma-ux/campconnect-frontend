package com.esprit.campconnect.Reservation.Repository;

import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.Reservation.Enum.PaymentStatus;
import com.esprit.campconnect.Reservation.Enum.ReservationStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // Find reservations by user
    List<Reservation> findByUtilisateurId(Long utilisateurId);

    // Find reservations by event
    List<Reservation> findByEventId(Long eventId);

    // Legacy compatibility for existing services
    List<Reservation> findByStatut(ReservationStatus statut);

    // Legacy compatibility for existing services
    List<Reservation> findByStatutPaiementNot(PaymentStatus statutPaiement);

    @EntityGraph(attributePaths = {"utilisateur", "event", "promotionOffer"})
    @Query("SELECT r FROM Reservation r")
    List<Reservation> findAllWithDetails();

    @EntityGraph(attributePaths = {"utilisateur", "event", "promotionOffer"})
    @Query("SELECT r FROM Reservation r WHERE r.utilisateur.id = :utilisateurId")
    List<Reservation> findByUtilisateurIdWithDetails(@Param("utilisateurId") Long utilisateurId);

    @EntityGraph(attributePaths = {"utilisateur", "event", "promotionOffer"})
    @Query("SELECT r FROM Reservation r WHERE r.event.id = :eventId")
    List<Reservation> findByEventIdWithDetails(@Param("eventId") Long eventId);

    @EntityGraph(attributePaths = {"utilisateur", "event", "promotionOffer"})
    @Query("SELECT r FROM Reservation r WHERE r.statut = :statut")
    List<Reservation> findByStatutWithDetails(@Param("statut") ReservationStatus statut);

    @EntityGraph(attributePaths = {"utilisateur", "event", "promotionOffer"})
    @Query("SELECT r FROM Reservation r WHERE r.id = :id")
    Optional<Reservation> findByIdWithDetails(@Param("id") Long id);

    // Find user's reservation for a specific event
    @Query("SELECT r FROM Reservation r WHERE r.utilisateur.id = :utilisateurId AND r.event.id = :eventId")
    Optional<Reservation> findByUtilisateurAndEvent(
            @Param("utilisateurId") Long utilisateurId,
            @Param("eventId") Long eventId
    );

    // Find all reservations for an event with specific status
    @Query("SELECT r FROM Reservation r WHERE r.event.id = :eventId AND r.statut = :statut")
    List<Reservation> findByEventAndStatus(
            @Param("eventId") Long eventId,
            @Param("statut") ReservationStatus statut
    );

    @EntityGraph(attributePaths = {"utilisateur", "event", "promotionOffer"})
    @Query("SELECT r FROM Reservation r WHERE r.statutPaiement <> :statutPaiement")
    List<Reservation> findByStatutPaiementNotWithDetails(@Param("statutPaiement") PaymentStatus statutPaiement);

    // Find waitlist reservations for specific event
    @Query("SELECT r FROM Reservation r WHERE r.event.id = :eventId AND r.estEnAttente = true AND r.statut = 'PENDING' ORDER BY r.dateCreation ASC")
    List<Reservation> findWaitlistByEvent(@Param("eventId") Long eventId);

    @Query("""
            SELECT r
            FROM Reservation r
            JOIN FETCH r.event e
            WHERE r.estEnAttente = true
              AND r.statut = 'PENDING'
              AND e.dateDebut <= :cutoff
            ORDER BY e.dateDebut ASC, r.dateCreation ASC
            """)
    List<Reservation> findExpiredWaitlistReservations(@Param("cutoff") LocalDateTime cutoff);

    @EntityGraph(attributePaths = {"utilisateur", "event", "promotionOffer"})
    @Query("""
            SELECT r
            FROM Reservation r
            WHERE r.waitlistOfferExpiresAt IS NOT NULL
              AND r.waitlistOfferExpiresAt <= :cutoff
              AND r.estEnAttente = false
              AND r.statut IN ('CONFIRMED', 'PENDING')
              AND r.statutPaiement NOT IN ('PAID', 'REFUNDED', 'PARTIALLY_REFUNDED')
            ORDER BY r.waitlistOfferExpiresAt ASC
            """)
    List<Reservation> findExpiredWaitlistOffers(@Param("cutoff") LocalDateTime cutoff);

    @EntityGraph(attributePaths = {"utilisateur", "event", "promotionOffer"})
    @Query("""
            SELECT r
            FROM Reservation r
            JOIN r.event e
            WHERE e.dateDebut > :now
              AND r.statut NOT IN ('CANCELLED', 'REFUNDED', 'NO_SHOW', 'ATTENDED')
            ORDER BY e.dateDebut ASC, r.dateCreation ASC
            """)
    List<Reservation> findUpcomingActiveReservationsWithDetails(@Param("now") LocalDateTime now);

    @EntityGraph(attributePaths = {"utilisateur", "event", "promotionOffer"})
    @Query("""
            SELECT r
            FROM Reservation r
            JOIN r.event e
            WHERE r.statut = 'ATTENDED'
              AND e.dateFin IS NOT NULL
              AND e.dateFin <= :cutoff
              AND r.feedbackSubmittedAt IS NULL
              AND r.feedbackRequestedAt IS NULL
            ORDER BY e.dateFin DESC
            """)
    List<Reservation> findAttendedReservationsAwaitingFeedback(@Param("cutoff") LocalDateTime cutoff);

    Optional<Reservation> findByTransactionId(String transactionId);

    Optional<Reservation> findByStripeInvoiceId(String stripeInvoiceId);

    long countByPromotionOfferId(Long promotionOfferId);

    @Modifying
    @Query("""
            UPDATE Reservation r
            SET r.promotionOffer = null
            WHERE r.promotionOffer.id = :promotionOfferId
            """)
    int clearPromotionOfferReferences(@Param("promotionOfferId") Long promotionOfferId);

    @Query("""
            SELECT r.promotionOffer.id AS promotionOfferId, COUNT(r.id) AS usageCount
            FROM Reservation r
            WHERE r.promotionOffer.id IN :promotionOfferIds
            GROUP BY r.promotionOffer.id
            """)
    List<PromotionUsageCountView> countPromotionUsages(@Param("promotionOfferIds") Collection<Long> promotionOfferIds);

    @Query("""
            SELECT r.event.id AS eventId,
                   COALESCE(SUM(CASE WHEN r.statut IN ('CONFIRMED', 'PAID', 'ATTENDED') THEN r.nombreParticipants ELSE 0 END), 0) AS confirmedParticipants,
                   COALESCE(SUM(CASE WHEN r.estEnAttente = true AND r.statut = 'PENDING' THEN r.nombreParticipants ELSE 0 END), 0) AS waitlistParticipants
            FROM Reservation r
            WHERE r.event.id IN :eventIds
            GROUP BY r.event.id
            """)
    List<EventReservationStatsView> summarizeParticipantsByEventIds(@Param("eventIds") Collection<Long> eventIds);

    @Query("""
            SELECT r.event.id AS eventId,
                   COALESCE(AVG(r.feedbackRating), 0D) AS averageRating,
                   COUNT(r.id) AS feedbackResponses
            FROM Reservation r
            WHERE r.event.id IN :eventIds
              AND r.statut = 'ATTENDED'
              AND r.feedbackRating IS NOT NULL
              AND r.feedbackSubmittedAt IS NOT NULL
            GROUP BY r.event.id
            """)
    List<EventFeedbackSummaryView> summarizeFeedbackByEventIds(@Param("eventIds") Collection<Long> eventIds);

    @EntityGraph(attributePaths = {"utilisateur"})
    @Query("""
            SELECT r
            FROM Reservation r
            WHERE r.event.id = :eventId
              AND r.statut = 'ATTENDED'
              AND r.feedbackRating IS NOT NULL
              AND r.feedbackSubmittedAt IS NOT NULL
            ORDER BY r.feedbackSubmittedAt DESC, r.id DESC
            """)
    List<Reservation> findSubmittedFeedbackByEventId(@Param("eventId") Long eventId);

    // Count confirmed/paid reservations for event
    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.event.id = :eventId AND r.statut IN ('CONFIRMED', 'PAID')")
    Long countConfirmedReservations(@Param("eventId") Long eventId);

    @EntityGraph(attributePaths = {"utilisateur", "event", "promotionOffer"})
    @Query("SELECT r FROM Reservation r WHERE r.utilisateur.id = :utilisateurId AND r.statut = 'CANCELLED'")
    List<Reservation> findUserCancelledReservationsWithDetails(@Param("utilisateurId") Long utilisateurId);

    default List<Reservation> findUserCancelledReservations(Long utilisateurId) {
        return findUserCancelledReservationsWithDetails(utilisateurId);
    }

    // Count total revenue for event
    @Query("SELECT COALESCE(SUM(r.prixTotal), 0) FROM Reservation r WHERE r.event.id = :eventId AND r.statutPaiement = 'PAID'")
    Double calculateEventRevenue(@Param("eventId") Long eventId);

    @EntityGraph(attributePaths = {"utilisateur", "event", "promotionOffer"})
    @Query("SELECT r FROM Reservation r WHERE r.statut IN ('CANCELLED', 'NO_SHOW') AND r.statutPaiement = 'PAID'")
    List<Reservation> findRefundableReservationsWithDetails();

    default List<Reservation> findRefundableReservations() {
        return findRefundableReservationsWithDetails();
    }

    interface PromotionUsageCountView {
        Long getPromotionOfferId();

        Long getUsageCount();
    }

    interface EventReservationStatsView {
        Long getEventId();

        Long getConfirmedParticipants();

        Long getWaitlistParticipants();
    }

    interface EventFeedbackSummaryView {
        Long getEventId();

        Double getAverageRating();

        Long getFeedbackResponses();
    }
}
