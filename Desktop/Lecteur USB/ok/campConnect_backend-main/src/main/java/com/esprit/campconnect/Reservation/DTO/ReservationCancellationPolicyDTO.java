package com.esprit.campconnect.Reservation.DTO;

import com.esprit.campconnect.Reservation.Enum.CancellationPolicyTier;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReservationCancellationPolicyDTO {

    private CancellationPolicyTier tier;
    private String title;
    private String description;
    private Boolean canCancel;
    private BigDecimal eligibleRefundAmount;
    private Integer eligibleRefundPercentage;
    private LocalDateTime fullRefundDeadline;
    private LocalDateTime partialRefundDeadline;
}
