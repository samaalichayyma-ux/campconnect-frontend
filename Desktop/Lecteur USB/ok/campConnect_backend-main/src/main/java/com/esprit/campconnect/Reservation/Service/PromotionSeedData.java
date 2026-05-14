package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Reservation.DTO.PromotionOfferRequestDTO;
import com.esprit.campconnect.Reservation.Enum.PromotionDiscountType;
import com.esprit.campconnect.Reservation.Repository.PromotionOfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class PromotionSeedData implements CommandLineRunner {

    private final PromotionOfferRepository promotionOfferRepository;
    private final PromotionOfferService promotionOfferService;

    @Override
    public void run(String... args) {
        seedSeasonalPromoCode();
        seedGroupOffer();
    }

    private void seedSeasonalPromoCode() {
        if (promotionOfferRepository.existsByCodeIgnoreCase("CAMP15")) {
            return;
        }

        PromotionOfferRequestDTO requestDTO = new PromotionOfferRequestDTO();
        requestDTO.setName("Camp Season Saver");
        requestDTO.setCode("CAMP15");
        requestDTO.setDescription("Save 15% on qualifying bookings during the seasonal campaign window.");
        requestDTO.setDiscountType(PromotionDiscountType.PERCENTAGE);
        requestDTO.setDiscountValue(new BigDecimal("15"));
        requestDTO.setMinimumSubtotal(new BigDecimal("50"));
        requestDTO.setAutoApply(false);
        requestDTO.setDiscoverable(true);
        requestDTO.setActive(true);
        requestDTO.setStartsAt(LocalDateTime.now().minusDays(30));
        requestDTO.setEndsAt(LocalDateTime.now().plusMonths(6));
        requestDTO.setMaxRedemptions(250);

        promotionOfferService.createPromotion(requestDTO);
    }

    private void seedGroupOffer() {
        if (promotionOfferRepository.existsByCodeIgnoreCase("GROUP4")) {
            return;
        }

        PromotionOfferRequestDTO requestDTO = new PromotionOfferRequestDTO();
        requestDTO.setName("Group Explorer Deal");
        requestDTO.setCode("GROUP4");
        requestDTO.setDescription("Book 4 or more guests and save 12% automatically, or mention the code in support campaigns.");
        requestDTO.setDiscountType(PromotionDiscountType.PERCENTAGE);
        requestDTO.setDiscountValue(new BigDecimal("12"));
        requestDTO.setMinimumParticipants(4);
        requestDTO.setAutoApply(true);
        requestDTO.setDiscoverable(true);
        requestDTO.setActive(true);
        requestDTO.setStartsAt(LocalDateTime.now().minusDays(7));
        requestDTO.setEndsAt(LocalDateTime.now().plusMonths(12));
        requestDTO.setMaxRedemptions(500);

        promotionOfferService.createPromotion(requestDTO);
    }
}
