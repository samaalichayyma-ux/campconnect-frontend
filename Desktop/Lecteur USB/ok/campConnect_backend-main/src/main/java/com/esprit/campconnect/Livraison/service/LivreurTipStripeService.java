package com.esprit.campconnect.Livraison.service;

import com.esprit.campconnect.Livraison.dto.TipLivreurRequest;
import com.esprit.campconnect.Livraison.dto.TipPaymentResponse;
import com.esprit.campconnect.Livraison.entity.*;
import com.esprit.campconnect.Livraison.repository.*;
import com.esprit.campconnect.User.Entity.Role;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import com.esprit.campconnect.common.EmailService;
import com.esprit.campconnect.common.LivraisonEmailTemplateService;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LivreurTipStripeService {

    @Value("${app.stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${app.stripe.frontend-base-url:http://localhost:4200}")
    private String frontendUrl;

    private final LivraisonRepository livraisonRepository;
    private final LivreurTipRepository tipRepository;
    private final LivreurWalletRepository walletRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EmailService emailService;
    private final LivraisonEmailTemplateService emailTemplateService;

    private Utilisateur getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
    }

    public TipPaymentResponse createTipSession(Long idLivraison, TipLivreurRequest request) {
        try {

            Stripe.apiKey = stripeSecretKey;

            Utilisateur client = getCurrentUser();

            if (client.getRole() != Role.CLIENT) {
                throw new RuntimeException("Only CLIENT can tip and rate");
            }

            Livraison livraison = livraisonRepository.findById(idLivraison)
                    .orElseThrow(() -> new RuntimeException("Livraison not found"));

            if (livraison.getStatut() != StatutLivraison.LIVREE) {
                throw new RuntimeException("You can only tip after delivery is completed");
            }

            if (livraison.getLivreur() == null) {
                throw new RuntimeException("No livreur assigned");
            }

            if (tipRepository.existsByLivraisonIdAndClientId(idLivraison, client.getId())) {
                throw new RuntimeException("You already tipped/rated this delivery");
            }

            double amount = request.getAmount() != null ? request.getAmount() : 0.0;

            if (amount <= 0) {
                throw new RuntimeException("Tip amount must be greater than 0");
            }

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(frontendUrl + "/public/my-deliveries/success?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(frontendUrl + "/public/my-deliveries/cancel")
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency("eur")
                                                    .setUnitAmount(Math.round(amount * 100))
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Livreur Tip - Delivery #" + idLivraison)
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .putMetadata("livraisonId", idLivraison.toString())
                    .putMetadata("clientId", client.getId().toString())
                    .putMetadata("livreurId", livraison.getLivreur().getId().toString())
                    .putMetadata("amount", String.valueOf(amount))
                    .putMetadata("rating", request.getRating().toString())
                    .putMetadata("comment", request.getComment() != null ? request.getComment() : "")
                    .build();

            Session session = Session.create(params);

            return new TipPaymentResponse(session.getUrl());

        } catch (Exception e) {
            throw new RuntimeException("Stripe tip session creation failed: " + e.getMessage(), e);
        }
    }

    public void handleTipPaymentSuccess(String sessionId) {
        try {
            // ✅ SAME PATTERN AS DEMO SERVICE
            Stripe.apiKey = stripeSecretKey;

            Session session = Session.retrieve(sessionId);
            Map<String, String> metadata = session.getMetadata();

            Long livraisonId = Long.valueOf(metadata.get("livraisonId"));
            Long clientId = Long.valueOf(metadata.get("clientId"));
            Long livreurId = Long.valueOf(metadata.get("livreurId"));
            Double amount = Double.valueOf(metadata.get("amount"));
            Integer rating = Integer.valueOf(metadata.get("rating"));
            String comment = metadata.get("comment");

            if (tipRepository.existsByLivraisonIdAndClientId(livraisonId, clientId)) {
                return;
            }

            Livraison livraison = livraisonRepository.findById(livraisonId)
                    .orElseThrow(() -> new RuntimeException("Livraison not found"));

            LivreurWallet wallet = walletRepository.findByLivreurId(livreurId)
                    .orElseGet(() -> {
                        LivreurWallet w = new LivreurWallet();
                        w.setLivreurId(livreurId);
                        w.setBalance(0.0);
                        return w;
                    });

            wallet.setBalance(wallet.getBalance() + amount);
            walletRepository.save(wallet);

            LivreurTip tip = new LivreurTip();
            tip.setLivraisonId(livraisonId);
            tip.setClientId(clientId);
            tip.setLivreurId(livreurId);
            tip.setAmount(amount);
            tip.setRating(rating);
            tip.setComment(comment);
            tip.setCreatedAt(LocalDateTime.now());

            tipRepository.save(tip);

            if (amount > 0 && livraison.getLivreur() != null && livraison.getLivreur().getEmail() != null) {
                String htmlBody = emailTemplateService.buildLivreurTipReceivedEmail(
                        livraison.getLivreur().getNom(),
                        livraisonId,
                        amount,
                        rating,
                        comment
                );

                emailService.sendHtmlEmail(
                        livraison.getLivreur().getEmail(),
                        "You received a new tip!",
                        htmlBody,
                        null,
                        null
                );
            }

        } catch (Exception e) {
            throw new RuntimeException("Error while confirming tip payment: " + e.getMessage(), e);
        }
    }
}
