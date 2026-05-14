package com.esprit.campconnect.MarketPlace.Code.Entity;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CheckoutCodeRequest {

    private Long userId;
    private String code;


}