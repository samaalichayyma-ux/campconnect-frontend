package com.esprit.campconnect.Livraison.demo.service;

import com.esprit.campconnect.Livraison.demo.dto.WeatherSurchargeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class WeatherService {

    private final RestTemplate restTemplate = new RestTemplate();

    public WeatherSurchargeResponse calculateWeatherSurcharge(Double latitude, Double longitude) {
        String url = "https://api.open-meteo.com/v1/forecast"
                + "?latitude=" + latitude
                + "&longitude=" + longitude
                + "&current=temperature_2m,precipitation,weather_code";

        Map response = restTemplate.getForObject(url, Map.class);

        if (response == null || response.get("current") == null) {
            throw new RuntimeException("Unable to fetch weather data");
        }

        Map current = (Map) response.get("current");

        Double temperature = ((Number) current.get("temperature_2m")).doubleValue();
        Double precipitation = ((Number) current.get("precipitation")).doubleValue();

        double surcharge = 0.0;
        String condition = "NORMAL";

        if (precipitation > 0) {
            surcharge += 2.0;
            condition = "RAIN";
        }

        if (temperature >= 35) {
            surcharge += 1.5;
            condition = condition.equals("RAIN") ? "RAIN_AND_HOT" : "HOT";
        }

        return new WeatherSurchargeResponse(
                temperature,
                precipitation,
                condition,
                surcharge
        );
    }
}