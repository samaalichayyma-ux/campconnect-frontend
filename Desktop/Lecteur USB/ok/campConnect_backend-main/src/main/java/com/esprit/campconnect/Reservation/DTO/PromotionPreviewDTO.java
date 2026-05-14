package com.esprit.campconnect.Reservation.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PromotionPreviewDTO {

    private Long eventId;
    private Integer numberOfParticipants;
    private BigDecimal unitPrice;
    private BigDecimal basePriceTotal;
    private BigDecimal discountAmount;
    private BigDecimal totalPrice;
    private Boolean discountApplied;
    private Boolean autoApplied;
    private Boolean invalidPromoCode;
    private String promoCode;
    private String promotionName;
    private String discountLabel;
    private String validationMessage;
}
