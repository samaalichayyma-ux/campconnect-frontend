package com.esprit.campconnect.Assurance.Service;

import com.esprit.campconnect.Assurance.Entity.Assurance;
import com.esprit.campconnect.Assurance.Entity.SouscriptionAssurance;
import com.esprit.campconnect.Assurance.Repository.AssuranceRepository;
import com.esprit.campconnect.Assurance.Repository.SouscriptionAssuranceRepository;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SouscriptionAssuranceServiceImp implements ISouscriptionAssuranceService {

    private final SouscriptionAssuranceRepository souscriptionRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final AssuranceRepository assuranceRepository;

    @Override
    public List<SouscriptionAssurance> retrieveAll() {
        return souscriptionRepository.findAll();
    }

    @Override
    public SouscriptionAssurance retrieveById(Long id) {
        return souscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Souscription introuvable"));
    }

    @Override
    public List<SouscriptionAssurance> retrieveByUtilisateur(Long utilisateurId) {
        return souscriptionRepository.findByUtilisateurId(utilisateurId);
    }

    @Override
    public SouscriptionAssurance add(Long utilisateurId, Long assuranceId, SouscriptionAssurance souscription) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        Assurance assurance = assuranceRepository.findById(assuranceId)
                .orElseThrow(() -> new RuntimeException("Assurance introuvable"));

        souscription.setUtilisateur(utilisateur);
        souscription.setAssurance(assurance);

        return souscriptionRepository.save(souscription);
    }

    @Override
    public SouscriptionAssurance update(SouscriptionAssurance souscription) {
        SouscriptionAssurance existing = souscriptionRepository.findById(souscription.getId())
                .orElseThrow(() -> new RuntimeException("Souscription introuvable"));

        existing.setNumeroContrat(souscription.getNumeroContrat());
        existing.setDateSouscription(souscription.getDateSouscription());
        existing.setDateDebut(souscription.getDateDebut());
        existing.setDateFin(souscription.getDateFin());
        existing.setStatut(souscription.getStatut());
        existing.setMontantPaye(souscription.getMontantPaye());
        existing.setBeneficiaireNom(souscription.getBeneficiaireNom());
        existing.setBeneficiaireTelephone(souscription.getBeneficiaireTelephone());

        return souscriptionRepository.save(existing);
    }

    @Override
    public void remove(Long id) {
        souscriptionRepository.deleteById(id);
    }
}
