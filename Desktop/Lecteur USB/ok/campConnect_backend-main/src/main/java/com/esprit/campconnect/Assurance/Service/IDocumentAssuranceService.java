package com.esprit.campconnect.Assurance.Service;

import com.esprit.campconnect.Assurance.Entity.DocumentAssurance;

import java.util.List;

public interface IDocumentAssuranceService {
    List<DocumentAssurance> retrieveAll();
    DocumentAssurance retrieveById(Long id);
    List<DocumentAssurance> retrieveBySinistre(Long sinistreId);
    DocumentAssurance add(Long sinistreId, DocumentAssurance documentAssurance);
    DocumentAssurance update(DocumentAssurance documentAssurance);
    void remove(Long id);
}