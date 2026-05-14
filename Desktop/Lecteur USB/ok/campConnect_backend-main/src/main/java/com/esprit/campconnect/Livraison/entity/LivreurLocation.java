package com.esprit.campconnect.Livraison.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LivreurLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long livraisonId;
    private Long livreurId;

    private Double latitude;
    private Double longitude;

    private LocalDateTime updatedAt;
}