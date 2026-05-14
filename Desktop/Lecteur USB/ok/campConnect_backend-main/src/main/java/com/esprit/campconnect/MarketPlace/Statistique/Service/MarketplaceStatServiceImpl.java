package com.esprit.campconnect.MarketPlace.Statistique.Service;

import com.esprit.campconnect.MarketPlace.Commande.Entity.Commande;
import com.esprit.campconnect.MarketPlace.Commande.Entity.StatutCommande;
import com.esprit.campconnect.MarketPlace.DetailCommande.Entity.DetailCommande;
import com.esprit.campconnect.MarketPlace.DetailCommande.Repository.DetailCommandeRepository;
import com.esprit.campconnect.MarketPlace.Statistique.DTO.MarketplaceStatDTO;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MarketplaceStatServiceImpl implements MarketplaceStatService {

    private final DetailCommandeRepository detailCommandeRepository;

    public MarketplaceStatServiceImpl(DetailCommandeRepository detailCommandeRepository) {
        this.detailCommandeRepository = detailCommandeRepository;
    }

    @Override
    public List<MarketplaceStatDTO> getStatsProduits() {
        List<DetailCommande> details = detailCommandeRepository.findAll()
                .stream()
                .filter(this::isDetailComptabilisable)
                .toList();

        int totalQuantiteVendue = details.stream()
                .mapToInt(DetailCommande::getQuantite)
                .sum();

        Map<Long, List<DetailCommande>> groupedByProduit = details.stream()
                .filter(d -> d.getProduit() != null)
                .collect(Collectors.groupingBy(d -> d.getProduit().getIdProduit()));

        List<MarketplaceStatDTO> stats = new ArrayList<>();

        for (Map.Entry<Long, List<DetailCommande>> entry : groupedByProduit.entrySet()) {
            Long idProduit = entry.getKey();
            List<DetailCommande> produitDetails = entry.getValue();

            String nomProduit = produitDetails.get(0).getProduit().getNom();

            int quantiteVendue = produitDetails.stream()
                    .mapToInt(DetailCommande::getQuantite)
                    .sum();

            double chiffreAffaire = produitDetails.stream()
                    .mapToDouble(DetailCommande::getTotal)
                    .sum();

            double tauxAchat = totalQuantiteVendue > 0
                    ? (quantiteVendue * 100.0) / totalQuantiteVendue
                    : 0;

            stats.add(new MarketplaceStatDTO(
                    idProduit,
                    nomProduit,
                    quantiteVendue,
                    chiffreAffaire,
                    Math.round(tauxAchat * 100.0) / 100.0
            ));
        }

        stats.sort((a, b) -> Integer.compare(b.getQuantiteVendue(), a.getQuantiteVendue()));

        return stats;
    }

    @Override
    public MarketplaceStatDTO getMeilleurProduit() {
        return getStatsProduits()
                .stream()
                .findFirst()
                .orElse(null);
    }

    @Override
    public Map<String, Object> getResumeMarketplace() {
        List<MarketplaceStatDTO> stats = getStatsProduits();

        int totalProduitsVendus = stats.stream()
                .mapToInt(MarketplaceStatDTO::getQuantiteVendue)
                .sum();

        double chiffreAffaireTotal = stats.stream()
                .mapToDouble(MarketplaceStatDTO::getChiffreAffaire)
                .sum();

        MarketplaceStatDTO meilleurProduit = stats.stream()
                .findFirst()
                .orElse(null);

        Map<String, Object> resume = new LinkedHashMap<>();
        resume.put("totalProduitsVendus", totalProduitsVendus);
        resume.put("chiffreAffaireTotal", chiffreAffaireTotal);
        resume.put("meilleurProduit", meilleurProduit);
        resume.put("nombreProduitsAchetes", stats.size());

        return resume;
    }

    private boolean isDetailComptabilisable(DetailCommande detailCommande) {
        if (detailCommande == null || detailCommande.getProduit() == null) {
            return false;
        }

        Commande commande = detailCommande.getCommande();
        if (commande == null || commande.getStatut() == null) {
            return false;
        }

        return commande.getStatut() == StatutCommande.PAYEE
                || commande.getStatut() == StatutCommande.LIVREE;
    }
}
