package com.esprit.campconnect.Event.DTO;

import com.esprit.campconnect.Event.Enum.RecurrenceFrequency;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EventDuplicateRequestDTO {

    @NotNull(message = "La frequence de recurrence est requise")
    private RecurrenceFrequency frequency;

    @NotNull(message = "Le nombre d'occurrences est requis")
    @Min(value = 1, message = "Le nombre d'occurrences doit etre au minimum 1")
    @Max(value = 24, message = "Le nombre d'occurrences ne peut pas depasser 24")
    private Integer occurrences;

    private Boolean publishCopies = false;
}
