package com.esprit.campconnect.MarketPlace.Payment.DTO;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class StripeConfirmRequest {
    private String sessionId;



}