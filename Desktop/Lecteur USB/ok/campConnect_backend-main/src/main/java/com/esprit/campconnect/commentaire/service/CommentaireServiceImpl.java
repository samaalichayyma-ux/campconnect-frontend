package com.esprit.campconnect.commentaire.service;

import com.esprit.campconnect.Publication.entity.Publication;
import com.esprit.campconnect.Publication.repository.PublicationRepository;
import com.esprit.campconnect.commentaire.entity.Commentaire;
import com.esprit.campconnect.commentaire.repository.CommentaireRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CommentaireServiceImpl implements CommentaireService {

    private final CommentaireRepository commentaireRepository;
    private final PublicationRepository publicationRepository;

    public CommentaireServiceImpl(CommentaireRepository commentaireRepository,
                                  PublicationRepository publicationRepository) {
        this.commentaireRepository = commentaireRepository;
        this.publicationRepository = publicationRepository;
    }

    @Override
    public List<Commentaire> getByPublication(Long publicationId) {
        return commentaireRepository.findByPublication_Id(publicationId);
    }

    @Override
    public Commentaire getById(Long id) {
        return commentaireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commentaire introuvable avec id : " + id));
    }

    @Override
    public Commentaire create(Long publicationId, Commentaire commentaire) {
        Publication publication = publicationRepository.findById(publicationId)
                .orElseThrow(() -> new RuntimeException("Publication introuvable avec id : " + publicationId));
        commentaire.setPublication(publication);
        return commentaireRepository.save(commentaire);
    }

    @Override
    public Commentaire update(Long id, Commentaire commentaire) {
        Commentaire existing = getById(id);
        existing.setContenu(commentaire.getContenu());
        return commentaireRepository.save(existing);
    }

    @Override
    public Commentaire likeCommentaire(Long id) {
        Commentaire commentaire = getById(id);
        commentaire.setLikesCount(commentaire.getLikesCount() + 1);
        return commentaireRepository.save(commentaire);
    }

    @Override
    public void delete(Long id) {
        commentaireRepository.delete(getById(id));
    }
}
