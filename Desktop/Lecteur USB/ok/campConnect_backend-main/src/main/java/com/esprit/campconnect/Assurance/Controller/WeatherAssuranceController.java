package com.esprit.campconnect.Assurance.Controller;

import com.esprit.campconnect.Assurance.DTO.CurrentWeatherResponseDTO;
import com.esprit.campconnect.Assurance.DTO.WeatherVerificationRequestDTO;
import com.esprit.campconnect.Assurance.DTO.WeatherVerificationResponseDTO;
import com.esprit.campconnect.Assurance.Entity.Sinistre;
import com.esprit.campconnect.Assurance.Service.ISinistreService;
import com.esprit.campconnect.Assurance.Service.WeatherAssuranceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/assurance-weather")
@RequiredArgsConstructor
@CrossOrigin("*")
public class WeatherAssuranceController {

    private final WeatherAssuranceService weatherAssuranceService;
    private final ISinistreService sinistreService;

    @PostMapping("/verifier")
    public WeatherVerificationResponseDTO verifierMeteo(
            @RequestBody WeatherVerificationRequestDTO request
    ) {
        return weatherAssuranceService.verifierMeteoSinistre(
                request.getLieu(),
                request.getDate(),
                request.getDescription()
        );
    }

    @PostMapping("/verifier-sinistre/{sinistreId}")
    public WeatherVerificationResponseDTO verifierMeteoBySinistre(
            @PathVariable Long sinistreId
    ) {
        Sinistre sinistre = sinistreService.retrieveById(sinistreId);

        if (sinistre == null) {
            throw new RuntimeException("Sinistre introuvable.");
        }

        if (sinistre.getLieuIncident() == null || sinistre.getLieuIncident().isBlank()) {
            throw new RuntimeException("Lieu du sinistre introuvable.");
        }

        if (sinistre.getDateDeclaration() == null) {
            throw new RuntimeException("Date du sinistre introuvable.");
        }

        return weatherAssuranceService.verifierMeteoSinistre(
                sinistre.getLieuIncident(),
                sinistre.getDateDeclaration().toString(),
                sinistre.getDescription()
        );
    }

    @GetMapping("/current")
    public CurrentWeatherResponseDTO getCurrentWeather(
            @RequestParam(defaultValue = "Tabarka") String city
    ) {
        return weatherAssuranceService.getCurrentWeather(city);
    }
}