package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Event.Repository.EventRepository;
import com.esprit.campconnect.Reservation.DTO.PromotionOfferRequestDTO;
import com.esprit.campconnect.Reservation.DTO.PromotionOfferResponseDTO;
import com.esprit.campconnect.Reservation.DTO.PromotionPreviewDTO;
import com.esprit.campconnect.Reservation.Entity.PromotionOffer;
import com.esprit.campconnect.Reservation.Enum.PromotionDiscountType;
import com.esprit.campconnect.Reservation.Repository.PromotionOfferRepository;
import com.esprit.campconnect.Reservation.Repository.ReservationRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class PromotionOfferService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final PromotionOfferRepository promotionOfferRepository;
    private final ReservationRepository reservationRepository;
    private final EventRepository eventRepository;

    @Transactional(readOnly = true)
    public PromotionPreviewDTO previewReservationPricing(Long eventId, Integer numberOfParticipants, String promoCode) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        PromotionEvaluationResult evaluationResult =
                evaluateReservationPricing(event, numberOfParticipants, promoCode, false);

        return mapToPreviewDTO(event, numberOfParticipants, evaluationResult);
    }

    @Transactional(readOnly = true)
    public List<PromotionOfferResponseDTO> getPublicActivePromotions() {
        return promotionOfferRepository.findByDiscoverableTrueAndActiveTrueOrderByAutoApplyDescDateCreationDesc().stream()
                .filter(this::isCurrentlyAvailable)
                .sorted(Comparator
                        .comparing((PromotionOffer offer) -> Boolean.TRUE.equals(offer.getAutoApply()))
                        .reversed()
                        .thenComparing(PromotionOffer::getDateCreation, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PromotionOfferResponseDTO> getAllPromotions() {
        return promotionOfferRepository.findAll().stream()
                .sorted(Comparator.comparing(PromotionOffer::getDateCreation, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapToResponseDTO)
                .toList();
    }

    public PromotionOfferResponseDTO createPromotion(PromotionOfferRequestDTO requestDTO) {
        validatePromotionRequest(requestDTO, null);

        PromotionOffer promotionOffer = new PromotionOffer();
        populatePromotionOffer(promotionOffer, requestDTO);
        return mapToResponseDTO(promotionOfferRepository.save(promotionOffer));
    }

    public PromotionOfferResponseDTO updatePromotion(Long promotionId, PromotionOfferRequestDTO requestDTO) {
        PromotionOffer promotionOffer = promotionOfferRepository.findById(promotionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Promotion not found"));

        validatePromotionRequest(requestDTO, promotionId);
        populatePromotionOffer(promotionOffer, requestDTO);
        return mapToResponseDTO(promotionOfferRepository.save(promotionOffer));
    }

    @Transactional(readOnly = true)
    public PromotionEvaluationResult evaluateReservationPricing(
            Event event,
            Integer numberOfParticipants,
            String promoCode,
            boolean strictPromoCode
    ) {
        if (event == null || event.getPrix() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event pricing is not available");
        }

        if (numberOfParticipants == null || numberOfParticipants <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one participant is required");
        }

        BigDecimal unitPrice = safeMoney(event.getPrix());
        BigDecimal basePriceTotal = unitPrice.multiply(BigDecimal.valueOf(numberOfParticipants)).setScale(2, RoundingMode.HALF_UP);
        LocalDateTime now = LocalDateTime.now();

        String normalizedPromoCode = normalizeCode(promoCode);
        PromotionOffer appliedPromotion = null;
        boolean invalidPromoCode = false;
        String validationMessage = null;

        if (StringUtils.hasText(normalizedPromoCode)) {
            PromotionOffer manualPromotion = promotionOfferRepository.findByCodeIgnoreCase(normalizedPromoCode)
                    .orElse(null);

            if (manualPromotion == null) {
                if (strictPromoCode) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Promo code not found");
                }
                invalidPromoCode = true;
                validationMessage = "That promo code could not be found. Active group offers still apply automatically.";
            } else {
                String eligibilityIssue = getEligibilityIssue(manualPromotion, basePriceTotal, numberOfParticipants, now);
                if (eligibilityIssue != null) {
                    if (strictPromoCode) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, eligibilityIssue);
                    }
                    invalidPromoCode = true;
                    validationMessage = eligibilityIssue + " Eligible group offers still apply automatically when available.";
                } else {
                    appliedPromotion = manualPromotion;
                }
            }
        }

        if (appliedPromotion == null) {
            appliedPromotion = findBestAutoPromotion(basePriceTotal, numberOfParticipants, now);
            if (appliedPromotion != null && !invalidPromoCode) {
                validationMessage = buildAutoApplyMessage(appliedPromotion);
            }
        }

        BigDecimal discountAmount = appliedPromotion != null
                ? calculateDiscountAmount(basePriceTotal, appliedPromotion)
                : BigDecimal.ZERO;
        BigDecimal totalPrice = basePriceTotal.subtract(discountAmount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        return new PromotionEvaluationResult(
                unitPrice,
                basePriceTotal,
                discountAmount,
                totalPrice,
                appliedPromotion,
                appliedPromotion != null ? normalizeCode(appliedPromotion.getCode()) : null,
                appliedPromotion != null ? buildDiscountLabel(appliedPromotion) : null,
                appliedPromotion != null && Boolean.TRUE.equals(appliedPromotion.getAutoApply()),
                invalidPromoCode,
                validationMessage
        );
    }

    private PromotionOffer findBestAutoPromotion(
            BigDecimal basePriceTotal,
            Integer numberOfParticipants,
            LocalDateTime now
    ) {
        return promotionOfferRepository.findByAutoApplyTrueAndActiveTrueOrderByDateCreationDesc().stream()
                .filter(offer -> getEligibilityIssue(offer, basePriceTotal, numberOfParticipants, now) == null)
                .max(Comparator
                        .comparing((PromotionOffer offer) -> calculateDiscountAmount(basePriceTotal, offer))
                        .thenComparing(PromotionOffer::getDateCreation, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
    }

    private String getEligibilityIssue(
            PromotionOffer promotionOffer,
            BigDecimal basePriceTotal,
            Integer numberOfParticipants,
            LocalDateTime now
    ) {
        if (promotionOffer == null) {
            return "Promotion not found";
        }

        if (!Boolean.TRUE.equals(promotionOffer.getActive())) {
            return "This promotion is not active right now.";
        }

        if (promotionOffer.getStartsAt() != null && now.isBefore(promotionOffer.getStartsAt())) {
            return "This promotion has not started yet.";
        }

        if (promotionOffer.getEndsAt() != null && now.isAfter(promotionOffer.getEndsAt())) {
            return "This promotion has already ended.";
        }

        if (promotionOffer.getMinimumParticipants() != null
                && numberOfParticipants < promotionOffer.getMinimumParticipants()) {
            return "This promotion requires at least "
                    + promotionOffer.getMinimumParticipants()
                    + " guests.";
        }

        if (promotionOffer.getMinimumSubtotal() != null
                && basePriceTotal.compareTo(safeMoney(promotionOffer.getMinimumSubtotal())) < 0) {
            return "This promotion requires a subtotal of at least "
                    + formatMoney(promotionOffer.getMinimumSubtotal())
                    + ".";
        }

        if (hasReachedMaxRedemptions(promotionOffer)) {
            return "This promotion has already reached its campaign limit.";
        }

        return null;
    }

    private boolean isCurrentlyAvailable(PromotionOffer promotionOffer) {
        return getEligibilityIssue(
                promotionOffer,
                safeMoney(promotionOffer.getMinimumSubtotal()),
                Math.max(1, promotionOffer.getMinimumParticipants() != null ? promotionOffer.getMinimumParticipants() : 1),
                LocalDateTime.now()
        ) == null;
    }

    private boolean hasReachedMaxRedemptions(PromotionOffer promotionOffer) {
        if (promotionOffer == null || promotionOffer.getId() == null || promotionOffer.getMaxRedemptions() == null) {
            return false;
        }

        return getUsageCount(promotionOffer) >= promotionOffer.getMaxRedemptions();
    }

    private long getUsageCount(PromotionOffer promotionOffer) {
        if (promotionOffer == null || promotionOffer.getId() == null) {
            return 0L;
        }

        return reservationRepository.countByPromotionOfferId(promotionOffer.getId());
    }

    private BigDecimal calculateDiscountAmount(BigDecimal basePriceTotal, PromotionOffer promotionOffer) {
        if (promotionOffer == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal safeBasePrice = safeMoney(basePriceTotal);
        BigDecimal calculatedDiscount = switch (promotionOffer.getDiscountType()) {
            case PERCENTAGE -> safeBasePrice
                    .multiply(safeMoney(promotionOffer.getDiscountValue()))
                    .divide(HUNDRED, 2, RoundingMode.HALF_UP);
            case FIXED_AMOUNT -> safeMoney(promotionOffer.getDiscountValue());
        };

        return calculatedDiscount.min(safeBasePrice).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private PromotionPreviewDTO mapToPreviewDTO(
            Event event,
            Integer numberOfParticipants,
            PromotionEvaluationResult evaluationResult
    ) {
        return new PromotionPreviewDTO(
                event != null ? event.getId() : null,
                numberOfParticipants,
                evaluationResult.getUnitPrice(),
                evaluationResult.getBasePriceTotal(),
                evaluationResult.getDiscountAmount(),
                evaluationResult.getTotalPrice(),
                evaluationResult.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0,
                evaluationResult.isAutoApplied(),
                evaluationResult.isInvalidPromoCode(),
                evaluationResult.getAppliedPromoCode(),
                evaluationResult.getAppliedPromotion() != null ? evaluationResult.getAppliedPromotion().getName() : null,
                evaluationResult.getDiscountLabel(),
                evaluationResult.getValidationMessage()
        );
    }

    private PromotionOfferResponseDTO mapToResponseDTO(PromotionOffer promotionOffer) {
        long usageCount = getUsageCount(promotionOffer);
        Long remainingRedemptions = promotionOffer.getMaxRedemptions() == null
                ? null
                : Math.max(0L, promotionOffer.getMaxRedemptions() - usageCount);

        return new PromotionOfferResponseDTO(
                promotionOffer.getId(),
                promotionOffer.getName(),
                promotionOffer.getCode(),
                promotionOffer.getDescription(),
                promotionOffer.getDiscountType(),
                promotionOffer.getDiscountValue(),
                promotionOffer.getMinimumSubtotal(),
                promotionOffer.getMinimumParticipants(),
                promotionOffer.getAutoApply(),
                promotionOffer.getDiscoverable(),
                promotionOffer.getActive(),
                isCurrentlyAvailable(promotionOffer),
                promotionOffer.getMaxRedemptions(),
                usageCount,
                remainingRedemptions,
                promotionOffer.getStartsAt(),
                promotionOffer.getEndsAt(),
                promotionOffer.getDateCreation(),
                promotionOffer.getDateModification()
        );
    }

    private void populatePromotionOffer(PromotionOffer promotionOffer, PromotionOfferRequestDTO requestDTO) {
        promotionOffer.setName(requestDTO.getName().trim());
        promotionOffer.setCode(normalizeCode(requestDTO.getCode()));
        promotionOffer.setDescription(StringUtils.hasText(requestDTO.getDescription()) ? requestDTO.getDescription().trim() : null);
        promotionOffer.setDiscountType(requestDTO.getDiscountType());
        promotionOffer.setDiscountValue(safeMoney(requestDTO.getDiscountValue()));
        promotionOffer.setMinimumSubtotal(requestDTO.getMinimumSubtotal() != null ? safeMoney(requestDTO.getMinimumSubtotal()) : null);
        promotionOffer.setMinimumParticipants(requestDTO.getMinimumParticipants());
        promotionOffer.setAutoApply(Boolean.TRUE.equals(requestDTO.getAutoApply()));
        promotionOffer.setDiscoverable(requestDTO.getDiscoverable() == null || Boolean.TRUE.equals(requestDTO.getDiscoverable()));
        promotionOffer.setActive(requestDTO.getActive() == null || Boolean.TRUE.equals(requestDTO.getActive()));
        promotionOffer.setStartsAt(requestDTO.getStartsAt());
        promotionOffer.setEndsAt(requestDTO.getEndsAt());
        promotionOffer.setMaxRedemptions(requestDTO.getMaxRedemptions());
    }

    private void validatePromotionRequest(PromotionOfferRequestDTO requestDTO, Long currentPromotionId) {
        if (requestDTO.getStartsAt() != null
                && requestDTO.getEndsAt() != null
                && requestDTO.getEndsAt().isBefore(requestDTO.getStartsAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Promotion end date must be after the start date");
        }

        String normalizedCode = normalizeCode(requestDTO.getCode());
        if (!Boolean.TRUE.equals(requestDTO.getAutoApply()) && !StringUtils.hasText(normalizedCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A promo code is required unless the discount is auto-applied");
        }

        if (StringUtils.hasText(normalizedCode)) {
            PromotionOffer existingPromotion = promotionOfferRepository.findByCodeIgnoreCase(normalizedCode).orElse(null);
            if (existingPromotion != null && !Objects.equals(existingPromotion.getId(), currentPromotionId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "This promo code already exists");
            }
        }

        if (requestDTO.getDiscountType() == PromotionDiscountType.PERCENTAGE
                && requestDTO.getDiscountValue() != null
                && requestDTO.getDiscountValue().compareTo(HUNDRED) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Percentage discounts cannot exceed 100%");
        }
    }

    private String buildDiscountLabel(PromotionOffer promotionOffer) {
        if (promotionOffer == null) {
            return null;
        }

        String valueLabel = promotionOffer.getDiscountType() == PromotionDiscountType.PERCENTAGE
                ? safeMoney(promotionOffer.getDiscountValue()).stripTrailingZeros().toPlainString() + "% off"
                : formatMoney(promotionOffer.getDiscountValue()) + " off";

        return promotionOffer.getName() + " (" + valueLabel + ")";
    }

    private String buildAutoApplyMessage(PromotionOffer promotionOffer) {
        if (promotionOffer == null) {
            return null;
        }

        if (promotionOffer.getMinimumParticipants() != null && promotionOffer.getMinimumParticipants() > 1) {
            return promotionOffer.getName()
                    + " was applied automatically for groups of "
                    + promotionOffer.getMinimumParticipants()
                    + "+ guests.";
        }

        return promotionOffer.getName() + " was applied automatically to this booking.";
    }

    private BigDecimal safeMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }

    private String formatMoney(BigDecimal value) {
        return "$" + safeMoney(value).stripTrailingZeros().toPlainString();
    }

    private String normalizeCode(String rawCode) {
        return StringUtils.hasText(rawCode) ? rawCode.trim().toUpperCase(Locale.ROOT) : null;
    }

    @Getter
    @RequiredArgsConstructor
    public static class PromotionEvaluationResult {
        private final BigDecimal unitPrice;
        private final BigDecimal basePriceTotal;
        private final BigDecimal discountAmount;
        private final BigDecimal totalPrice;
        private final PromotionOffer appliedPromotion;
        private final String appliedPromoCode;
        private final String discountLabel;
        private final boolean autoApplied;
        private final boolean invalidPromoCode;
        private final String validationMessage;
    }
}
