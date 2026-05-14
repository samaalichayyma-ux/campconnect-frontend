package com.esprit.campconnect.Livraison.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LivreurLocationUpdateRequest {
    private Double latitude;
    private Double longitude;
}