package com.esprit.campconnect.Livraison.demo.service;

import com.esprit.campconnect.Livraison.demo.dto.LivraisonFeeResponse;
import com.esprit.campconnect.Livraison.demo.dto.WeatherSurchargeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LivraisonPricingService {

    private final WeatherService weatherService;

    private static final double BASE_FEE = 3.0;
    private static final double FREE_WEIGHT_KG = 1.0;
    private static final double EXTRA_WEIGHT_PRICE_PER_KG = 1.5;

    private boolean isGreaterTunis(Double lat, Double lon) {
        if (lat == null || lon == null) return false;

        // Rough bounding box for Greater Tunis
        return lat >= 36.6 && lat <= 37.1 &&
                lon >= 9.8 && lon <= 10.4;
    }

    public LivraisonFeeResponse calculateFee(
            Double itemsTotal,
            Double distanceKm,
            Double poidsKg,
            Double latitude,
            Double longitude
    ) {
        if (itemsTotal == null || itemsTotal < 0) {
            throw new RuntimeException("Items total is invalid");
        }

        double safeDistanceKm = distanceKm != null ? distanceKm : 0.0;
        double safePoidsKg = poidsKg != null ? poidsKg : 0.0;

        double distanceFee;
        String deliveryZone;

        if (isGreaterTunis(latitude, longitude)) {
            distanceFee = 5.0;
            deliveryZone = "GREATER_TUNIS";
        } else if (safeDistanceKm >= 60) {
            distanceFee = 12.0;
            deliveryZone = "LONG_DISTANCE";
        } else {
            distanceFee = 7.0;
            deliveryZone = "NEARBY";
        }



        double weightFee = 0.0;
        if (safePoidsKg > FREE_WEIGHT_KG) {
            weightFee = (safePoidsKg - FREE_WEIGHT_KG) * EXTRA_WEIGHT_PRICE_PER_KG;
        }

        WeatherSurchargeResponse weather = weatherService.calculateWeatherSurcharge(
                latitude != null ? latitude : 36.8065,
                longitude != null ? longitude : 10.1815
        );

        double weatherFee = weather.getSurcharge();
        double deliveryFee = distanceFee;
        double finalTotal = itemsTotal + deliveryFee + weightFee + weatherFee;

        return new LivraisonFeeResponse(
                itemsTotal,
                BASE_FEE,
                distanceFee,
                weightFee,
                weatherFee,
                deliveryFee,
                finalTotal,
                safeDistanceKm,
                safePoidsKg,
                weather.getCondition(),
                weather.getTemperature(),
                weather.getPrecipitation(),
                deliveryZone
        );
    }
}