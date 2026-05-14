package com.esprit.campconnect.Assurance.Service;

import com.esprit.campconnect.Assurance.Entity.Remboursement;

import java.util.List;

public interface IRemboursementService {
    List<Remboursement> retrieveAll();
    Remboursement retrieveById(Long id);
    List<Remboursement> retrieveBySinistre(Long sinistreId);
    Remboursement add(Long sinistreId, Remboursement remboursement);
    Remboursement update(Remboursement remboursement);
    void remove(Long id);
}