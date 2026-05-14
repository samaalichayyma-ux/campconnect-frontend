package com.esprit.campconnect.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.ZoneId;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.calendar")
public class CalendarExportProperties {

    private String defaultZone = "Africa/Lagos";

    public ZoneId resolveZoneId() {
        try {
            return ZoneId.of(defaultZone != null && !defaultZone.isBlank() ? defaultZone.trim() : "Africa/Lagos");
        } catch (Exception exception) {
            return ZoneId.of("Africa/Lagos");
        }
    }
}
