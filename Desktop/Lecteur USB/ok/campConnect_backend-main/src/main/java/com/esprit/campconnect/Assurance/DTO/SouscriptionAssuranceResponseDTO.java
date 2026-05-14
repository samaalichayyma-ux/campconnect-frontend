package com.esprit.campconnect.Assurance.DTO;

import java.time.LocalDate;

public class SouscriptionAssuranceResponseDTO {
    private Long id;
    private String numeroContrat;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String statut;
    private Double montantPaye;
    private String beneficiaireNom;
    private String beneficiaireTelephone;
    private Long utilisateurId;
    private Long assuranceId;
    private String assuranceTitre;
}
