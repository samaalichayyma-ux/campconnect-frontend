package com.esprit.campconnect.MarketPlace.Commande.Service;


import com.esprit.campconnect.MarketPlace.Commande.Entity.Commande;
import com.esprit.campconnect.MarketPlace.Commande.Entity.EtatLivraison;
import com.esprit.campconnect.MarketPlace.Commande.Entity.StatutCommande;
import com.esprit.campconnect.MarketPlace.Commande.Repository.CommandeRepository;
import com.esprit.campconnect.MarketPlace.DetailCommande.Entity.DetailCommande;
import com.esprit.campconnect.MarketPlace.DetailCommande.Repository.DetailCommandeRepository;
import com.esprit.campconnect.MarketPlace.DetailPanier.Entity.DetailPanier;
import com.esprit.campconnect.MarketPlace.DetailPanier.Repository.DetailPanierRepository;
import com.esprit.campconnect.MarketPlace.Panier.Entity.Panier;
import com.esprit.campconnect.MarketPlace.Panier.Repository.PanierRepository;
import com.esprit.campconnect.MarketPlace.Produit.Entity.Categorie;
import com.esprit.campconnect.MarketPlace.Produit.Entity.Produit;
import com.esprit.campconnect.MarketPlace.Produit.Entity.StockProduit;
import com.esprit.campconnect.MarketPlace.Produit.Repository.ProduitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class CommandeServiceImpl implements CommandeService {

    private final CommandeRepository commandeRepository;
    private final DetailCommandeRepository detailCommandeRepository;
    private final DetailPanierRepository detailPanierRepository;
    private final PanierRepository panierRepository;
    private final ProduitRepository produitRepository;

    public CommandeServiceImpl(
            CommandeRepository commandeRepository,
            DetailCommandeRepository detailCommandeRepository,
            DetailPanierRepository detailPanierRepository,
            PanierRepository panierRepository,
            ProduitRepository produitRepository
    ) {
        this.commandeRepository = commandeRepository;
        this.detailCommandeRepository = detailCommandeRepository;
        this.detailPanierRepository = detailPanierRepository;
        this.panierRepository = panierRepository;
        this.produitRepository = produitRepository;
    }

    public Commande changerEtatLivraison(Long id, EtatLivraison etatLivraison) {
        Commande commande = getCommandeById(id);
        commande.setEtatLivraison(etatLivraison);
        return commandeRepository.save(commande);
    }
    @Override
    public Commande ajouterCommande(Commande commande) {
        commande.setDateCommande(LocalDate.now());

        if (commande.getStatut() == null) {
            commande.setStatut(StatutCommande.EN_ATTENTE);
        }

        return commandeRepository.save(commande);
    }

    @Override
    public List<Commande> getAllCommandes() {
        return commandeRepository.findAll();
    }

    @Override
    public Commande getCommandeById(Long id) {
        return commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvee avec id : " + id));
    }

    @Override
    public Commande updateCommande(Long id, Commande commande) {
        Commande existingCommande = getCommandeById(id);

        existingCommande.setDateCommande(commande.getDateCommande());
        existingCommande.setStatut(commande.getStatut());
        existingCommande.setTotalCommande(commande.getTotalCommande());
        existingCommande.setUtilisateur(commande.getUtilisateur());

        return commandeRepository.save(existingCommande);
    }

    @Override
    public void deleteCommande(Long id) {
        Commande commande = getCommandeById(id);
        commandeRepository.delete(commande);
    }

@Override
public List<Commande> getCommandesByUtilisateur(Long utilisateurId) {
    return commandeRepository.findByUtilisateur_IdOrderByDateCommandeDescIdCommandeDesc(utilisateurId);
}

@Override
public List<Commande> getCommandesByUtilisateurConnecte(String email) {
    return commandeRepository.findByUtilisateur_EmailOrderByDateCommandeDescIdCommandeDesc(email);
}
    @Override
    public List<Commande> getCommandesByStatut(StatutCommande statut) {
        return commandeRepository.findByStatut(statut);
    }

    @Override
    public Commande changerStatut(Long id, StatutCommande statut) {
        Commande commande = getCommandeById(id);
        commande.setStatut(statut);
        return commandeRepository.save(commande);
    }

    @Override
    @Transactional
    public Commande commanderDepuisPanier(Long idPanier) {
        Panier panier = panierRepository.findById(idPanier)
                .orElseThrow(() -> new RuntimeException("Panier non trouve avec id : " + idPanier));

        List<DetailPanier> detailsPanier = detailPanierRepository.findByPanierIdPanier(idPanier);

        if (detailsPanier.isEmpty()) {
            throw new RuntimeException("Le panier est vide.");
        }

        Commande commande = new Commande();
        commande.setDateCommande(LocalDate.now());
        commande.setStatut(StatutCommande.EN_ATTENTE);
        commande.setUtilisateur(panier.getUtilisateur());
        commande.setTotalCommande(0);

        Commande savedCommande = commandeRepository.save(commande);

        double totalCommande = 0;

        for (DetailPanier detailPanier : detailsPanier) {
            Produit produit = produitRepository.findById(detailPanier.getProduit().getIdProduit())
                    .orElseThrow(() -> new RuntimeException("Produit non trouve"));

            if (!produit.isActive() || produit.getStock() <= 0) {
                throw new RuntimeException("Produit indisponible : " + produit.getNom());
            }

            StockProduit stockVariante = trouverStockVariante(detailPanier, produit);
            int stockDisponible = stockVariante != null ? stockVariante.getStock() : produit.getStock();

            if (stockDisponible < detailPanier.getQuantite()) {
                throw new RuntimeException("Stock insuffisant pour : " + produit.getNom());
            }

            if (stockVariante != null) {
                stockVariante.setStock(stockVariante.getStock() - detailPanier.getQuantite());
            }

            produit.setStock(produit.getStock() - detailPanier.getQuantite());

            if (produit.getStock() == 0) {
                produit.setActive(false);
            }

            produitRepository.save(produit);

            DetailCommande detailCommande = new DetailCommande();
            detailCommande.setCommande(savedCommande);
            detailCommande.setProduit(produit);
            detailCommande.setQuantite(detailPanier.getQuantite());
            detailCommande.setPrixUnitaire(produit.getPrix());
            detailCommande.setTotal(produit.getPrix() * detailPanier.getQuantite());

            detailCommandeRepository.save(detailCommande);

            totalCommande += detailCommande.getTotal();
        }

        savedCommande.setTotalCommande(totalCommande);
        savedCommande = commandeRepository.save(savedCommande);

        detailPanierRepository.deleteAll(detailsPanier);

        return savedCommande;
    }

    private StockProduit trouverStockVariante(DetailPanier detailPanier, Produit produit) {
        if (produit.getCategorie() == Categorie.VETEMENT) {
            return produit.getStocks().stream()
                    .filter(stock -> stock.getTaille() != null)
                    .filter(stock -> stock.getTaille().equalsIgnoreCase(detailPanier.getTaille()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Taille introuvable pour : " + produit.getNom()));
        }

        if (produit.getCategorie() == Categorie.CHAUSSURE) {
            return produit.getStocks().stream()
                    .filter(stock -> stock.getPointure() != null)
                    .filter(stock -> stock.getPointure().equals(detailPanier.getPointure()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Pointure introuvable pour : " + produit.getNom()));
        }

        return null;
    }
}
