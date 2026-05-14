package com.esprit.campconnect.Livraison.demo.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class WeatherSurchargeResponse {
    Double temperature;
    Double precipitation;
    String condition;
    Double surcharge;
}