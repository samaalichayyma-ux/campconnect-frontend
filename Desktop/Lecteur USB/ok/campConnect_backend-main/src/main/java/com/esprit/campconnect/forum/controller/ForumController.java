package com.esprit.campconnect.forum.controller;

import com.esprit.campconnect.forum.DTO.ForumRequestDto;
import com.esprit.campconnect.forum.entity.Forum;
import com.esprit.campconnect.forum.service.ForumService;
import com.esprit.campconnect.User.Entity.Utilisateur;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/forums")

@CrossOrigin(origins = "http://localhost:4200")
public class ForumController {

    private final ForumService forumService;

    public ForumController(ForumService forumService) {
        this.forumService = forumService;
    }

    @GetMapping
    public List<Forum> getAll() {
        return forumService.getAll();
    }

    @GetMapping("/{id}")
    public Forum getById(@PathVariable Long id) {
        Forum forum = forumService.getById(id);

        // éviter boucle JSON / lazy loading
        forum.setPublications(new ArrayList<>());

        return forum;
    }

    @PostMapping
    public Forum create(@RequestBody ForumRequestDto dto, Authentication authentication) {
        Forum forum = new Forum();
        forum.setNom(dto.getNom());
        forum.setDescription(dto.getDescription());
        forum.setCategorie(dto.getCategorie());
        forum.setIcon(dto.getIcon());

        if (authentication != null && authentication.getPrincipal() instanceof Utilisateur user) {
            forum.setAuteurEmail(user.getEmail());
            forum.setAuteurNom(user.getNom());
        } else {
            forum.setAuteurEmail("anonyme@campconnect.tn");
            forum.setAuteurNom("Anonyme");
        }

        return forumService.create(forum);
    }

    @PutMapping("/{id}")
    public Forum update(@PathVariable Long id, @RequestBody ForumRequestDto dto) {
        Forum forum = new Forum();
        forum.setNom(dto.getNom());
        forum.setDescription(dto.getDescription());
        forum.setCategorie(dto.getCategorie());
        forum.setIcon(dto.getIcon());

        return forumService.update(id, forum);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        forumService.delete(id);
    }
}