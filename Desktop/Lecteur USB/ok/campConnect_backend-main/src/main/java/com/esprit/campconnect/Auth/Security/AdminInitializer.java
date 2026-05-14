package com.esprit.campconnect.Auth.Security;

import com.esprit.campconnect.User.Entity.Role;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        if(utilisateurRepository.findByEmail("admin123@campconnect.com").isEmpty()) {

            Utilisateur admin = new Utilisateur();

            admin.setNom("CampConnect");
            admin.setEmail("admin123@campconnect.com");
            admin.setMotDePasse(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMINISTRATEUR);

            utilisateurRepository.save(admin);
        }
    }
}

