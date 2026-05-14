package com.esprit.campconnect.MarketPlace.Payment.Controller;


import com.esprit.campconnect.MarketPlace.Commande.Entity.Commande;
import com.esprit.campconnect.MarketPlace.Payment.DTO.StripeCheckoutRequest;
import com.esprit.campconnect.MarketPlace.Payment.DTO.StripeConfirmRequest;
import com.esprit.campconnect.MarketPlace.Payment.Service.StripePaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class StripePaymentController {

    private final StripePaymentService stripePaymentService;

    @PostMapping("/stripe-checkout")
    public ResponseEntity<?> createCheckout(@RequestBody StripeCheckoutRequest request) {
        try {
            String url = stripePaymentService.createCheckoutSession(
                    request.getUserId(),
                    request.getIdPanier(),
                    request.getTotal()
            );

            return ResponseEntity.ok(Map.of("url", url));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@RequestBody Map<String, String> request) {
        try {
            String sessionId = request.get("sessionId");

            Commande commande = stripePaymentService
                    .confirmPaymentAndCreateCommande(sessionId);

            return ResponseEntity.ok(Map.of(
                    "message", "Commande créée avec succès",
                    "idCommande", commande.getIdCommande()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}