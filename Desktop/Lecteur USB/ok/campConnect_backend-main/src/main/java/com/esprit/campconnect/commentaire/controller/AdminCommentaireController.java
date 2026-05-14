package com.esprit.campconnect.commentaire.controller;

import com.esprit.campconnect.commentaire.entity.Commentaire;
import com.esprit.campconnect.commentaire.service.CommentaireService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/commentaires")
@CrossOrigin(origins = "*")
public class AdminCommentaireController {

    private final CommentaireService commentaireService;

    public AdminCommentaireController(CommentaireService commentaireService) {
        this.commentaireService = commentaireService;
    }

    @GetMapping("/publication/{publicationId}")
    public ResponseEntity<List<Commentaire>> getByPublication(@PathVariable Long publicationId) {
        return ResponseEntity.ok(commentaireService.getByPublication(publicationId));
    }

    @PostMapping("/publication/{publicationId}")
    public ResponseEntity<Commentaire> addToPublication(@PathVariable Long publicationId,
                                                        @RequestBody Commentaire commentaire) {
        return ResponseEntity.ok(commentaireService.create(publicationId, commentaire));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Commentaire> update(@PathVariable Long id,
                                              @RequestBody Commentaire commentaire) {
        return ResponseEntity.ok(commentaireService.update(id, commentaire));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        commentaireService.delete(id);
        return ResponseEntity.ok("Commentaire supprimÃ© avec succÃ¨s");
    }
}