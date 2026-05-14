package com.esprit.campconnect.Reservation.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StripeSessionSyncRequestDTO {

    @NotBlank(message = "Stripe session ID is required")
    private String sessionId;
}
