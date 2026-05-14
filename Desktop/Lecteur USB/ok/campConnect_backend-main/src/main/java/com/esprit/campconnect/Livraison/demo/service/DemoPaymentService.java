package com.esprit.campconnect.Livraison.demo.service;

import com.esprit.campconnect.Livraison.demo.dto.DemoPaymentRequest;
import com.esprit.campconnect.Livraison.demo.dto.DemoPaymentResponse;
import com.esprit.campconnect.Livraison.dto.LivraisonCreateRequest;
import com.esprit.campconnect.Livraison.dto.LivraisonResponse;
import com.esprit.campconnect.Livraison.entity.TypeCommandeLivraison;
import com.esprit.campconnect.Livraison.service.ILivraisonService;
import com.esprit.campconnect.MarketPlace.Commande.Entity.Commande;
import com.esprit.campconnect.MarketPlace.Commande.Entity.StatutCommande;
import com.esprit.campconnect.MarketPlace.Commande.Repository.CommandeRepository;
import com.esprit.campconnect.Restauration.Entity.CommandeRepas;
import com.esprit.campconnect.Restauration.Enum.StatutCommandeRepas;
import com.esprit.campconnect.Restauration.Repository.CommandeRepasRepository;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DemoPaymentService {

    private final CommandeRepository commandeRepository;
    private final CommandeRepasRepository commandeRepasRepository;
    private final ILivraisonService livraisonService;

    @Value("${app.stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${app.stripe.frontend-base-url:http://localhost:4200}")
    private String frontendUrl;

    public DemoPaymentResponse createCheckoutSession(DemoPaymentRequest request) {
        try {
            Stripe.apiKey = stripeSecretKey;

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(frontendUrl + "/public/payment-command-success?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(frontendUrl + "/public/payment-command-cancel")
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency("eur")
                                                    .setUnitAmount(Math.round(request.getTotal() * 100))
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("CampConnect Delivery Order")
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .putMetadata("commandeId", request.getCommandeId().toString())
                    .putMetadata("typeCommande", request.getTypeCommande().name())
                    .putMetadata("adresseLivraison", request.getAdresseLivraison())
                    .putMetadata("noteLivraison", request.getNoteLivraison() != null ? request.getNoteLivraison() : "")

                    .putMetadata("latitudeLivraison", String.valueOf(request.getLatitudeLivraison()))
                    .putMetadata("longitudeLivraison", String.valueOf(request.getLongitudeLivraison()))
                    .putMetadata("distanceKm", String.valueOf(request.getDistanceKm()))
                    .putMetadata("poidsKg", String.valueOf(request.getPoidsKg()))
                    .putMetadata("fraisDistance", String.valueOf(request.getFraisDistance()))
                    .putMetadata("fraisPoids", String.valueOf(request.getFraisPoids()))
                    .putMetadata("fraisMeteo", String.valueOf(request.getFraisMeteo()))
                    .putMetadata("fraisLivraisonTotal", String.valueOf(request.getFraisLivraisonTotal()))
                    .putMetadata("meteoCondition", request.getMeteoCondition() != null ? request.getMeteoCondition() : "")
                    .build();

            Session session = Session.create(params);

            return new DemoPaymentResponse(session.getUrl());

        } catch (Exception e) {
            throw new RuntimeException("Stripe checkout session creation failed: " + e.getMessage());
        }
    }

    public LivraisonResponse handlePaymentSuccess(String sessionId) {
        try {
            Stripe.apiKey = stripeSecretKey;

            Session session = Session.retrieve(sessionId);

            String commandeIdValue = session.getMetadata().get("commandeId");
            String typeCommandeValue = session.getMetadata().get("typeCommande");
            String adresseLivraison = session.getMetadata().get("adresseLivraison");
            String noteLivraison = session.getMetadata().get("noteLivraison");

            Long commandeId = Long.valueOf(commandeIdValue);
            TypeCommandeLivraison typeCommande =
                    TypeCommandeLivraison.valueOf(typeCommandeValue);

            if (typeCommande == TypeCommandeLivraison.CLASSIQUE) {
                Commande commande = commandeRepository.findById(commandeId)
                        .orElseThrow(() -> new RuntimeException("Commande not found"));

                commande.setStatut(StatutCommande.PAYEE);
                commandeRepository.save(commande);
            } else {
                CommandeRepas commandeRepas = commandeRepasRepository.findById(commandeId)
                        .orElseThrow(() -> new RuntimeException("CommandeRepas not found"));

                commandeRepas.setStatut(StatutCommandeRepas.CONFIRMEE);
                commandeRepasRepository.save(commandeRepas);
            }

            LivraisonCreateRequest livraisonRequest = new LivraisonCreateRequest();
            livraisonRequest.setCommandeId(commandeId);
            livraisonRequest.setTypeCommande(typeCommande);
            livraisonRequest.setAdresseLivraison(adresseLivraison);
            livraisonRequest.setCommentaire(noteLivraison);

            livraisonRequest.setLatitudeLivraison(
                    Double.valueOf(session.getMetadata().get("latitudeLivraison"))
            );
            livraisonRequest.setLongitudeLivraison(
                    Double.valueOf(session.getMetadata().get("longitudeLivraison"))
            );

            livraisonRequest.setDistanceKm(
                    Double.valueOf(session.getMetadata().get("distanceKm"))
            );
            livraisonRequest.setPoidsKg(
                    Double.valueOf(session.getMetadata().get("poidsKg"))
            );
            livraisonRequest.setFraisDistance(
                    Double.valueOf(session.getMetadata().get("fraisDistance"))
            );
            livraisonRequest.setFraisPoids(
                    Double.valueOf(session.getMetadata().get("fraisPoids"))
            );
            livraisonRequest.setFraisMeteo(
                    Double.valueOf(session.getMetadata().get("fraisMeteo"))
            );
            livraisonRequest.setFraisLivraisonTotal(
                    Double.valueOf(session.getMetadata().get("fraisLivraisonTotal"))
            );
            livraisonRequest.setMeteoCondition(
                    session.getMetadata().get("meteoCondition")
            );

            return livraisonService.createLivraisonAfterPayment(livraisonRequest);

        } catch (Exception e) {
            throw new RuntimeException("Payment success handling failed: " + e.getMessage());
        }
    }
}
