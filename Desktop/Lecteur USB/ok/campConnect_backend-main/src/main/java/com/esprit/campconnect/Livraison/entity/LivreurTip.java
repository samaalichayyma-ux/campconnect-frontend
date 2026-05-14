package com.esprit.campconnect.Livraison.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LivreurTip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long livraisonId;
    private Long clientId;
    private Long livreurId;

    private Double amount;

    private Integer rating;
    private String comment;

    private LocalDateTime createdAt;
}