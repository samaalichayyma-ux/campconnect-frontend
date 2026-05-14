package com.esprit.campconnect.Restauration.Service;

import com.esprit.campconnect.Restauration.Entity.Repas;
import com.esprit.campconnect.Restauration.Repository.RepasRepository;
import org.springframework.stereotype.Service;
import java.util.List;
@Service

public class RepasServiceImpl implements RepasService {

    private final RepasRepository repasRepository;

    public RepasServiceImpl(RepasRepository repasRepository) {
        this.repasRepository = repasRepository;
    }

    @Override
    public Repas createRepas(Repas repas) {
        return repasRepository.save(repas);
    }

    @Override
    public List<Repas> getAllRepas() {
        return repasRepository.findAll();
    }

    @Override
    public Repas getRepasById(Long id) {
        return repasRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Repas introuvable"));
    }

    @Override
    public Repas updateRepas(Long id, Repas repas) {
        Repas existing = getRepasById(id);
        existing.setNom(repas.getNom());
        existing.setPrix(repas.getPrix());
        return repasRepository.save(existing);
    }

    @Override
    public void deleteRepas(Long id) {
        repasRepository.deleteById(id);
    }
}
