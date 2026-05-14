package com.esprit.campconnect.Livraison.demo.service;

import com.esprit.campconnect.Livraison.demo.dto.AddressSuggestionResponse;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class OpenStreetMapGeocodingService {

    private final RestTemplate restTemplate = new RestTemplate();

    public GeocodingResult geocode(String address) {
        if (address == null || address.isBlank()) {
            throw new RuntimeException("Delivery address is required");
        }

        String safeAddress = address.trim();

        if (!safeAddress.toLowerCase().contains("tunisia")) {
            safeAddress = safeAddress + ", Tunisia";
        }

        String encodedAddress = URLEncoder.encode(safeAddress, StandardCharsets.UTF_8);

        String url = "https://nominatim.openstreetmap.org/search"
                + "?q=" + encodedAddress
                + "&format=json"
                + "&limit=1"
                + "&countrycodes=tn"
                + "&accept-language=en";

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "CampConnectAcademicProject/1.0");

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<List> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                List.class
        );

        List results = response.getBody();

        if (results == null || results.isEmpty()) {
            throw new RuntimeException("Unable to find this delivery address");
        }

        Map firstResult = (Map) results.get(0);

        Double lat = Double.parseDouble((String) firstResult.get("lat"));
        Double lon = Double.parseDouble((String) firstResult.get("lon"));
        String displayName = (String) firstResult.get("display_name");

        return new GeocodingResult(lat, lon, displayName);
    }

    public record GeocodingResult(
            Double latitude,
            Double longitude,
            String formattedAddress
    ) {}

    public List<AddressSuggestionResponse> autocomplete(String query) {
        if (query == null || query.isBlank() || query.length() < 3) {
            return List.of();
        }

        String encodedQuery = URLEncoder.encode(query + ", Tunisia", StandardCharsets.UTF_8);

        String url = "https://nominatim.openstreetmap.org/search"
                + "?q=" + encodedQuery
                + "&format=json"
                + "&addressdetails=1"
                + "&limit=5"
                + "&countrycodes=tn"
                + "&accept-language=en";

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "CampConnectAcademicProject/1.0");

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<List> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                List.class
        );

        List results = response.getBody();

        if (results == null || results.isEmpty()) {
            return List.of();
        }

        return results.stream()
                .map(item -> {
                    Map result = (Map) item;

                    return new AddressSuggestionResponse(
                            (String) result.get("display_name"),
                            Double.parseDouble((String) result.get("lat")),
                            Double.parseDouble((String) result.get("lon"))
                    );
                })
                .toList();
    }
}