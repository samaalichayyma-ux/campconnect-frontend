package com.esprit.campconnect.Livraison.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LivreurWithdraw {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long livreurId;

    private Double amount;

    private String status;

    private LocalDateTime createdAt;
}