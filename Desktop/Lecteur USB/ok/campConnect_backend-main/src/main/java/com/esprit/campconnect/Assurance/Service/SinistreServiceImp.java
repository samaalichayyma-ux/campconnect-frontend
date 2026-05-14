package com.esprit.campconnect.Assurance.Service;


import com.esprit.campconnect.Assurance.Entity.Sinistre;
import com.esprit.campconnect.Assurance.Entity.SouscriptionAssurance;
import com.esprit.campconnect.Assurance.Repository.SinistreRepository;
import com.esprit.campconnect.Assurance.Repository.SouscriptionAssuranceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SinistreServiceImp implements ISinistreService {

    private final SinistreRepository sinistreRepository;
    private final SouscriptionAssuranceRepository souscriptionRepository;

    @Override
    public List<Sinistre> retrieveAll() {
        return sinistreRepository.findAll();
    }

    @Override
    public Sinistre retrieveById(Long id) {
        return sinistreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sinistre introuvable"));
    }

    @Override
    public List<Sinistre> retrieveBySouscription(Long souscriptionId) {
        return sinistreRepository.findBySouscriptionAssuranceId(souscriptionId);
    }

    @Override
    public Sinistre add(Long souscriptionId, Sinistre sinistre) {
        SouscriptionAssurance souscription = souscriptionRepository.findById(souscriptionId)
                .orElseThrow(() -> new RuntimeException("Souscription introuvable"));

        sinistre.setSouscriptionAssurance(souscription);

        return sinistreRepository.save(sinistre);
    }

    @Override
    public Sinistre update(Sinistre sinistre) {
        Sinistre existing = sinistreRepository.findById(sinistre.getId())
                .orElseThrow(() -> new RuntimeException("Sinistre introuvable"));

        existing.setDateDeclaration(sinistre.getDateDeclaration());
        existing.setTypeSinistre(sinistre.getTypeSinistre());
        existing.setDescription(sinistre.getDescription());
        existing.setLieuIncident(sinistre.getLieuIncident());
        existing.setMontantEstime(sinistre.getMontantEstime());
        existing.setMontantRembourse(sinistre.getMontantRembourse());
        existing.setStatut(sinistre.getStatut());

        return sinistreRepository.save(existing);
    }

    @Override
    public void remove(Long id) {
        sinistreRepository.deleteById(id);
    }
}