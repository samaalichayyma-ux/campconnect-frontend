package com.esprit.campconnect.Assurance.Service;

import com.esprit.campconnect.Assurance.Entity.SouscriptionAssurance;

import java.util.List;

public interface ISouscriptionAssuranceService {
    List<SouscriptionAssurance> retrieveAll();
    SouscriptionAssurance retrieveById(Long id);
    List<SouscriptionAssurance> retrieveByUtilisateur(Long utilisateurId);
    SouscriptionAssurance add(Long utilisateurId, Long assuranceId, SouscriptionAssurance souscription);
    SouscriptionAssurance update(SouscriptionAssurance souscription);
    void remove(Long id);
}
