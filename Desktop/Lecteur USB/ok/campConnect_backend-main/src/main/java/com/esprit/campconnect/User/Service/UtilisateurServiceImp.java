package com.esprit.campconnect.User.Service;


import com.esprit.campconnect.User.Entity.Profil;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.ProfilRepository;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UtilisateurServiceImp implements IUtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final ProfilRepository profilRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<Utilisateur> retrieveAllUtilisateurs() {
        return utilisateurRepository.findAll();
    }

    @Override
    public Utilisateur retrieveUtilisateur(Long id) {
        return utilisateurRepository.findById(id).orElse(null);
    }

    @Override
    public Utilisateur addUtilisateur(Utilisateur utilisateur) {
        if (utilisateur.getMotDePasse() != null && !utilisateur.getMotDePasse().isBlank()) {
            utilisateur.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));
        }

        if (utilisateur.getProfil() == null) {
            Profil profil = new Profil();
            profil.setAdresse("");
            profil.setPhoto("");
            profil.setBiographie("");
            profil.setUtilisateur(utilisateur);
            utilisateur.setProfil(profil);
        } else {
            utilisateur.getProfil().setUtilisateur(utilisateur);
        }

        return utilisateurRepository.save(utilisateur);
    }
    @Override
    public Utilisateur updateUtilisateur(Utilisateur utilisateur) {
        Utilisateur existingUser = utilisateurRepository.findById(utilisateur.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        existingUser.setNom(utilisateur.getNom());
        existingUser.setEmail(utilisateur.getEmail());
        existingUser.setTelephone(utilisateur.getTelephone());
        existingUser.setRole(utilisateur.getRole());

        if (utilisateur.getProfil() != null) {
            Profil profil = existingUser.getProfil();

            if (profil == null) {
                profil = new Profil();
                profil.setUtilisateur(existingUser);
                existingUser.setProfil(profil);
            }

            profil.setAdresse(utilisateur.getProfil().getAdresse());
            profil.setPhoto(utilisateur.getProfil().getPhoto());
            profil.setBiographie(utilisateur.getProfil().getBiographie());
        }

        return utilisateurRepository.save(existingUser);
    }

    @Override
    @Transactional
    public void removeUtilisateur(Long id) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable avec id : " + id));

        Profil profil = utilisateur.getProfil();

        // casser la relation des deux côtés
        if (profil != null) {
            profil.setUtilisateur(null);
            utilisateur.setProfil(null);
        }

        // supprimer l'utilisateur
        utilisateurRepository.delete(utilisateur);

        // sécurité supplémentaire : supprimer explicitement le profil
        if (profil != null && profil.getId() != null) {
            profilRepository.deleteById(profil.getId());
        }
    }

}
