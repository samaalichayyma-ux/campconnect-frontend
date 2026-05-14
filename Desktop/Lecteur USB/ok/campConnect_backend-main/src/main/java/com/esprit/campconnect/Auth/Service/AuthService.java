package com.esprit.campconnect.Auth.Service;

import com.esprit.campconnect.Auth.DTO.*;
import com.esprit.campconnect.Auth.Entity.PasswordResetToken;
import com.esprit.campconnect.Auth.Repository.PasswordResetTokenRepository;
import com.esprit.campconnect.Auth.Security.JwtService;
import com.esprit.campconnect.Mail.Service.IMailService;
import com.esprit.campconnect.Notification.Entity.NotificationType;
import com.esprit.campconnect.Notification.Service.INotificationUserService;
import com.esprit.campconnect.User.Entity.Profil;
import com.esprit.campconnect.User.Entity.Role;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    private final PasswordValidatorService passwordValidatorService;
    private final IMailService mailService;
    private final INotificationUserService notificationUserService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    private final GoogleAuthService googleAuthService;
    private final TwoFactorAuthService twoFactorAuthService;

    public AuthResponse register(RegisterRequest request) {
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse(null, null, "Email déjà utilisé", null, false, null);
        }

        passwordValidatorService.validate(request.getMotDePasse());

        Profil profil = new Profil();
        profil.setAdresse("");
        profil.setPhoto("");
        profil.setBiographie("");

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(request.getNom());
        utilisateur.setEmail(request.getEmail());
        utilisateur.setTelephone(request.getTelephone());
        utilisateur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        utilisateur.setRole(Role.CLIENT);

        utilisateur.setProfil(profil);
        profil.setUtilisateur(utilisateur);

        Utilisateur savedUser = utilisateurRepository.save(utilisateur);

        notificationUserService.createNotification(
                savedUser,
                "Bienvenue sur CampConnect",
                "Votre compte a été créé avec succès.",
                NotificationType.WELCOME
        );

        mailService.sendMail(
                savedUser.getEmail(),
                "Bienvenue sur CampConnect",
                "Bonjour " + savedUser.getNom() + ",\n\nVotre compte CampConnect a été créé avec succès."
        );

        String jwtToken = jwtService.generateToken(savedUser);

        return new AuthResponse(
                utilisateur.getId(),
                jwtToken,
                "Inscription réussie",
                utilisateur.getRole().name(),
                false,
                null
        );
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getMotDePasse()
                )
        );

        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (utilisateur.isTwoFactorEnabled()) {
            String tempToken = jwtService.generateTemp2FAToken(utilisateur);

            return new AuthResponse(
                    utilisateur.getId(),
                    null,
                    "Code OTP requis",
                    utilisateur.getRole().name(),
                    true,
                    tempToken
            );
        }

        String jwtToken = jwtService.generateToken(utilisateur);

        return new AuthResponse(
                utilisateur.getId(),
                jwtToken,
                "Connexion réussie",
                utilisateur.getRole().name(),
                false,
                null
        );
    }

    public String forgotPassword(ForgotPasswordRequest request) {
        System.out.println("🔥 forgotPassword appelé avec email = " + request.getEmail());

        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        System.out.println("✅ Utilisateur trouvé : " + utilisateur.getEmail());

        String token = java.util.UUID.randomUUID().toString();

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUtilisateur(utilisateur);
        resetToken.setUsed(false);
        resetToken.setExpirationDate(LocalDateTime.now().plusMinutes(15));

        passwordResetTokenRepository.save(resetToken);
        System.out.println("✅ Token enregistré : " + token);

        String resetLink = "http://localhost:4200/reset-password?token=" + token;
        System.out.println("🔗 Reset link : " + resetLink);

        mailService.sendMail(
                utilisateur.getEmail(),
                "Réinitialisation du mot de passe",
                "Cliquez sur ce lien pour réinitialiser votre mot de passe : \n" + resetLink
        );

        System.out.println("✅ Fin forgotPassword");

        return "Email envoyé avec succès";
    }

    public String resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Token invalide"));

        if (resetToken.isUsed()) {
            throw new RuntimeException("Token déjà utilisé");
        }

        if (resetToken.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expiré");
        }

        passwordValidatorService.validate(request.getNewPassword());

        Utilisateur utilisateur = resetToken.getUtilisateur();
        utilisateur.setMotDePasse(passwordEncoder.encode(request.getNewPassword()));

        utilisateurRepository.save(utilisateur);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        notificationUserService.createNotification(
                utilisateur,
                "Mot de passe modifié",
                "Votre mot de passe a été modifié avec succès",
                NotificationType.SECURITY
        );

        return "Mot de passe mis à jour avec succès";
    }

    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        Utilisateur googleUser = googleAuthService.verifyGoogleUser(request.getCredential());

        Utilisateur utilisateur = utilisateurRepository.findByEmail(googleUser.getEmail())
                .orElseGet(() -> {
                    Profil profil = new Profil();
                    profil.setAdresse("");
                    profil.setPhoto("");
                    profil.setBiographie("");

                    Utilisateur newUser = new Utilisateur();
                    newUser.setNom(googleUser.getNom());
                    newUser.setEmail(googleUser.getEmail());
                    newUser.setTelephone("");
                    newUser.setMotDePasse(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
                    newUser.setRole(Role.CLIENT);
                    newUser.setProfil(profil);
                    profil.setUtilisateur(newUser);

                    Utilisateur savedUser = utilisateurRepository.save(newUser);

                    notificationUserService.createNotification(
                            savedUser,
                            "Connexion Google activée",
                            "Votre compte a été créé via Google avec succès.",
                            NotificationType.GOOGLE_LOGIN
                    );

                    mailService.sendMail(
                            savedUser.getEmail(),
                            "Bienvenue sur CampConnect",
                            "Bonjour " + savedUser.getNom() + ",\n\nVotre compte a été créé via Google."
                    );

                    return savedUser;
                });

        String jwtToken = jwtService.generateToken(utilisateur);

        return new AuthResponse(
                utilisateur.getId(),
                jwtToken,
                "Connexion Google réussie",
                utilisateur.getRole().name(),
                false,
                null
        );
    }

    public AuthResponse verifyLogin2FA(VerifyLogin2FARequest request) {
        String email = jwtService.extractUsername(request.getTempToken());

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!jwtService.isTemp2FATokenValid(request.getTempToken(), utilisateur)) {
            throw new RuntimeException("Temp token invalide ou expiré");
        }

        boolean validOtp = twoFactorAuthService.verifyCodeForLogin(email, request.getCode());

        if (!validOtp) {
            throw new RuntimeException("Code OTP invalide");
        }

        String jwtToken = jwtService.generateToken(utilisateur);

        return new AuthResponse(
                utilisateur.getId(),
                jwtToken,
                "Connexion réussie",
                utilisateur.getRole().name(),
                false,
                null
        );
    }
}