package com.esprit.campconnect.Assurance.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WeatherVerificationRequestDTO {
    private String lieu;
    private String date;
    private String description;
}