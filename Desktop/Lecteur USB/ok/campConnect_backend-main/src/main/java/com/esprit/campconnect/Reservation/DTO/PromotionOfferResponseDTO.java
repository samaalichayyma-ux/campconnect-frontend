package com.esprit.campconnect.Reservation.DTO;

import com.esprit.campconnect.Reservation.Enum.PromotionDiscountType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PromotionOfferResponseDTO {

    private Long id;
    private String name;
    private String code;
    private String description;
    private PromotionDiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal minimumSubtotal;
    private Integer minimumParticipants;
    private Boolean autoApply;
    private Boolean discoverable;
    private Boolean active;
    private Boolean currentlyAvailable;
    private Integer maxRedemptions;
    private Long usageCount;
    private Long remainingRedemptions;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
}
