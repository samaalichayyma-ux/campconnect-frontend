package com.esprit.campconnect.Assurance.Entity;


import com.esprit.campconnect.User.Entity.Utilisateur;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class SouscriptionAssurance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    String numeroContrat;
    LocalDate dateSouscription;
    LocalDate dateDebut;
    LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    StatutSouscription statut;

    double montantPaye;
    String beneficiaireNom;
    String beneficiaireTelephone;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    @JsonIgnoreProperties({"motDePasse", "authorities", "profil"})
    Utilisateur utilisateur;

    @ManyToOne
    @JoinColumn(name = "assurance_id")
    Assurance assurance;

    @OneToMany(mappedBy = "souscriptionAssurance", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Sinistre> sinistres;
}