package com.esprit.campconnect.Reservation.DTO;

import com.esprit.campconnect.Reservation.Enum.PromotionDiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class PromotionOfferRequestDTO {

    @NotBlank(message = "Promotion name is required")
    @Size(max = 120, message = "Promotion name must be 120 characters or fewer")
    private String name;

    @Size(max = 64, message = "Promo code must be 64 characters or fewer")
    private String code;

    @Size(max = 1200, message = "Promotion description must be 1200 characters or fewer")
    private String description;

    @NotNull(message = "Discount type is required")
    private PromotionDiscountType discountType;

    @NotNull(message = "Discount value is required")
    @DecimalMin(value = "0.01", message = "Discount value must be greater than zero")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.00", message = "Minimum subtotal cannot be negative")
    private BigDecimal minimumSubtotal;

    @Min(value = 1, message = "Minimum participants must be at least 1")
    private Integer minimumParticipants;

    private Boolean autoApply;

    private Boolean discoverable;

    private Boolean active;

    private LocalDateTime startsAt;

    private LocalDateTime endsAt;

    @Min(value = 1, message = "Maximum redemptions must be at least 1")
    private Integer maxRedemptions;
}
