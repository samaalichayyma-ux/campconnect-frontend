package com.esprit.campconnect.MarketPlace.Code.Service;

import com.esprit.campconnect.MarketPlace.Code.Entity.CheckoutVerificationCode;
import com.esprit.campconnect.MarketPlace.Code.Repository.CheckoutVerificationCodeRepository;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
@Service
public class CheckoutVerificationService {

    private final CheckoutVerificationCodeRepository codeRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ISmsService smsService;

    public CheckoutVerificationService(
            CheckoutVerificationCodeRepository codeRepository,
            UtilisateurRepository utilisateurRepository,
            ISmsService smsService
    ) {
        this.codeRepository = codeRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.smsService = smsService;
    }

  public String sendCheckoutCode(Long userId) {

    Utilisateur user = utilisateurRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable."));

    String code = String.format("%06d", new Random().nextInt(1000000));

    System.out.println("=================================");
    System.out.println("CODE CHECKOUT = " + code);
    System.out.println("USER ID = " + userId);
    System.out.println("=================================");

    // Création du code de vérification
    CheckoutVerificationCode verificationCode =
            new CheckoutVerificationCode();

    verificationCode.setUserId(userId);
    verificationCode.setCode(code);
    verificationCode.setUsed(false);
    verificationCode.setExpirationDate(
            LocalDateTime.now().plusMinutes(5)
    );

    codeRepository.save(verificationCode);

    return "Code de test checkout: " + code;
}
    public boolean verifyCheckoutCode(Long userId, String code) {
        CheckoutVerificationCode verificationCode = codeRepository
                .findTopByUserIdAndUsedFalseOrderByIdDesc(userId)
                .orElseThrow(() -> new RuntimeException("Aucun code trouvé."));

        if (verificationCode.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Code expiré.");
        }

        if (!verificationCode.getCode().equals(code)) {
            throw new RuntimeException("Code invalide.");
        }

        verificationCode.setUsed(true);
        codeRepository.save(verificationCode);

        return true;
    }
}
