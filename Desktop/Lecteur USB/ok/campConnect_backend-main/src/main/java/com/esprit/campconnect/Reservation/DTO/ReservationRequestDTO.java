package com.esprit.campconnect.Reservation.DTO;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ReservationRequestDTO {

    private Long utilisateurId;

    @NotNull(message = "Event ID is required")
    private Long eventId;

    @NotNull(message = "Participant count is required")
    @Min(value = 1, message = "At least 1 participant is required")
    @Max(value = 100, message = "A reservation cannot exceed 100 participants")
    private Integer nombreParticipants;

    @Size(max = 500, message = "Remarks cannot exceed 500 characters")
    private String remarques;

    @Size(max = 64, message = "Promo code cannot exceed 64 characters")
    private String promoCode;
}
