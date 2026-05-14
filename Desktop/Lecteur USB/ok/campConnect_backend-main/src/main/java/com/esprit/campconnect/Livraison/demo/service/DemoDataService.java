package com.esprit.campconnect.Livraison.demo.service;

import com.esprit.campconnect.Livraison.demo.dto.AddressSuggestionResponse;
import com.esprit.campconnect.Livraison.demo.dto.DemoCheckoutRequest;
import com.esprit.campconnect.Livraison.demo.dto.DemoCheckoutResponse;
import com.esprit.campconnect.Livraison.demo.dto.LivraisonFeeResponse;
import com.esprit.campconnect.Livraison.demo.entity.DemoProduit;
import com.esprit.campconnect.Livraison.demo.entity.DemoRepas;
import com.esprit.campconnect.Livraison.entity.TypeCommandeLivraison;
import com.esprit.campconnect.MarketPlace.Commande.Entity.Commande;
import com.esprit.campconnect.MarketPlace.Commande.Entity.StatutCommande;
import com.esprit.campconnect.MarketPlace.Commande.Repository.CommandeRepository;
import com.esprit.campconnect.Restauration.Entity.CommandeRepas;
import com.esprit.campconnect.Restauration.Enum.StatutCommandeRepas;
import com.esprit.campconnect.Restauration.Repository.CommandeRepasRepository;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DemoDataService {

    private final OpenStreetMapGeocodingService geocodingService;
    private final CommandeRepository commandeRepository;
    private final CommandeRepasRepository commandeRepasRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final LivraisonPricingService pricingService;

    private static final double STORE_LAT = 36.8065;
    private static final double STORE_LNG = 10.1815;

    private final List<DemoProduit> produits = List.of(
            new DemoProduit(1L, "Tent", 120.0, 2.5),
            new DemoProduit(2L, "Sleeping Bag", 60.0, 0.8),
            new DemoProduit(3L, "Camping Stove", 45.0, 1.2)
    );

    private final List<DemoRepas> repas = List.of(
            new DemoRepas(1L, "Burger Menu", 25.0),
            new DemoRepas(2L, "Pizza", 30.0),
            new DemoRepas(3L, "Tacos", 20.0)
    );

    // ✅ Distance calculation (Haversine)
    private double calculateDistanceKm(
            double lat1,
            double lon1,
            double lat2,
            double lon2
    ) {
        final int earthRadiusKm = 6371;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(Math.toRadians(lat1)) *
                                Math.cos(Math.toRadians(lat2)) *
                                Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return Math.round((earthRadiusKm * c) * 100.0) / 100.0;
    }

    public List<DemoProduit> getProduits() {
        return produits;
    }

    public List<DemoRepas> getRepas() {
        return repas;
    }

    private DemoProduit findProduit(Long id) {
        return produits.stream()
                .filter(p -> p.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    private DemoRepas findRepas(Long id) {
        return repas.stream()
                .filter(r -> r.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Meal not found"));
    }

    public Commande createCommande(Double total) {
        Utilisateur client = utilisateurRepository.findById(19L)
                .orElseThrow(() -> new RuntimeException("Demo client not found"));

        Commande cmd = new Commande();
        cmd.setDateCommande(LocalDate.now());
        cmd.setTotalCommande(total);
        cmd.setStatut(StatutCommande.EN_ATTENTE);
        cmd.setUtilisateur(client);

        return commandeRepository.save(cmd);
    }

    public CommandeRepas createCommandeRepas(Double total) {
        Utilisateur client = utilisateurRepository.findById(19L)
                .orElseThrow(() -> new RuntimeException("Demo client not found"));

        CommandeRepas cmd = new CommandeRepas();
        cmd.setDateCommande(LocalDate.now());
        cmd.setMontantTotal(total);
        cmd.setStatut(StatutCommandeRepas.EN_ATTENTE);
        cmd.setUtilisateur(client);

        return commandeRepasRepository.save(cmd);
    }

    // ================= CLASSIQUE =================
    public DemoCheckoutResponse createClassicCheckout(DemoCheckoutRequest request) {

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Please select at least one product");
        }

        double itemsTotal = request.getItems()
                .stream()
                .mapToDouble(item -> {
                    DemoProduit produit = findProduit(item.getId());
                    return produit.getPrix() * item.getQuantity();
                })
                .sum();

        double poidsKg = request.getItems()
                .stream()
                .mapToDouble(item -> {
                    DemoProduit produit = findProduit(item.getId());
                    return produit.getPoidsKg() * item.getQuantity();
                })
                .sum();

        double latitude;
        double longitude;
        String finalAddress;

        if (request.getLatitude() != null && request.getLongitude() != null) {
            latitude = request.getLatitude();
            longitude = request.getLongitude();
            finalAddress = request.getAdresseLivraison();
        } else {
            OpenStreetMapGeocodingService.GeocodingResult location =
                    geocodingService.geocode(request.getAdresseLivraison());

            latitude = location.latitude();
            longitude = location.longitude();
            finalAddress = location.formattedAddress();
        }

        double distanceKm = calculateDistanceKm(
                STORE_LAT,
                STORE_LNG,
                latitude,
                longitude
        );

        LivraisonFeeResponse fee = pricingService.calculateFee(
                itemsTotal,
                distanceKm,
                poidsKg,
                latitude,
                longitude
        );

        Commande commande = createCommande(fee.getFinalTotal());

        return new DemoCheckoutResponse(
                commande.getIdCommande(),
                TypeCommandeLivraison.CLASSIQUE,

                fee.getItemsTotal(),

                fee.getBaseFee(),
                fee.getDistanceFee(),
                fee.getWeightFee(),
                fee.getWeatherFee(),
                fee.getDeliveryFee(),
                fee.getFinalTotal(),

                fee.getDistanceKm(),
                fee.getPoidsKg(),

                latitude,
                longitude,

                finalAddress,
                request.getNoteLivraison(),
                commande.getStatut().name(),

                fee.getWeatherCondition(),
                fee.getTemperature(),
                fee.getPrecipitation()
        );
    }

    // ================= REPAS =================
    public DemoCheckoutResponse createRepasCheckout(DemoCheckoutRequest request) {

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Please select at least one meal");
        }

        double itemsTotal = request.getItems()
                .stream()
                .mapToDouble(item -> {
                    DemoRepas repasItem = findRepas(item.getId());
                    return repasItem.getPrix() * item.getQuantity();
                })
                .sum();

        double poidsKg = request.getItems()
                .stream()
                .mapToDouble(item -> 0.5 * item.getQuantity())
                .sum();

        double latitude;
        double longitude;
        String finalAddress;

        if (request.getLatitude() != null && request.getLongitude() != null) {
            latitude = request.getLatitude();
            longitude = request.getLongitude();
            finalAddress = request.getAdresseLivraison();
        } else {
            OpenStreetMapGeocodingService.GeocodingResult location =
                    geocodingService.geocode(request.getAdresseLivraison());

            latitude = location.latitude();
            longitude = location.longitude();
            finalAddress = location.formattedAddress();
        }

        double distanceKm = calculateDistanceKm(
                STORE_LAT,
                STORE_LNG,
                latitude,
                longitude
        );

        LivraisonFeeResponse fee = pricingService.calculateFee(
                itemsTotal,
                distanceKm,
                poidsKg,
                latitude,
                longitude
        );

        CommandeRepas commandeRepas = createCommandeRepas(fee.getFinalTotal());

        return new DemoCheckoutResponse(
                commandeRepas.getId(),
                TypeCommandeLivraison.REPAS,

                fee.getItemsTotal(),

                fee.getBaseFee(),
                fee.getDistanceFee(),
                fee.getWeightFee(),
                fee.getWeatherFee(),
                fee.getDeliveryFee(),
                fee.getFinalTotal(),

                fee.getDistanceKm(),
                fee.getPoidsKg(),

                latitude,
                longitude,

                finalAddress,
                request.getNoteLivraison(),
                commandeRepas.getStatut().name(),

                fee.getWeatherCondition(),
                fee.getTemperature(),
                fee.getPrecipitation()
        );
    }

    public List<AddressSuggestionResponse> getAddressSuggestions(String query) {
        return geocodingService.autocomplete(query);
    }
}