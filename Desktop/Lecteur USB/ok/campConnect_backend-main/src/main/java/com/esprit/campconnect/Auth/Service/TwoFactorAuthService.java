package com.esprit.campconnect.Auth.Service;

import com.esprit.campconnect.Auth.DTO.TwoFactorSetupResponse;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.qrcode.QRCodeWriter;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import dev.samstevens.totp.util.Utils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class TwoFactorAuthService {

    private final UtilisateurRepository utilisateurRepository;

    private static final String APP_NAME = "CampConnect";

    public TwoFactorSetupResponse setupTwoFactor(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        String secret = new DefaultSecretGenerator().generate();

        utilisateur.setTwoFactorSecret(secret);
        utilisateur.setTwoFactorEnabled(false);
        utilisateur.setTwoFactorVerified(false);
        utilisateurRepository.save(utilisateur);

        QrData data = new QrData.Builder()
                .label(email)
                .secret(secret)
                .issuer(APP_NAME)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();

        String otpAuthUrl = Utils.getDataUriForImage(
                generateQrCodeImage(data.getUri()),
                "image/png"
        );

        return new TwoFactorSetupResponse(secret, data.getUri(), otpAuthUrl);
    }

    public boolean verifyAndEnableTwoFactor(String email, String code) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (utilisateur.getTwoFactorSecret() == null || utilisateur.getTwoFactorSecret().isBlank()) {
            throw new RuntimeException("2FA non initialisé");
        }

        boolean valid = isCodeValid(utilisateur.getTwoFactorSecret(), code);

        if (!valid) {
            return false;
        }

        utilisateur.setTwoFactorEnabled(true);
        utilisateur.setTwoFactorVerified(true);
        utilisateurRepository.save(utilisateur);

        return true;
    }

    public void disableTwoFactor(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        utilisateur.setTwoFactorEnabled(false);
        utilisateur.setTwoFactorVerified(false);
        utilisateur.setTwoFactorSecret(null);
        utilisateurRepository.save(utilisateur);
    }

    public boolean verifyCodeForLogin(String email, String code) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (!utilisateur.isTwoFactorEnabled() || utilisateur.getTwoFactorSecret() == null) {
            return false;
        }

        return isCodeValid(utilisateur.getTwoFactorSecret(), code);
    }

    public boolean isTwoFactorEnabled(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        return utilisateur.isTwoFactorEnabled();
    }

    public boolean isTwoFactorVerified(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        return utilisateur.isTwoFactorVerified();
    }

    private boolean isCodeValid(String secret, String code) {
        TimeProvider timeProvider = new SystemTimeProvider();

        DefaultCodeVerifier verifier = new DefaultCodeVerifier(
                new DefaultCodeGenerator(HashingAlgorithm.SHA1),
                timeProvider
        );

        verifier.setTimePeriod(30);
        verifier.setAllowedTimePeriodDiscrepancy(1);

        return verifier.isValidCode(secret, code);
    }

    private byte[] generateQrCodeImage(String uri) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            var bitMatrix = qrCodeWriter.encode(uri, BarcodeFormat.QR_CODE, 250, 250);

            var image = new java.awt.image.BufferedImage(250, 250, java.awt.image.BufferedImage.TYPE_INT_RGB);
            for (int x = 0; x < 250; x++) {
                for (int y = 0; y < 250; y++) {
                    image.setRGB(x, y, bitMatrix.get(x, y) ? 0x000000 : 0xFFFFFF);
                }
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            javax.imageio.ImageIO.write(image, "png", outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération QR Code", e);
        }
    }
}