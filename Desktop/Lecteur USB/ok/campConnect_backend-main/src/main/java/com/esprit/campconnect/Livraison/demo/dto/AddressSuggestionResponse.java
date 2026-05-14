package com.esprit.campconnect.Livraison.demo.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AddressSuggestionResponse {
    private String displayName;
    private Double latitude;
    private Double longitude;
}