package com.esprit.campconnect.User.Controller;

import com.esprit.campconnect.User.DTO.ProfilDTO;
import com.esprit.campconnect.User.Entity.Profil;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class CurrentProfileController {

    private final UtilisateurRepository utilisateurRepository;

    @GetMapping("/me")
    public ProfilDTO getProfile(Authentication authentication) {
        if (authentication == null) {
            throw new RuntimeException("Utilisateur non authentifie");
        }

        String email = authentication.getName();

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow();

        Profil profil = utilisateur.getProfil();

        if (profil == null) {
            return new ProfilDTO("", "", "");
        }

        return new ProfilDTO(
                profil.getAdresse(),
                profil.getPhoto(),
                profil.getBiographie()
        );
    }

    @PutMapping("/me")
    public ProfilDTO updateProfile(@RequestBody ProfilDTO profilData,
                                   Authentication authentication) {
        if (authentication == null) {
            throw new RuntimeException("Utilisateur non authentifie");
        }

        String email = authentication.getName();

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow();

        Profil profil = utilisateur.getProfil();

        if (profil == null) {
            profil = new Profil();
            profil.setUtilisateur(utilisateur);
            utilisateur.setProfil(profil);
        }

        profil.setAdresse(profilData.getAdresse());
        profil.setPhoto(profilData.getPhoto());
        profil.setBiographie(profilData.getBiographie());

        utilisateurRepository.save(utilisateur);

        return new ProfilDTO(
                profil.getAdresse(),
                profil.getPhoto(),
                profil.getBiographie()
        );
    }
}
