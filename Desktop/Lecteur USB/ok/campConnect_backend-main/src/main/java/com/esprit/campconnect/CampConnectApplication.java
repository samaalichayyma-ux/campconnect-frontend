package com.esprit.campconnect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CampConnectApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampConnectApplication.class, args);
    }

}
