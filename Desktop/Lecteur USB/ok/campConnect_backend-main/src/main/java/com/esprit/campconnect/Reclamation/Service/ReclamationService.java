package com.esprit.campconnect.Reclamation.Service;

import com.esprit.campconnect.Reclamation.Entity.Reclamation;
import com.esprit.campconnect.Reclamation.Entity.StatutReclamation;
import java.util.List;

public interface ReclamationService  {
    Reclamation createReclamation(Reclamation reclamation);
List<Reclamation> getAllReclamations();
Reclamation getReclamationById(Long id);
Reclamation updateReclamation(Long id, Reclamation reclamation);
void deleteReclamation(Long id);

Reclamation changerStatut(Long id, StatutReclamation statut);
List<Reclamation> getReclamationsByStatut(StatutReclamation statut);
List<Reclamation> getReclamationsByUtilisateur(Long utilisateurId);
long countReclamationsEnCours();
}
