package com.esprit.campconnect.Assurance.Service;

import com.esprit.campconnect.Assurance.DTO.CurrentWeatherResponseDTO;
import com.esprit.campconnect.Assurance.DTO.WeatherProperties;
import com.esprit.campconnect.Assurance.DTO.WeatherVerificationResponseDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
public class WeatherAssuranceService {

    private final WeatherProperties weatherProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public WeatherVerificationResponseDTO verifierMeteoSinistre(
            String lieu,
            String date,
            String description
    ) {
        if (weatherProperties.getApiKey() == null || weatherProperties.getApiKey().isBlank()) {
            throw new RuntimeException("Clé WeatherAPI manquante. Vérifiez WEATHER_API_KEY dans .env");
        }

        if (lieu == null || lieu.isBlank()) {
            throw new RuntimeException("Lieu obligatoire pour vérifier la météo.");
        }

        if (date == null || date.isBlank()) {
            throw new RuntimeException("Date obligatoire pour vérifier la météo.");
        }

        try {
            RestTemplate restTemplate = new RestTemplate();

            String url = UriComponentsBuilder
                    .fromHttpUrl(weatherProperties.getBaseUrl() + "/history.json")
                    .queryParam("key", weatherProperties.getApiKey())
                    .queryParam("q", lieu)
                    .queryParam("dt", date)
                    .queryParam("lang", "fr")
                    .toUriString();

            String response = restTemplate.getForObject(url, String.class);

            return analyserWeatherResponse(response, lieu, date, description);

        } catch (Exception e) {
            throw new RuntimeException("Erreur vérification météo : " + e.getMessage());
        }
    }

    private WeatherVerificationResponseDTO analyserWeatherResponse(
            String response,
            String lieu,
            String date,
            String description
    ) {
        try {
            JsonNode root = objectMapper.readTree(response);

            JsonNode forecastDay = root
                    .path("forecast")
                    .path("forecastday")
                    .get(0)
                    .path("day");

            String condition = forecastDay
                    .path("condition")
                    .path("text")
                    .asText("Condition inconnue");

            double avgTemp = forecastDay.path("avgtemp_c").asDouble(0);
            double maxWindKph = forecastDay.path("maxwind_kph").asDouble(0);
            double totalPrecipMm = forecastDay.path("totalprecip_mm").asDouble(0);

            String text = (
                    (description == null ? "" : description) + " " + condition
            ).toLowerCase();

            boolean parleTempete = containsAny(text,
                    "tempête", "tempete", "orage", "vent", "violent", "rafale", "storm", "wind"
            );

            boolean parlePluie = containsAny(text,
                    "pluie", "inondation", "averse", "eau", "flood", "rain"
            );

            boolean ventImportant = maxWindKph >= 45;
            boolean pluieImportante = totalPrecipMm >= 10;

            boolean compatible = false;
            String niveau = "FAIBLE";

            if (parleTempete && ventImportant) {
                compatible = true;
                niveau = maxWindKph >= 70 ? "ELEVE" : "MOYEN";
            }

            if (parlePluie && pluieImportante) {
                compatible = true;
                niveau = totalPrecipMm >= 30 ? "ELEVE" : "MOYEN";
            }

            if (!parleTempete && !parlePluie && (ventImportant || pluieImportante)) {
                compatible = true;
                niveau = "MOYEN";
            }

            String conclusion;

            if (compatible) {
                conclusion = "La météo du jour semble compatible avec le sinistre déclaré.";
            } else {
                conclusion = "La météo trouvée ne confirme pas fortement le sinistre déclaré. Une vérification manuelle est recommandée.";
            }

            return new WeatherVerificationResponseDTO(
                    lieu,
                    date,
                    condition,
                    avgTemp,
                    maxWindKph,
                    totalPrecipMm,
                    compatible,
                    niveau,
                    conclusion
            );

        } catch (Exception e) {
            throw new RuntimeException("Impossible d’analyser la réponse météo : " + e.getMessage());
        }
    }

    private boolean containsAny(String text, String... words) {
        for (String word : words) {
            if (text.contains(word)) {
                return true;
            }
        }
        return false;
    }

    public CurrentWeatherResponseDTO getCurrentWeather(String city) {
        if (weatherProperties.getApiKey() == null || weatherProperties.getApiKey().isBlank()) {
            throw new RuntimeException("Clé WeatherAPI manquante. Vérifiez WEATHER_API_KEY dans .env");
        }

        if (city == null || city.isBlank()) {
            city = "Tabarka";
        }

        try {
            RestTemplate restTemplate = new RestTemplate();

            String url = UriComponentsBuilder
                    .fromHttpUrl(weatherProperties.getBaseUrl() + "/current.json")
                    .queryParam("key", weatherProperties.getApiKey())
                    .queryParam("q", city)
                    .queryParam("aqi", "no")
                    .queryParam("lang", "fr")
                    .toUriString();

            String response = restTemplate.getForObject(url, String.class);

            JsonNode root = objectMapper.readTree(response);

            JsonNode location = root.path("location");
            JsonNode current = root.path("current");

            String ville = location.path("name").asText(city);
            String pays = location.path("country").asText("-");
            String localtime = location.path("localtime").asText("-");

            String condition = current.path("condition").path("text").asText("Condition inconnue");
            String icon = current.path("condition").path("icon").asText("");

            double tempC = current.path("temp_c").asDouble(0);
            double feelsLikeC = current.path("feelslike_c").asDouble(0);
            double windKph = current.path("wind_kph").asDouble(0);
            double humidity = current.path("humidity").asDouble(0);
            double precipMm = current.path("precip_mm").asDouble(0);

            String conseil = buildWeatherAdvice(condition, windKph, precipMm);

            return new CurrentWeatherResponseDTO(
                    ville,
                    pays,
                    localtime,
                    condition,
                    icon,
                    tempC,
                    feelsLikeC,
                    windKph,
                    humidity,
                    precipMm,
                    conseil
            );

        } catch (Exception e) {
            throw new RuntimeException("Erreur météo actuelle : " + e.getMessage());
        }
    }

    private String buildWeatherAdvice(String condition, double windKph, double precipMm) {
        String text = condition == null ? "" : condition.toLowerCase();

        if (windKph >= 60) {
            return "Vent fort détecté. Surveillez les sinistres liés aux tentes, équipements et dommages matériels.";
        }

        if (precipMm >= 10 || text.contains("pluie") || text.contains("orage")) {
            return "Risque météo lié à la pluie. Vérifiez les sinistres d’inondation, dégâts matériels ou annulation.";
        }

        if (text.contains("brouillard")) {
            return "Visibilité réduite. Surveillez les incidents liés aux déplacements et accidents.";
        }

        return "Conditions météo normales. Aucun risque météo important détecté pour le moment.";
    }


}