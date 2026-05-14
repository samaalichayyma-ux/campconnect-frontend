package com.esprit.campconnect.Assurance.Service;


import com.esprit.campconnect.Assurance.Entity.Assurance;
import com.esprit.campconnect.Assurance.Entity.Garantie;
import com.esprit.campconnect.Assurance.Repository.AssuranceRepository;
import com.esprit.campconnect.Assurance.Repository.GarantieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GarantieServiceImp implements IGarantieService {

    private final GarantieRepository garantieRepository;
    private final AssuranceRepository assuranceRepository;

    @Override
    public List<Garantie> retrieveAll() {
        return garantieRepository.findAll();
    }

    @Override
    public Garantie retrieveById(Long id) {
        return garantieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Garantie introuvable"));
    }

    @Override
    public List<Garantie> retrieveByAssurance(Long assuranceId) {
        return garantieRepository.findByAssuranceId(assuranceId);
    }

    @Override
    public Garantie add(Long assuranceId, Garantie garantie) {
        Assurance assurance = assuranceRepository.findById(assuranceId)
                .orElseThrow(() -> new RuntimeException("Assurance introuvable"));

        garantie.setAssurance(assurance);
        return garantieRepository.save(garantie);
    }

    @Override
    public Garantie update(Garantie garantie) {
        Garantie existing = garantieRepository.findById(garantie.getId())
                .orElseThrow(() -> new RuntimeException("Garantie introuvable"));

        existing.setNom(garantie.getNom());
        existing.setDescription(garantie.getDescription());
        existing.setPlafond(garantie.getPlafond());
        existing.setFranchise(garantie.getFranchise());

        return garantieRepository.save(existing);
    }

    @Override
    public void remove(Long id) {
        garantieRepository.deleteById(id);
    }
}