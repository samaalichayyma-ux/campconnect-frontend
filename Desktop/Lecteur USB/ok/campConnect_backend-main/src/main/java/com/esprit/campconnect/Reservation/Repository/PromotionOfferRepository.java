package com.esprit.campconnect.Reservation.Repository;

import com.esprit.campconnect.Reservation.Entity.PromotionOffer;
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
public interface PromotionOfferRepository extends JpaRepository<PromotionOffer, Long> {

    Optional<PromotionOffer> findByCodeIgnoreCase(String code);

    List<PromotionOffer> findByAutoApplyTrueAndActiveTrueOrderByDateCreationDesc();

    List<PromotionOffer> findByDiscoverableTrueAndActiveTrueOrderByAutoApplyDescDateCreationDesc();

    boolean existsByCodeIgnoreCase(String code);

    @Query(value = """
            SELECT poe.promotion_offer_id AS promotionOfferId,
                   e.id AS eventId,
                   e.titre AS titre,
                   e.lieu AS lieu,
                   e.date_debut AS dateDebut,
                   e.date_fin AS dateFin
            FROM promotion_offer_event poe
            INNER JOIN event e ON e.id = poe.event_id
            WHERE poe.promotion_offer_id IN (:promotionIds)
            ORDER BY e.date_debut ASC, e.id ASC
            """, nativeQuery = true)
    List<PromotionTargetEventSummaryView> findTargetedEventSummariesByPromotionIds(
            @Param("promotionIds") Collection<Long> promotionIds
    );

    @Query(value = """
            SELECT COUNT(*)
            FROM promotion_offer_event poe
            WHERE poe.promotion_offer_id = :promotionId
              AND poe.event_id = :eventId
            """, nativeQuery = true)
    long countTargetedEvent(
            @Param("promotionId") Long promotionId,
            @Param("eventId") Long eventId
    );

    @Modifying
    @Query(value = """
            DELETE FROM promotion_offer_event
            WHERE promotion_offer_id = :promotionId
            """, nativeQuery = true)
    void deleteTargetedEventsByPromotionId(@Param("promotionId") Long promotionId);

    @Modifying
    @Query(value = """
            INSERT INTO promotion_offer_event (promotion_offer_id, event_id)
            VALUES (:promotionId, :eventId)
            """, nativeQuery = true)
    void insertTargetedEvent(
            @Param("promotionId") Long promotionId,
            @Param("eventId") Long eventId
    );

    @Modifying
    @Query(value = """
            DELETE FROM promotion_offer
            WHERE id = :promotionId
            """, nativeQuery = true)
    int deletePromotionByIdNative(@Param("promotionId") Long promotionId);

    @Modifying
    @Query(value = """
            UPDATE promotion_offer po
            SET po.applies_to_all_events = b'1'
            WHERE po.applies_to_all_events = b'0'
              AND NOT EXISTS (
                  SELECT 1
                  FROM promotion_offer_event poe
                  WHERE poe.promotion_offer_id = po.id
              )
            """, nativeQuery = true)
    int backfillLegacyGlobalPromotions();

    interface PromotionTargetEventSummaryView {
        Long getPromotionOfferId();

        Long getEventId();

        String getTitre();

        String getLieu();

        LocalDateTime getDateDebut();

        LocalDateTime getDateFin();
    }
}
