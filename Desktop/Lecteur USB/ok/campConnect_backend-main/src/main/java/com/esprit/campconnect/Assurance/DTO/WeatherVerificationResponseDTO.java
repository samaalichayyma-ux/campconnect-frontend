package com.esprit.campconnect.Assurance.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class WeatherVerificationResponseDTO {
    private String lieu;
    private String date;
    private String condition;
    private Double temperatureMoyenne;
    private Double ventMaxKph;
    private Double precipitationMm;
    private Boolean meteoCompatible;
    private String niveauRisqueMeteo;
    private String conclusion;
}