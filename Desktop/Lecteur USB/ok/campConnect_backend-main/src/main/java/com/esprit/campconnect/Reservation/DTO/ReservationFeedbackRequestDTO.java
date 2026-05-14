package com.esprit.campconnect.Reservation.DTO;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReservationFeedbackRequestDTO {

    @NotNull(message = "A rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot be higher than 5")
    private Integer rating;

    @Size(max = 1200, message = "Comment must be 1200 characters or fewer")
    private String comment;
}
