package com.esprit.campconnect.MarketPlace.Payment.DTO;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StripeCheckoutRequest {
    private Long userId;
    private Long idPanier;
    private Double total;

}