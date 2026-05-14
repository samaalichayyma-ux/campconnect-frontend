package com.esprit.campconnect.Assurance.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AssuranceCheckoutSessionResponseDTO {
    private String sessionId;
    private String checkoutUrl;
}