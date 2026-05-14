package com.esprit.campconnect.Livraison.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LivreurLocationResponse {
    private Long livraisonId;
    private Long livreurId;
    private Double latitude;
    private Double longitude;
    private LocalDateTime updatedAt;
}