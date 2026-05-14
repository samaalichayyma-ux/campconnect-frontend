package com.esprit.campconnect.Publication.controller;

import com.esprit.campconnect.Publication.service.PublicationService;
import com.esprit.campconnect.forum.entity.Forum;
import com.esprit.campconnect.forum.repository.ForumRepository;
import com.esprit.campconnect.Publication.entity.Publication;
import com.esprit.campconnect.Publication.repository.PublicationRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/publications")
@Transactional(readOnly = true) // 🔥 IMPORTANT
@CrossOrigin(origins = "http://localhost:4200")
public class PublicationController {

    private final PublicationRepository publicationRepository;
    private final ForumRepository forumRepository;
    private final PublicationService publicationService; // ✅ AJOUT

    public PublicationController(PublicationRepository publicationRepository,
                                 ForumRepository forumRepository,
                                 PublicationService publicationService) {
        this.publicationRepository = publicationRepository;
        this.forumRepository = forumRepository;
        this.publicationService = publicationService; // ✅ AJOUT
    }

    @GetMapping("/forum/{forumId}")
    public List<Publication> getByForum(@PathVariable Long forumId) {
        return publicationService.getByForumId(forumId);
    }
    @PostMapping
    public Publication create(@RequestBody Publication publication) {

        System.out.println("Publication reçue = " + publication.getTitre());

        if (publication.getForum() == null || publication.getForum().getId() == null) {
            throw new RuntimeException("Forum ID manquant !");
        }

        Forum forum = forumRepository.findById(publication.getForum().getId())
                .orElseThrow(() -> new RuntimeException("Forum introuvable"));

        publication.setForum(forum);

        return publicationRepository.save(publication);
    }
    @PutMapping("/{id}/like")
    public Publication likePublication(@PathVariable Long id) {
        Publication publication = publicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Publication introuvable"));

        publication.setLikesCount(publication.getLikesCount() + 1);
        return publicationRepository.save(publication);
    }

    @PutMapping("/{id}/view")
    public Publication incrementView(@PathVariable Long id) {
        Publication publication = publicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Publication introuvable"));

        publication.setVuesCount(publication.getVuesCount() + 1);
        return publicationRepository.save(publication);
    }

    @GetMapping
    public List<Publication> getAll() {
        return publicationService.getAllPublications();
    }
}
