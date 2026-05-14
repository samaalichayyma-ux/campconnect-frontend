package com.esprit.campconnect.Assurance.Service;


import com.esprit.campconnect.Assurance.Entity.Assurance;
import com.esprit.campconnect.Assurance.Repository.AssuranceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AssuranceServiceImp implements IAssuranceService {

    private final AssuranceRepository assuranceRepository;

    @Override
    public List<Assurance> retrieveAll() {
        return assuranceRepository.findAll();
    }

    @Override
    public Assurance retrieveById(Long id) {
        return assuranceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assurance introuvable"));
    }

    @Override
    public Assurance add(Assurance assurance) {
        return assuranceRepository.save(assurance);
    }

    @Override
    public Assurance update(Assurance assurance) {
        Assurance existing = assuranceRepository.findById(assurance.getId())
                .orElseThrow(() -> new RuntimeException("Assurance introuvable"));

        existing.setTitre(assurance.getTitre());
        existing.setDescription(assurance.getDescription());
        existing.setTypeAssurance(assurance.getTypeAssurance());
        existing.setMontantCouverture(assurance.getMontantCouverture());
        existing.setPrime(assurance.getPrime());
        existing.setDureeValidite(assurance.getDureeValidite());
        existing.setConditionsGenerales(assurance.getConditionsGenerales());
        existing.setActive(assurance.isActive());

        return assuranceRepository.save(existing);
    }

    @Override
    public void remove(Long id) {
        assuranceRepository.deleteById(id);
    }
}