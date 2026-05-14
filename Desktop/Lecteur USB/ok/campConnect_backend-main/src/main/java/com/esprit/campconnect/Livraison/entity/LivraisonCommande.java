package com.esprit.campconnect.Livraison.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = "livraison")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LivraisonCommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "livraison_id", nullable = false, unique = true)
    @JsonIgnore
    Livraison livraison;

    @Column(nullable = false)
    Long commandeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    TypeCommandeLivraison typeCommande;
}