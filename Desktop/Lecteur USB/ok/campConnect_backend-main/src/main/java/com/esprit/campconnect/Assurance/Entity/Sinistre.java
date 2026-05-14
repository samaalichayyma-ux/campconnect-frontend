package com.esprit.campconnect.Assurance.Entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
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
public class Sinistre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    LocalDate dateDeclaration;

    @Enumerated(EnumType.STRING)
    TypeSinistre typeSinistre;

    String description;
    String lieuIncident;
    double montantEstime;
    double montantRembourse;

    @Enumerated(EnumType.STRING)
    StatutSinistre statut;

    @ManyToOne
    @JoinColumn(name = "souscription_id")
    @JsonIgnore
    SouscriptionAssurance souscriptionAssurance;

    @OneToMany(mappedBy = "sinistre", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Remboursement> remboursements;

    @OneToMany(mappedBy = "sinistre", cascade = CascadeType.ALL, orphanRemoval = true)
    List<DocumentAssurance> documents;
}