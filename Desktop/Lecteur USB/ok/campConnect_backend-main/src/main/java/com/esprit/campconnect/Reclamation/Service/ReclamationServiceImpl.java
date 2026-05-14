package com.esprit.campconnect.Reclamation.Service;

import com.esprit.campconnect.Reclamation.Entity.Reclamation;
import com.esprit.campconnect.Reclamation.Entity.StatutReclamation;
import com.esprit.campconnect.Reclamation.Repository.ReclamationRepository;

import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
@Service
public class ReclamationServiceImpl implements ReclamationService {

    private final ReclamationRepository reclamationRepository;

    public ReclamationServiceImpl(ReclamationRepository reclamationRepository) {
        this.reclamationRepository = reclamationRepository;
    }

    @Override
    public Reclamation createReclamation(Reclamation reclamation) {
        reclamation.setDateCreation(LocalDate.now());
        if (reclamation.getStatut() == null) {
            reclamation.setStatut(StatutReclamation.EN_COURS);
        }
        return reclamationRepository.save(reclamation);
    }

    @Override
    public List<Reclamation> getAllReclamations() {
        return reclamationRepository.findAll();
    }

    @Override
    public Reclamation getReclamationById(Long id) {
        return reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
    }

    @Override
    public Reclamation updateReclamation(Long id, Reclamation reclamation) {
        Reclamation existing = getReclamationById(id);
        existing.setDescription(reclamation.getDescription());
        existing.setStatut(reclamation.getStatut());
        return reclamationRepository.save(existing);
    }

    @Override
    public void deleteReclamation(Long id) {
        reclamationRepository.deleteById(id);
    }

    @Override
    public Reclamation changerStatut(Long id, StatutReclamation statut) {
        Reclamation reclamation = getReclamationById(id);
        reclamation.setStatut(statut);
        return reclamationRepository.save(reclamation);
    }

    @Override
    public List<Reclamation> getReclamationsByStatut(StatutReclamation statut) {
        return reclamationRepository.findByStatut(statut);
    }

    @Override
    public List<Reclamation> getReclamationsByUtilisateur(Long utilisateurId) {
        return reclamationRepository.findByUtilisateurId(utilisateurId);
    }

    @Override
    public long countReclamationsEnCours() {
        return reclamationRepository.countByStatut(StatutReclamation.EN_COURS);
    }
}