package com.esprit.campconnect.commentaire.repository;

import com.esprit.campconnect.commentaire.entity.Commentaire;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {
    List<Commentaire> findByPublication_Id(Long publicationId);
}