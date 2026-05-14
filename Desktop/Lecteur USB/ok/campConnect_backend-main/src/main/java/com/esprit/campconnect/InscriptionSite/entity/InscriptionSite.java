package com.esprit.campconnect.InscriptionSite.entity;

import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.siteCamping.entity.SiteCamping;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;


import jakarta.persistence.*;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = {"siteCamping", "utilisateur"})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InscriptionSite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long idInscription;

    LocalDate dateDebut;
    LocalDate dateFin;
    Integer numberOfGuests;

    @Enumerated(EnumType.STRING)
    StatutInscription statut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    @JsonIgnore
    SiteCamping siteCamping;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    @JsonIgnore
    Utilisateur utilisateur;
}