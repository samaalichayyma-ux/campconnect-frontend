package com.esprit.campconnect.Reclamation.Entity;
import com.esprit.campconnect.User.Entity.Utilisateur;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Reclamation {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String description;

        private LocalDate dateCreation;

        @Enumerated(EnumType.STRING)
        private StatutReclamation statut;

        @ManyToOne
        @JoinColumn(name = "utilisateur_id")
        private Utilisateur utilisateur;

        public Reclamation() {
        }

        public Reclamation(Long id, String description, LocalDate dateCreation, StatutReclamation statut, Utilisateur utilisateur) {
            this.id = id;
            this.description = description;
            this.dateCreation = dateCreation;
            this.statut = statut;
            this.utilisateur = utilisateur;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public LocalDate getDateCreation() { return dateCreation; }
        public void setDateCreation(LocalDate dateCreation) { this.dateCreation = dateCreation; }

        public StatutReclamation getStatut() { return statut; }
        public void setStatut(StatutReclamation statut) { this.statut = statut; }

        public Utilisateur getUtilisateur() { return utilisateur; }
        public void setUtilisateur(Utilisateur utilisateur) { this.utilisateur = utilisateur; }
    }
