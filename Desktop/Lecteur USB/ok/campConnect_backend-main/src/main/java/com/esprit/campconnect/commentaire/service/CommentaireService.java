package com.esprit.campconnect.commentaire.service;

import com.esprit.campconnect.commentaire.entity.Commentaire;
import java.util.List;

public interface CommentaireService {
    List<Commentaire> getByPublication(Long publicationId);
    Commentaire getById(Long id);
    Commentaire create(Long publicationId, Commentaire commentaire);
    Commentaire update(Long id, Commentaire commentaire);
    Commentaire likeCommentaire(Long id);
    void delete(Long id);
}
