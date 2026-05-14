package com.esprit.campconnect.Livraison.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AdminLivreurWalletResponse {
    private Long livreurId;
    private String livreurNom;
    private String livreurEmail;
    private Double balance;
}