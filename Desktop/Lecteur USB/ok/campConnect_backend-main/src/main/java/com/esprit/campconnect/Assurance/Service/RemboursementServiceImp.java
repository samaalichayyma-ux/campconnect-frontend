package com.esprit.campconnect.Assurance.Service;


import com.esprit.campconnect.Assurance.Entity.Remboursement;
import com.esprit.campconnect.Assurance.Entity.Sinistre;
import com.esprit.campconnect.Assurance.Repository.RemboursementRepository;
import com.esprit.campconnect.Assurance.Repository.SinistreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RemboursementServiceImp implements IRemboursementService {

    private final RemboursementRepository remboursementRepository;
    private final SinistreRepository sinistreRepository;

    @Override
    public List<Remboursement> retrieveAll() {
        return remboursementRepository.findAll();
    }

    @Override
    public Remboursement retrieveById(Long id) {
        return remboursementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Remboursement introuvable"));
    }

    @Override
    public List<Remboursement> retrieveBySinistre(Long sinistreId) {
        return remboursementRepository.findBySinistreId(sinistreId);
    }

    @Override
    public Remboursement add(Long sinistreId, Remboursement remboursement) {
        Sinistre sinistre = sinistreRepository.findById(sinistreId)
                .orElseThrow(() -> new RuntimeException("Sinistre introuvable"));

        remboursement.setSinistre(sinistre);
        return remboursementRepository.save(remboursement);
    }

    @Override
    public Remboursement update(Remboursement remboursement) {
        Remboursement existing = remboursementRepository.findById(remboursement.getId())
                .orElseThrow(() -> new RuntimeException("Remboursement introuvable"));

        existing.setDateRemboursement(remboursement.getDateRemboursement());
        existing.setMontant(remboursement.getMontant());
        existing.setStatut(remboursement.getStatut());
        existing.setMotif(remboursement.getMotif());

        return remboursementRepository.save(existing);
    }

    @Override
    public void remove(Long id) {
        remboursementRepository.deleteById(id);
    }
}
