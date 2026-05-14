package com.esprit.campconnect.forum.repository;

import com.esprit.campconnect.forum.entity.Forum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ForumRepository extends JpaRepository<Forum, Long> {
    List<Forum> findByCategorie(String categorie);
    List<Forum> findByNomContainingIgnoreCase(String nom);
}