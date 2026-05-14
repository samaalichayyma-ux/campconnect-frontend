package com.esprit.campconnect.config;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin("*")
@RequestMapping("/config/google-maps")
@RequiredArgsConstructor
public class GoogleMapsConfigController {

    private final GoogleMapsService googleMapsService;

    @GetMapping("/public")
    public ResponseEntity<GoogleMapsPublicConfigDTO> getPublicConfig() {
        return ResponseEntity.ok(new GoogleMapsPublicConfigDTO(
                googleMapsService.hasBrowserApiKey(),
                googleMapsService.getBrowserApiKey(),
                googleMapsService.hasServerApiKey()
        ));
    }
}
