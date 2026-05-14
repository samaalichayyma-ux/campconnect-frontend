package com.esprit.campconnect.Assurance.Entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class Garantie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    String nom;
    String description;
    double plafond;
    double franchise;

    @ManyToOne
    @JoinColumn(name = "assurance_id")
    @JsonIgnore
    Assurance assurance;
}