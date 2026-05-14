package com.esprit.campconnect.Reservation.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PromotionEventSummaryDTO {

    private Long id;
    private String titre;
    private String lieu;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
}
