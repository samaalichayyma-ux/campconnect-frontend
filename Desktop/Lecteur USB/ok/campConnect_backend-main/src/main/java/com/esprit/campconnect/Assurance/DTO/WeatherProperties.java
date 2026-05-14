package com.esprit.campconnect.Assurance.DTO;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.weather")
public class WeatherProperties {
    private String apiKey;
    private String baseUrl;
}