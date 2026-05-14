package com.esprit.campconnect.forum.service;

import com.esprit.campconnect.forum.entity.Forum;
import com.esprit.campconnect.forum.repository.ForumRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ForumServiceImpl implements ForumService {

    private final ForumRepository forumRepository;

    @Override
    public List<Forum> getAll() {
        return forumRepository.findAll();
    }

    @Override
    public Forum getById(Long id) {
        return forumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Forum introuvable avec id : " + id));
    }

    @Override
    public Forum create(Forum forum) {
        return forumRepository.save(forum);
    }

    @Override
    public Forum update(Long id, Forum forum) {
        Forum existing = getById(id);
        existing.setNom(forum.getNom());
        existing.setDescription(forum.getDescription());
        existing.setCategorie(forum.getCategorie());
        existing.setIcon(forum.getIcon());
        return forumRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        Forum forum = getById(id);
        forumRepository.delete(forum);
    }

    @Override
    public List<Forum> search(String nom) {
        return forumRepository.findByNomContainingIgnoreCase(nom);
    }
}

