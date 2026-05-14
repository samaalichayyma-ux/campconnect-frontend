package com.esprit.campconnect.Assurance.Controller;

import com.esprit.campconnect.Assurance.Entity.Sinistre;
import com.esprit.campconnect.Assurance.Service.AiAssuranceService;
import com.esprit.campconnect.Assurance.Service.ISinistreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/assurance-ai")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AiAssuranceController {

    private final AiAssuranceService aiAssuranceService;
    private final ISinistreService sinistreService;

    @PostMapping("/analyse-sinistre")
    public String analyserSinistre(@RequestBody Map<String, String> body) {
        String description = body.get("description");

        if (description == null || description.isBlank()) {
            throw new RuntimeException("Description obligatoire pour l'analyse IA.");
        }

        String prompt = """
                Tu es un expert assurance camping.
                Analyse cette déclaration de sinistre.
                
                Réponds uniquement en JSON valide avec ce format :
                {
                  "typeSinistre": "ACCIDENT | ANNULATION | VOL | DOMMAGE | BLESSURE | AUTRE",
                  "gravite": "FAIBLE | MOYENNE | ELEVEE",
                  "causeProbable": "...",
                  "documentsNecessaires": ["photo", "facture", "rapport"],
                  "recommandation": "..."
                }
                
                Description :
                %s
                """.formatted(description);

        return aiAssuranceService.askAi(prompt);
    }

    @PostMapping("/fraude-sinistre/{utilisateurId}")
    public String detecterFraude(@PathVariable Long utilisateurId) {
        List<Sinistre> sinistres = sinistreService.retrieveAll()
                .stream()
                .filter(s -> s.getSouscriptionAssurance() != null)
                .filter(s -> s.getSouscriptionAssurance().getUtilisateur() != null)
                .filter(s -> s.getSouscriptionAssurance().getUtilisateur().getId().equals(utilisateurId))
                .toList();

        String details = sinistres.stream()
                .map(s -> "Sinistre ID=" + s.getId()
                        + ", type=" + s.getTypeSinistre()
                        + ", montant=" + s.getMontantEstime()
                        + ", statut=" + s.getStatut()
                        + ", date=" + s.getDateDeclaration())
                .toList()
                .toString();

        String prompt = """
                Tu es un analyste anti-fraude assurance.
                Analyse le risque de fraude pour cet utilisateur.
                
                Réponds uniquement en JSON valide avec :
                {
                  "scoreFraude": 0-100,
                  "niveauRisque": "FAIBLE | MOYEN | ELEVE",
                  "raisons": ["..."],
                  "recommandationAdmin": "..."
                }
                
                Nombre de sinistres : %d
                Détails : %s
                """.formatted(sinistres.size(), details);

        return aiAssuranceService.askAi(prompt);
    }

    @PostMapping("/fraude-sinistre-by-sinistre/{sinistreId}")
    public String detecterFraudeBySinistre(@PathVariable Long sinistreId) {
        Sinistre sinistre = sinistreService.retrieveById(sinistreId);

        if (sinistre == null) {
            throw new RuntimeException("Sinistre introuvable.");
        }

        if (sinistre.getSouscriptionAssurance() == null ||
                sinistre.getSouscriptionAssurance().getUtilisateur() == null ||
                sinistre.getSouscriptionAssurance().getUtilisateur().getId() == null) {
            throw new RuntimeException("Utilisateur lié au sinistre introuvable.");
        }

        Long utilisateurId = sinistre.getSouscriptionAssurance().getUtilisateur().getId();

        List<Sinistre> sinistres = sinistreService.retrieveAll()
                .stream()
                .filter(s -> s.getSouscriptionAssurance() != null)
                .filter(s -> s.getSouscriptionAssurance().getUtilisateur() != null)
                .filter(s -> s.getSouscriptionAssurance().getUtilisateur().getId().equals(utilisateurId))
                .toList();

        String details = sinistres.stream()
                .map(s -> "Sinistre ID=" + s.getId()
                        + ", type=" + s.getTypeSinistre()
                        + ", montant=" + s.getMontantEstime()
                        + ", statut=" + s.getStatut()
                        + ", date=" + s.getDateDeclaration())
                .toList()
                .toString();

        String prompt = """
            Tu es un analyste anti-fraude assurance.
            Analyse le risque de fraude pour cet utilisateur.
            
            Réponds uniquement en JSON valide avec :
            {
              "scoreFraude": 0-100,
              "niveauRisque": "FAIBLE | MOYEN | ELEVE",
              "raisons": ["..."],
              "recommandationAdmin": "..."
            }
            
            Nombre de sinistres : %d
            Détails : %s
            """.formatted(sinistres.size(), details);

        return aiAssuranceService.askAi(prompt);
    }

    @PostMapping("/assistant")
    public String assistantAssurance(@RequestBody Map<String, String> body) {
        String question = body.get("question");

        if (question == null || question.isBlank()) {
            throw new RuntimeException("Question obligatoire.");
        }

        String prompt = """
                Tu es un assistant assurance pour CampConnect.
                Réponds en français simple et professionnel.
                Aide l'utilisateur à choisir une assurance camping.
                Ne donne pas de promesse juridique.
                
                Question utilisateur :
                %s
                """.formatted(question);

        return aiAssuranceService.askAi(prompt);
    }

    @PostMapping("/resume-sinistre/{sinistreId}")
    public String resumeSinistre(@PathVariable Long sinistreId) {
        Sinistre sinistre = sinistreService.retrieveById(sinistreId);

        String prompt = """
                Résume ce sinistre pour un admin assurance.
                Fais un résumé court, clair et professionnel.
                
                Réponds avec :
                - Résumé
                - Points importants
                - Montant demandé
                - Montant remboursable
                - Recommandation
                
                Type : %s
                Description : %s
                Lieu : %s
                Montant estimé : %.2f
                Montant remboursable : %.2f
                Statut : %s
                """.formatted(
                sinistre.getTypeSinistre(),
                sinistre.getDescription(),
                sinistre.getLieuIncident(),
                sinistre.getMontantEstime(),
                sinistre.getMontantRembourse(),
                sinistre.getStatut()
        );

        return aiAssuranceService.askAi(prompt);
    }
}