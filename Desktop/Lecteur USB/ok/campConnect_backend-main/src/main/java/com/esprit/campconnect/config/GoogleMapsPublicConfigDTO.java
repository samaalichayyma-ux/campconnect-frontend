package com.esprit.campconnect.config;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GoogleMapsPublicConfigDTO {

    private boolean enabled;
    private String apiKey;
    private boolean receiptMapEnabled;
}
