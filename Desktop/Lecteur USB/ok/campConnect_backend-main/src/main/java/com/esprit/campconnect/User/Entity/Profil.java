package com.esprit.campconnect.User.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;



@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = "utilisateur")
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Profil {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    String adresse;

    String photo;

    String biographie;

    @JsonIgnore
    @OneToOne(mappedBy = "profil")
    Utilisateur utilisateur;



}
