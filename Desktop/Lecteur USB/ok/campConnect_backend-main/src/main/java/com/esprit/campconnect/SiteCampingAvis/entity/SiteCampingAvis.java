package com.esprit.campconnect.SiteCampingAvis.entity;

import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.siteCamping.entity.SiteCamping;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "site_camping_avis")
public class SiteCampingAvis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    Integer note;

    String commentaire;

    LocalDate dateCreation;

    @ToString.Exclude
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "site_camping_id_site")
    SiteCamping siteCamping;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    @JsonIgnore
    Utilisateur utilisateur;

    @PrePersist
    public void onCreate() {
        if (this.dateCreation == null) {
            this.dateCreation = LocalDate.now();
        }
    }

}
