package com.esprit.campconnect.MarketPlace.Payment.Service;

import com.esprit.campconnect.MarketPlace.Commande.Entity.Commande;
import com.esprit.campconnect.MarketPlace.Commande.Entity.StatutCommande;
import com.esprit.campconnect.MarketPlace.Commande.Repository.CommandeRepository;
import com.esprit.campconnect.MarketPlace.DetailCommande.Entity.DetailCommande;
import com.esprit.campconnect.MarketPlace.DetailCommande.Repository.DetailCommandeRepository;
import com.esprit.campconnect.MarketPlace.DetailPanier.Entity.DetailPanier;
import com.esprit.campconnect.MarketPlace.DetailPanier.Repository.DetailPanierRepository;
import com.esprit.campconnect.MarketPlace.Panier.Repository.PanierRepository;
import com.esprit.campconnect.MarketPlace.Produit.Entity.Categorie;
import com.esprit.campconnect.MarketPlace.Produit.Entity.Produit;
import com.esprit.campconnect.MarketPlace.Produit.Entity.StockProduit;
import com.esprit.campconnect.MarketPlace.Produit.Repository.ProduitRepository;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class StripePaymentService {

    @Value("${app.stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${app.stripe.frontend-base-url}")
    private String frontendBaseUrl;

    @Value("${app.stripe.currency:tnd}")
    private String currency;

    private final ProduitRepository produitRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final DetailPanierRepository detailPanierRepository;
    private final CommandeRepository commandeRepository;
    private final DetailCommandeRepository detailCommandeRepository;
    private final PanierRepository panierRepository;

    public StripePaymentService(
            ProduitRepository produitRepository,
            UtilisateurRepository utilisateurRepository,
            DetailPanierRepository detailPanierRepository,
            CommandeRepository commandeRepository,
            DetailCommandeRepository detailCommandeRepository,
            PanierRepository panierRepository
    ) {
        this.produitRepository = produitRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.detailPanierRepository = detailPanierRepository;
        this.commandeRepository = commandeRepository;
        this.detailCommandeRepository = detailCommandeRepository;
        this.panierRepository = panierRepository;
    }

    public String createCheckoutSession(Long userId, Long idPanier, Double total) throws Exception {
        Stripe.apiKey = stripeSecretKey;

        long amount = Math.round(total * 100);

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendBaseUrl + "/public/payment?payment_status=success&session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendBaseUrl + "/public/payment?payment_status=cancel")
                .putMetadata("userId", userId.toString())
                .putMetadata("idPanier", idPanier.toString())
                .putMetadata("total", total.toString())
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency(currency)
                                                .setUnitAmount(amount)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("CampConnect Order")
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .build();

        Session session = Session.create(params);
        return session.getUrl();
    }

    public Commande confirmPaymentAndCreateCommande(String sessionId) throws Exception {
        Stripe.apiKey = stripeSecretKey;

        Session session = Session.retrieve(sessionId);

        if (!"paid".equals(session.getPaymentStatus())) {
            throw new RuntimeException("Paiement non validé.");
        }

        Long userId = Long.valueOf(session.getMetadata().get("userId"));
        Long idPanier = Long.valueOf(session.getMetadata().get("idPanier"));
        double totalFinal = Double.parseDouble(session.getMetadata().get("total"));

        Utilisateur utilisateur = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable."));

        List<DetailPanier> detailsPanier = detailPanierRepository.findByPanierIdPanier(idPanier);

        if (detailsPanier.isEmpty()) {
            throw new RuntimeException("Panier vide.");
        }

        Commande commande = new Commande();
        commande.setDateCommande(LocalDate.now());
        commande.setStatut(StatutCommande.PAYEE);
        commande.setTotalCommande(totalFinal);
        commande.setUtilisateur(utilisateur);

        Commande savedCommande = commandeRepository.save(commande);

        for (DetailPanier dp : detailsPanier) {
            Produit produit = dp.getProduit();

            diminuerStockProduit(produit, dp);

            DetailCommande dc = new DetailCommande();
            dc.setCommande(savedCommande);
            dc.setProduit(produit);
            dc.setQuantite(dp.getQuantite());
            dc.setPrixUnitaire(dp.getPrix());
            dc.setTotal(dp.getPrix() * dp.getQuantite());
            dc.setTaille(dp.getTaille());
            dc.setPointure(dp.getPointure());

            detailCommandeRepository.save(dc);
        }

        detailPanierRepository.deleteAll(detailsPanier);

        return savedCommande;
    }

    private void diminuerStockProduit(Produit produit, DetailPanier detailPanier) {
        int quantite = detailPanier.getQuantite();

        if (produit.getCategorie() == Categorie.VETEMENT) {
            StockProduit stockTaille = produit.getStocks()
                    .stream()
                    .filter(stock -> stock.getTaille() != null
                            && stock.getTaille().equalsIgnoreCase(detailPanier.getTaille()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException(
                            "Stock introuvable pour la taille " + detailPanier.getTaille()
                    ));

            if (stockTaille.getStock() < quantite) {
                throw new RuntimeException("Stock insuffisant pour " + produit.getNom());
            }

            stockTaille.setStock(stockTaille.getStock() - quantite);
        } else if (produit.getCategorie() == Categorie.CHAUSSURE) {
            StockProduit stockPointure = produit.getStocks()
                    .stream()
                    .filter(stock -> stock.getPointure() != null
                            && stock.getPointure().equals(detailPanier.getPointure()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException(
                            "Stock introuvable pour la pointure " + detailPanier.getPointure()
                    ));

            if (stockPointure.getStock() < quantite) {
                throw new RuntimeException("Stock insuffisant pour " + produit.getNom());
            }

            stockPointure.setStock(stockPointure.getStock() - quantite);
        } else {
            if (produit.getStock() < quantite) {
                throw new RuntimeException("Stock insuffisant pour " + produit.getNom());
            }

            produit.setStock(produit.getStock() - quantite);
        }

        if (produit.getCategorie() == Categorie.VETEMENT ||
                produit.getCategorie() == Categorie.CHAUSSURE) {

            int totalStock = produit.getStocks()
                    .stream()
                    .mapToInt(StockProduit::getStock)
                    .sum();

            produit.setStock(totalStock);
        }

        produitRepository.save(produit);
    }
}