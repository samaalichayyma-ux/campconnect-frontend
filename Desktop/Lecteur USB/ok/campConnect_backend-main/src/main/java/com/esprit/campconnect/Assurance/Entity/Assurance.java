package com.esprit.campconnect.Assurance.Entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class Assurance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    String titre;
    String description;

    @Enumerated(EnumType.STRING)
    TypeAssurance typeAssurance;

    double montantCouverture;
    double prime;
    int dureeValidite;
    String conditionsGenerales;
    boolean active;

    @OneToMany(mappedBy = "assurance", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    List<Garantie> garanties;

    @OneToMany(mappedBy = "assurance", cascade = CascadeType.ALL)
    @JsonIgnore
    List<SouscriptionAssurance> souscriptions;
}