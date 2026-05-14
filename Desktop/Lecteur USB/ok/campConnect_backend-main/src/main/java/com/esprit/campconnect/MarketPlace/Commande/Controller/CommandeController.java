package com.esprit.campconnect.MarketPlace.Commande.Controller;

import com.esprit.campconnect.MarketPlace.Commande.Entity.Commande;
import com.esprit.campconnect.MarketPlace.Commande.Entity.StatutCommande;
import com.esprit.campconnect.MarketPlace.Commande.Service.CommandeService;
import com.esprit.campconnect.MarketPlace.DTO.EtatLivraisonRequest;
import com.esprit.campconnect.MarketPlace.DTO.StatutCommandeRequest;
import com.itextpdf.html2pdf.HtmlConverter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/commandes")
@CrossOrigin(origins = "http://localhost:4200")

public class CommandeController {

    private final CommandeService commandeService;

    public CommandeController(CommandeService commandeService) {
        this.commandeService = commandeService;
    }

    @GetMapping("/pdf")
    public void genererPdfCommandes(HttpServletResponse response) throws IOException {

        List<Commande> commandes = commandeService.getAllCommandes();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        StringBuilder html = new StringBuilder();

        html.append("""
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    color: #111827;
                    padding: 20px;
                }

                h1 {
                    text-align: center;
                    color: #0f172a;
                    margin-bottom: 5px;
                }

                .subtitle {
                    text-align: center;
                    color: #64748b;
                    margin-bottom: 30px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }

                th {
                    background-color: #0f172a;
                    color: white;
                    padding: 10px;
                    font-size: 13px;
                }

                td {
                    border: 1px solid #e5e7eb;
                    padding: 9px;
                    font-size: 12px;
                    text-align: center;
                }

                tr:nth-child(even) {
                    background-color: #f8fafc;
                }

                .payee {
                    color: #16a34a;
                    font-weight: bold;
                }

                .footer {
                    margin-top: 30px;
                    font-size: 11px;
                    color: #64748b;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <h1>Liste des Commandes</h1>
            <div class="subtitle">Rapport des commandes avec état de livraison</div>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Client</th>
                        <th>Date</th>
                        <th>Statut</th>
                        <th>Total</th>
                        <th>État Livraison</th>
                    </tr>
                </thead>
                <tbody>
    """);

        for (Commande cmd : commandes) {

            String client = "Client";

            if (cmd.getUtilisateur() != null) {
                if (cmd.getUtilisateur().getNom() != null) {
                    client = cmd.getUtilisateur().getNom();
                } else if (cmd.getUtilisateur().getEmail() != null) {
                    client = cmd.getUtilisateur().getEmail();
                }
            }

            String date = cmd.getDateCommande() != null
                    ? cmd.getDateCommande().format(formatter)
                    : "-";

            String etatLivraison = cmd.getEtatLivraison() != null
                    ? cmd.getEtatLivraison().name()
                    : "EN_ATTENTE";

            html.append("<tr>");
            html.append("<td>#").append(cmd.getIdCommande()).append("</td>");
            html.append("<td>").append(client).append("</td>");
            html.append("<td>").append(date).append("</td>");
            html.append("<td class='payee'>PAYEE</td>");
            html.append("<td>").append(cmd.getTotalCommande()).append(" TND</td>");
            html.append("<td>").append(etatLivraison).append("</td>");
            html.append("</tr>");
        }

        html.append("""
                </tbody>
            </table>

            <div class="footer">
                Document généré automatiquement par CampConnect Marketplace
            </div>
        </body>
        </html>
    """);

        response.setContentType("application/pdf");
        response.setHeader(
                "Content-Disposition",
                "attachment; filename=commandes-livraison.pdf"
        );

        HtmlConverter.convertToPdf(html.toString(), response.getOutputStream());
    }

    @PostMapping
    public String ajouterCommande(@RequestBody Commande commande) {
        try {
            commandeService.ajouterCommande(commande);
            return "Commande ajoutée avec succès";
        } catch (Exception e) {
            return "Échec de l'ajout de la commande";
        }
    }

    @PutMapping("/{id}/livraison")
    public Commande changerEtatLivraison(
            @PathVariable Long id,
            @RequestBody EtatLivraisonRequest request
    ) {
        return commandeService.changerEtatLivraison(id, request.getEtatLivraison());
    }
    @GetMapping
    public List<Commande> getAll() {
        return commandeService.getAllCommandes();
    }

    @GetMapping("/me")
    public List<Commande> getMesCommandes(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur non authentifie");
        }

        return commandeService.getCommandesByUtilisateurConnecte(authentication.getName());
    }

    @GetMapping("/{id}")
    public Commande getById(@PathVariable Long id) {
        return commandeService.getCommandeById(id);
    }

    @PutMapping("/{id}")
    public String update(@PathVariable Long id, @RequestBody Commande commande) {
        try {
            commandeService.updateCommande(id, commande);
            return "Commande modifiée avec succès";
        } catch (Exception e) {
            return "Échec de la modification de la commande";
        }
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        try {
            commandeService.deleteCommande(id);
            return "Commande supprimée avec succès";
        } catch (Exception e) {
            return "Échec de la suppression de la commande";
        }
    }

    @PutMapping("/{id}/statut")
    public Commande changerStatut(
            @PathVariable Long id,
            @RequestBody StatutCommandeRequest request
    ) {
        return commandeService.changerStatut(id, request.getStatut());
    }

    @GetMapping("/utilisateur/{utilisateurId}")
    public List<Commande> getByUtilisateur(@PathVariable Long utilisateurId) {
        return commandeService.getCommandesByUtilisateur(utilisateurId);
    }

    @GetMapping("/statut/{statut}")
    public List<Commande> getByStatut(@PathVariable StatutCommande statut) {
        return commandeService.getCommandesByStatut(statut);
    }

    @PostMapping("/panier/{idPanier}")
    public ResponseEntity<?> commanderDepuisPanier(@PathVariable Long idPanier) {
        try {
            Commande commande = commandeService.commanderDepuisPanier(idPanier);
            return ResponseEntity.ok(commande);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


}
