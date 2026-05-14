package com.esprit.campconnect.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.google-maps")
public class GoogleMapsProperties {

    private String browserApiKey;
    private String serverApiKey;
    private Integer staticMapWidth = 900;
    private Integer staticMapHeight = 420;
    private Integer staticMapZoom = 14;
}
