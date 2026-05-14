package com.esprit.campconnect.Assurance.Service;

import com.esprit.campconnect.Assurance.Entity.DocumentAssurance;
import com.esprit.campconnect.Assurance.Entity.Sinistre;
import com.esprit.campconnect.Assurance.Repository.DocumentAssuranceRepository;
import com.esprit.campconnect.Assurance.Repository.SinistreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentAssuranceServiceImp implements IDocumentAssuranceService {

    private final DocumentAssuranceRepository documentRepository;
    private final SinistreRepository sinistreRepository;

    @Override
    public List<DocumentAssurance> retrieveAll() {
        return documentRepository.findAll();
    }

    @Override
    public DocumentAssurance retrieveById(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document introuvable"));
    }

    @Override
    public List<DocumentAssurance> retrieveBySinistre(Long sinistreId) {
        return documentRepository.findBySinistreId(sinistreId);
    }

    @Override
    public DocumentAssurance add(Long sinistreId, DocumentAssurance documentAssurance) {
        Sinistre sinistre = sinistreRepository.findById(sinistreId)
                .orElseThrow(() -> new RuntimeException("Sinistre introuvable"));

        documentAssurance.setSinistre(sinistre);
        return documentRepository.save(documentAssurance);
    }

    @Override
    public DocumentAssurance update(DocumentAssurance documentAssurance) {
        DocumentAssurance existing = documentRepository.findById(documentAssurance.getId())
                .orElseThrow(() -> new RuntimeException("Document introuvable"));

        existing.setNomFichier(documentAssurance.getNomFichier());
        existing.setTypeDocument(documentAssurance.getTypeDocument());
        existing.setUrl(documentAssurance.getUrl());

        return documentRepository.save(existing);
    }

    @Override
    public void remove(Long id) {
        documentRepository.deleteById(id);
    }
}