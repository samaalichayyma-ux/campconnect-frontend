package com.esprit.campconnect.Restauration.Entity;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
public class LigneCommandeRepas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int quantite;
    private double prixUnitaire;

    @ManyToOne
    @JoinColumn(name = "commande_id")
    @JsonBackReference
    private CommandeRepas commandeRepas;

    @ManyToOne
    @JoinColumn(name = "repas_id")
    private Repas repas;

    public LigneCommandeRepas() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getQuantite() { return quantite; }
    public void setQuantite(int quantite) { this.quantite = quantite; }

    public double getPrixUnitaire() { return prixUnitaire; }
    public void setPrixUnitaire(double prixUnitaire) { this.prixUnitaire = prixUnitaire; }

    public CommandeRepas getCommandeRepas() { return commandeRepas; }
    public void setCommandeRepas(CommandeRepas commandeRepas) { this.commandeRepas = commandeRepas; }

    public Repas getRepas() { return repas; }
    public void setRepas(Repas repas) { this.repas = repas; }
}
