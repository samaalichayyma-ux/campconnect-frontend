package com.esprit.campconnect.siteCamping.entity;

import com.esprit.campconnect.InscriptionSite.entity.InscriptionSite;
import com.esprit.campconnect.SiteCampingAvis.entity.SiteCampingAvis;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class SiteCamping {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idSite;

    String nom;

    String localisation;

    Integer capacite;

    double prixParNuit;
    String imageUrl;
    String imagePublicId;
    String description;

    @Enumerated(EnumType.STRING)
    StatutDispo statutDispo;

    @ToString.Exclude
    @JsonIgnore
    @OneToMany(mappedBy = "siteCamping")
    Set<InscriptionSite> inscriptions;

    @OneToMany(mappedBy = "siteCamping")
    @JsonIgnore
    Set<SiteCampingAvis> avis = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    @JsonIgnore
    Utilisateur owner;
}
