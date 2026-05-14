package com.esprit.campconnect.Assurance.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class CurrentWeatherResponseDTO {
    private String ville;
    private String pays;
    private String localtime;
    private String condition;
    private String icon;
    private Double temperatureC;
    private Double feelsLikeC;
    private Double windKph;
    private Double humidity;
    private Double precipitationMm;
    private String conseilAssurance;
}