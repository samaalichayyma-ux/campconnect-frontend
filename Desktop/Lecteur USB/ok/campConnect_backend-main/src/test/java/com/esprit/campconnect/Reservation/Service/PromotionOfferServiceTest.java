package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Event.Repository.EventRepository;
import com.esprit.campconnect.Reservation.Entity.PromotionOffer;
import com.esprit.campconnect.Reservation.Enum.PromotionDiscountType;
import com.esprit.campconnect.Reservation.Repository.PromotionOfferRepository;
import com.esprit.campconnect.Reservation.Repository.ReservationRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PromotionOfferServiceTest {

    @Mock
    private PromotionOfferRepository promotionOfferRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private EventRepository eventRepository;

    private PromotionOfferService promotionOfferService;

    @BeforeEach
    void setUp() {
        promotionOfferService = new PromotionOfferService(
                promotionOfferRepository,
                reservationRepository,
                eventRepository
        );
    }

    @Test
    void evaluateReservationPricingAppliesManualPromoCode() {
        Event event = buildEvent();
        PromotionOffer promoCode = buildPromotion(
                "Camp Season Saver",
                "CAMP15",
                PromotionDiscountType.PERCENTAGE,
                new BigDecimal("15"),
                false,
                null
        );

        when(promotionOfferRepository.findByCodeIgnoreCase("CAMP15")).thenReturn(Optional.of(promoCode));
        PromotionOfferService.PromotionEvaluationResult result =
                promotionOfferService.evaluateReservationPricing(event, 2, "camp15", true);

        assertThat(result.getBasePriceTotal()).isEqualByComparingTo("120.00");
        assertThat(result.getDiscountAmount()).isEqualByComparingTo("18.00");
        assertThat(result.getTotalPrice()).isEqualByComparingTo("102.00");
        assertThat(result.getAppliedPromoCode()).isEqualTo("CAMP15");
        assertThat(result.getDiscountLabel()).contains("15% off");
        assertThat(result.isAutoApplied()).isFalse();
    }

    @Test
    void evaluateReservationPricingFallsBackToBestAutoPromotion() {
        Event event = buildEvent();
        PromotionOffer groupOffer = buildPromotion(
                "Group Explorer Deal",
                "GROUP4",
                PromotionDiscountType.PERCENTAGE,
                new BigDecimal("12"),
                true,
                4
        );

        when(promotionOfferRepository.findByAutoApplyTrueAndActiveTrueOrderByDateCreationDesc())
                .thenReturn(List.of(groupOffer));
        PromotionOfferService.PromotionEvaluationResult result =
                promotionOfferService.evaluateReservationPricing(event, 4, null, false);

        assertThat(result.getBasePriceTotal()).isEqualByComparingTo("240.00");
        assertThat(result.getDiscountAmount()).isEqualByComparingTo("28.80");
        assertThat(result.getTotalPrice()).isEqualByComparingTo("211.20");
        assertThat(result.getAppliedPromotion()).isNotNull();
        assertThat(result.isAutoApplied()).isTrue();
        assertThat(result.getValidationMessage()).contains("applied automatically");
    }

    private Event buildEvent() {
        Event event = new Event();
        event.setId(19L);
        event.setPrix(new BigDecimal("60"));
        event.setTitre("Sunrise camp");
        event.setDateDebut(LocalDateTime.now().plusDays(15));
        event.setDateFin(LocalDateTime.now().plusDays(15).plusHours(5));
        return event;
    }

    private PromotionOffer buildPromotion(
            String name,
            String code,
            PromotionDiscountType discountType,
            BigDecimal discountValue,
            boolean autoApply,
            Integer minimumParticipants
    ) {
        PromotionOffer promotionOffer = new PromotionOffer();
        promotionOffer.setId(17L);
        promotionOffer.setName(name);
        promotionOffer.setCode(code);
        promotionOffer.setDiscountType(discountType);
        promotionOffer.setDiscountValue(discountValue);
        promotionOffer.setAutoApply(autoApply);
        promotionOffer.setActive(true);
        promotionOffer.setDiscoverable(true);
        promotionOffer.setMinimumParticipants(minimumParticipants);
        promotionOffer.setStartsAt(LocalDateTime.now().minusDays(1));
        promotionOffer.setEndsAt(LocalDateTime.now().plusDays(30));
        promotionOffer.setDateCreation(LocalDateTime.now().minusDays(10));
        return promotionOffer;
    }
}
