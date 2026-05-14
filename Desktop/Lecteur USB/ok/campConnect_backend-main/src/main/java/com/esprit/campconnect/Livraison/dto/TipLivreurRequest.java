package com.esprit.campconnect.Livraison.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TipLivreurRequest {

    @NotNull
    @Min(1)
    @Max(5)
    private Integer rating;

    @Min(0)
    private Double amount;

    private String comment;
}