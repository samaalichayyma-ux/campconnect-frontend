package com.esprit.campconnect.Restauration.Service;

import com.esprit.campconnect.Restauration.Entity.Repas;

import java.util.List;

public interface RepasService {
    Repas createRepas(Repas repas);
    List<Repas> getAllRepas();
    Repas getRepasById(Long id);
    Repas updateRepas(Long id, Repas repas);
    void deleteRepas(Long id);
}
