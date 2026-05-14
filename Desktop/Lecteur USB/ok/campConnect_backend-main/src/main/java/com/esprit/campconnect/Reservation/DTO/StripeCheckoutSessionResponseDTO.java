package com.esprit.campconnect.Reservation.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StripeCheckoutSessionResponseDTO {

    private String sessionId;
    private String checkoutUrl;
}
