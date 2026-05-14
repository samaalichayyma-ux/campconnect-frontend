package com.esprit.campconnect.Assurance.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class Remboursement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    LocalDate dateRemboursement;
    double montant;

    @Enumerated(EnumType.STRING)
    StatutRemboursement statut;

    String motif;

    @ManyToOne
    @JoinColumn(name = "sinistre_id")
    @JsonIgnore
    Sinistre sinistre;
}