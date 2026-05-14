package com.esprit.campconnect.MarketPlace.DetailCommande.Controller;

import com.esprit.campconnect.MarketPlace.Commande.Entity.Commande;
import com.esprit.campconnect.MarketPlace.DetailCommande.Entity.DetailCommande;
import com.esprit.campconnect.MarketPlace.DetailCommande.Service.DetailCommandeService;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.itextpdf.html2pdf.HtmlConverter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/details-commandes")
public class DetailCommandeController {

    private final DetailCommandeService detailCommandeService;

    public DetailCommandeController(DetailCommandeService detailCommandeService) {
        this.detailCommandeService = detailCommandeService;
    }

    @PostMapping
    public DetailCommande ajouterDetailCommande(@RequestBody DetailCommande detailCommande) {
        return detailCommandeService.ajouterDetailCommande(detailCommande);
    }

    @GetMapping
    public List<DetailCommande> getAll() {
        return detailCommandeService.getAllDetailsCommande();
    }

    @GetMapping("/{id}")
    public DetailCommande getById(@PathVariable Long id) {
        return detailCommandeService.getDetailCommandeById(id);
    }

    @PutMapping("/{id}")
    public String update(@PathVariable Long id, @RequestBody DetailCommande detailCommande) {
        try {
            detailCommandeService.updateDetailCommande(id, detailCommande);
            return "Détail commande modifié avec succès";
        } catch (Exception e) {
            return "Échec de la modification du détail commande";
        }
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        try {
            detailCommandeService.deleteDetailCommande(id);
            return "Détail commande supprimé avec succès";
        } catch (Exception e) {
            return "Échec de la suppression du détail commande";
        }
    }

    @GetMapping("/commande/{idCommande}")
    public List<DetailCommande> getByCommande(@PathVariable Long idCommande) {
        return detailCommandeService.getDetailsByCommande(idCommande);
    }


    @GetMapping("/commande/{idCommande}/pdf")
    public void genererPdfDetailCommande(
            @PathVariable Long idCommande,
            HttpServletResponse response
    ) throws IOException {

        List<DetailCommande> details =
                detailCommandeService.getDetailsByCommande(idCommande);

        if (details.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        DateTimeFormatter formatter =
                DateTimeFormatter.ofPattern("dd/MM/yyyy");

        Commande commande = details.get(0).getCommande();
        Utilisateur utilisateur = commande.getUtilisateur();

        String client = utilisateur != null && utilisateur.getNom() != null
                ? utilisateur.getNom()
                : utilisateur != null && utilisateur.getEmail() != null
                ? utilisateur.getEmail()
                : "Client";

        String email = utilisateur != null && utilisateur.getEmail() != null
                ? utilisateur.getEmail()
                : "-";

        String telephone = utilisateur != null
                && utilisateur.getTelephone() != null
                ? utilisateur.getTelephone()
                : "-";

        String date = commande.getDateCommande() != null
                ? commande.getDateCommande().format(formatter)
                : "-";

        String etatLivraison = commande.getEtatLivraison() != null
                ? commande.getEtatLivraison().name()
                : "EN_ATTENTE";

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

            .cards {
                width: 100%;
                margin-bottom: 25px;
            }

            .card {
                width: 48%;
                display: inline-block;
                vertical-align: top;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
                padding: 14px;
                background-color: #f8fafc;
                box-sizing: border-box;
            }

            .card.right {
                margin-left: 3%;
            }

            .card h3 {
                margin-top: 0;
                color: #0f172a;
                font-size: 16px;
            }

            .card p {
                font-size: 12px;
                margin: 7px 0;
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
                font-size: 12px;
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

            .total {
                font-weight: bold;
                color: #0f172a;
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
    """);

        html.append("<h1>Détails de la commande #")
                .append(idCommande)
                .append("</h1>");

        html.append("""
        <div class="subtitle">
            Rapport détaillé de la commande
        </div>
    """);

        html.append("""
        <div class="cards">

            <div class="card">

                <h3>Informations commande</h3>
    """);

        html.append("<p><strong>Date :</strong> ")
                .append(date)
                .append("</p>");

        html.append("<p><strong>Total :</strong> ")
                .append(commande.getTotalCommande())
                .append(" TND</p>");

        html.append("<p><strong>Livraison :</strong> ")
                .append(etatLivraison)
                .append("</p>");

        html.append("""
                <p>
                    <strong>Paiement :</strong>
                    <span class="payee">PAYEE</span>
                </p>

            </div>

            <div class="card right">

                <h3>Informations client</h3>
    """);

        html.append("<p><strong>Client :</strong> ")
                .append(client)
                .append("</p>");

        html.append("<p><strong>Email :</strong> ")
                .append(email)
                .append("</p>");

        html.append("<p><strong>Téléphone :</strong> ")
                .append(telephone)
                .append("</p>");

        html.append("""
            </div>

        </div>

        <table>

            <thead>
                <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>Prix unitaire</th>
                    <th>Taille</th>
                    <th>Pointure</th>
                    <th>Total</th>
                </tr>
            </thead>

            <tbody>
    """);

        for (DetailCommande detail : details) {

            String produit = "Produit";

            if (detail.getProduit() != null) {

                if (detail.getProduit().getNom() != null) {
                    produit = detail.getProduit().getNom();
                }
            }

            String taille = detail.getTaille() != null
                    ? detail.getTaille()
                    : "-";

            String pointure = detail.getPointure() != null
                    ? detail.getPointure().toString()
                    : "-";

            html.append("<tr>");

            html.append("<td>")
                    .append(produit)
                    .append("</td>");

            html.append("<td>")
                    .append(detail.getQuantite())
                    .append("</td>");

            html.append("<td>")
                    .append(detail.getPrixUnitaire())
                    .append(" TND</td>");

            html.append("<td>")
                    .append(taille)
                    .append("</td>");

            html.append("<td>")
                    .append(pointure)
                    .append("</td>");

            html.append("<td class='total'>")
                    .append(detail.getTotal())
                    .append(" TND</td>");

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
                "attachment; filename=details-commande-" + idCommande + ".pdf"
        );

        HtmlConverter.convertToPdf(
                html.toString(),
                response.getOutputStream()
        );
    }
}