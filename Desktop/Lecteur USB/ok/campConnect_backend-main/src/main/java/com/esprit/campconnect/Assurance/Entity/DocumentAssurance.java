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
public class DocumentAssurance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    String nomFichier;

    @Enumerated(EnumType.STRING)
    TypeDocumentAssurance typeDocument;

    String url;
    LocalDate dateAjout;

    @ManyToOne
    @JoinColumn(name = "sinistre_id")
    @JsonIgnore
    Sinistre sinistre;

    @PrePersist
    public void onCreate() {
        this.dateAjout = LocalDate.now();
    }
}