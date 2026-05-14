package com.esprit.campconnect.Assurance.Service;


import com.esprit.campconnect.Assurance.Entity.Garantie;

import java.util.List;

public interface IGarantieService {
    List<Garantie> retrieveAll();
    Garantie retrieveById(Long id);
    List<Garantie> retrieveByAssurance(Long assuranceId);
    Garantie add(Long assuranceId, Garantie garantie);
    Garantie update(Garantie garantie);
    void remove(Long id);
}
