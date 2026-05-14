package com.esprit.campconnect.config;

import com.esprit.campconnect.Event.Entity.Event;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleMapsService {

    private final GoogleMapsProperties properties;
    private final RestClient restClient = RestClient.builder().build();

    public boolean hasBrowserApiKey() {
        return hasText(properties.getBrowserApiKey());
    }

    public boolean hasServerApiKey() {
        return hasText(properties.getServerApiKey());
    }

    public String getBrowserApiKey() {
        return hasBrowserApiKey() ? properties.getBrowserApiKey().trim() : "";
    }

    public String buildGoogleMapsUrl(Event event) {
        String locationQuery = resolveLocationQuery(event);
        if (!hasText(locationQuery)) {
            return null;
        }

        return UriComponentsBuilder.fromHttpUrl("https://www.google.com/maps/search/")
                .queryParam("api", "1")
                .queryParam("query", locationQuery)
                .build()
                .encode()
                .toUriString();
    }

    public Optional<byte[]> fetchStaticMap(Event event) {
        if (!hasServerApiKey()) {
            return Optional.empty();
        }

        String locationQuery = resolveLocationQuery(event);
        if (!hasText(locationQuery)) {
            return Optional.empty();
        }

        try {
            byte[] mapBytes = restClient.get()
                    .uri(buildStaticMapUrl(event, locationQuery))
                    .retrieve()
                    .body(byte[].class);

            if (mapBytes == null || mapBytes.length == 0) {
                return Optional.empty();
            }

            return Optional.of(mapBytes);
        } catch (Exception exception) {
            log.warn("Failed to fetch Google Static Maps preview for event {}", event != null ? event.getId() : null, exception);
            return Optional.empty();
        }
    }

    private String buildStaticMapUrl(Event event, String locationQuery) {
        int width = properties.getStaticMapWidth() != null ? properties.getStaticMapWidth() : 900;
        int height = properties.getStaticMapHeight() != null ? properties.getStaticMapHeight() : 420;
        int zoom = properties.getStaticMapZoom() != null ? properties.getStaticMapZoom() : 14;

        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl("https://maps.googleapis.com/maps/api/staticmap")
                .queryParam("size", width + "x" + height)
                .queryParam("scale", "2")
                .queryParam("zoom", zoom)
                .queryParam("maptype", "roadmap")
                .queryParam("markers", "color:0x1f8f5f|label:C|" + locationQuery)
                .queryParam("key", properties.getServerApiKey().trim());

        if (hasCoordinates(event)) {
            builder.queryParam("center", formatCoordinates(event.getLatitude(), event.getLongitude()));
        } else {
            builder.queryParam("center", locationQuery);
        }

        return builder.build().encode().toUriString();
    }

    private String resolveLocationQuery(Event event) {
        if (event == null) {
            return null;
        }

        if (hasCoordinates(event)) {
            return formatCoordinates(event.getLatitude(), event.getLongitude());
        }

        return hasText(event.getLieu()) ? event.getLieu().trim() : null;
    }

    private boolean hasCoordinates(Event event) {
        return event != null && event.getLatitude() != null && event.getLongitude() != null;
    }

    private String formatCoordinates(BigDecimal latitude, BigDecimal longitude) {
        return latitude.stripTrailingZeros().toPlainString() + "," + longitude.stripTrailingZeros().toPlainString();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
