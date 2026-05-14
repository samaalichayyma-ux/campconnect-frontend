
package com.esprit.campconnect.commentaire.controller;

import com.esprit.campconnect.forum.repository.ForumRepository;
import com.esprit.campconnect.commentaire.entity.Commentaire;
import com.esprit.campconnect.commentaire.service.CommentaireService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import static org.springframework.data.jpa.domain.AbstractPersistable_.id;

@RestController
@RequestMapping("/commentaires")
@CrossOrigin(origins = {"http://localhost:4200"})
public class CommentaireController {

    private final CommentaireService commentaireService;


    public CommentaireController(CommentaireService commentaireService) {
        this.commentaireService = commentaireService;
    }

    // Lire les commentaires d'une publication
    @GetMapping("/publication/{publicationId}")
    public List<Commentaire> getByPublication(@PathVariable Long publicationId) {
        return commentaireService.getByPublication(publicationId);

    }

    // N'importe quel utilisateur peut commenter
    @PostMapping("/publication/{publicationId}")
    public Commentaire create(@PathVariable Long publicationId, @RequestBody Commentaire commentaire) {
        return commentaireService.create(publicationId, commentaire);
    }

    // N'importe quel utilisateur peut liker un commentaire
    @PutMapping("/{id}/like")
    public Commentaire like(@PathVariable Long id) {
        return commentaireService.likeCommentaire(id);
    }

    // Supprimer seulement son propre commentaire
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id, @RequestParam String auteurEmail) {
        Commentaire commentaire = commentaireService.getById(id);
        if (!commentaire.getAuteurEmail().equals(auteurEmail)) {
            return ResponseEntity.status(403).body("Vous ne pouvez supprimer que vos propres commentaires.");
        }
        commentaireService.delete(id);
        return ResponseEntity.ok("Commentaire supprimé.");
    }
}

