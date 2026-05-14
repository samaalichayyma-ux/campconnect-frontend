package com.esprit.campconnect.MarketPlace.Produit.Controller;

import com.esprit.campconnect.MarketPlace.Produit.DTO.ProduitUserDTO;
import com.esprit.campconnect.MarketPlace.Produit.Entity.Categorie;
import com.esprit.campconnect.MarketPlace.Produit.Entity.Produit;
import com.esprit.campconnect.MarketPlace.Produit.Entity.StockProduit;
import com.esprit.campconnect.MarketPlace.Produit.Service.ProduitService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/produits")
@CrossOrigin(origins = "http://localhost:4200")
public class ProduitController {

    private final ProduitService produitService;
    private final ObjectMapper objectMapper;

    public ProduitController(ProduitService produitService, ObjectMapper objectMapper) {
        this.produitService = produitService;
        this.objectMapper = objectMapper;
    }


    @PutMapping("/{idProduit}/stock")
    public Produit modifierStockGlobal(
            @PathVariable Long idProduit,
            @RequestBody Map<String, Integer> body
    ) {
        return produitService.modifierStockGlobal(
                idProduit,
                body.get("stock")
        );
    }
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Produit ajouterProduit(
            @RequestParam("nom") String nom,
            @RequestParam("description") String description,
            @RequestParam("prix") double prix,
            @RequestParam("stock") int stock,
            @RequestParam("categorie") Categorie categorie,
            @RequestParam(value = "stocks", required = false) String stocksJson, // 🔥 IMPORTANT
            @RequestPart("images") MultipartFile[] images
    ) throws IOException {

        String uploadDir = System.getProperty("user.dir") + File.separator + "uploads";
        File directory = new File(uploadDir);

        if (!directory.exists()) {
            directory.mkdirs();
        }

        List<String> imageNames = new ArrayList<>();

        for (MultipartFile image : images) {
            if (image != null && !image.isEmpty()) {
                String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
                image.transferTo(new File(uploadDir + File.separator + fileName));
                imageNames.add(fileName);
            }
        }

        Produit produit = new Produit();
        produit.setNom(nom);
        produit.setDescription(description);
        produit.setPrix(prix);
        produit.setStock(stock);
        produit.setCategorie(categorie);
        produit.setImages(imageNames);
        produit.setActive(true);

        // 🔥 AJOUT STOCKS
        if (stocksJson != null && !stocksJson.isBlank()) {

            ObjectMapper mapper = new ObjectMapper();

            List<StockProduit> stocks = mapper.readValue(
                    stocksJson,
                    new TypeReference<List<StockProduit>>() {}
            );

            for (StockProduit s : stocks) {
                s.setProduit(produit);
            }

            produit.setStocks(stocks);
        }

        return produitService.ajouterProduit(produit);
    }
    @GetMapping
    public List<Produit> getAll() {
        return produitService.getAllProduits();
    }

    @GetMapping("/user")
    public List<ProduitUserDTO> getProduitsPourUser() {
        return produitService.getAllProduits()
                .stream()
                .filter(produit -> produit.isActive() && produit.getStockTotal() > 0)
                .map(produit -> new ProduitUserDTO(
                        produit.getIdProduit(),
                        produit.getNom(),
                        produit.getDescription(),
                        produit.getPrix(),
                        produit.getCategorie().name(),
                        produit.getImages()
                ))
                .toList();
    }

    @GetMapping("/{id}")
    public Produit getById(@PathVariable Long id) {
        return produitService.getProduitById(id);
    }

    @PutMapping("/{id}")
    public Produit update(@PathVariable Long id, @RequestBody Produit produit) {
        return produitService.updateProduit(id, produit);
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivate(@PathVariable Long id) {
        try {
            produitService.desactiverProduit(id);
            return ResponseEntity.ok("Produit désactivé avec succès");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur désactivation: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable Long id) {
        try {
            produitService.activerProduit(id);
            return ResponseEntity.ok("Produit activé avec succès");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur activation: " + e.getMessage());
        }
    }

    @GetMapping("/categorie/{categorie}")
    public List<Produit> getByCategory(@PathVariable Categorie categorie) {
        return produitService.getProduitsByCategory(categorie);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduit(@PathVariable Long id) {
        try {
            produitService.deleteProduit(id);
            return ResponseEntity.ok("Produit supprimé avec succès");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur suppression: " + e.getMessage());
        }
    }
}