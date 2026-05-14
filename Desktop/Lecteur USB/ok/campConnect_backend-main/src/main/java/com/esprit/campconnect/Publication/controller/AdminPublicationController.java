package com.esprit.campconnect.Publication.controller;
import com.esprit.campconnect.Publication.entity.Publication;
import com.esprit.campconnect.Publication.service.PublicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/publications")
@CrossOrigin(origins = "*")
public class AdminPublicationController {

    private final PublicationService publicationService;

    public AdminPublicationController(PublicationService publicationService) {
        this.publicationService = publicationService;
    }

    @GetMapping
    public ResponseEntity<List<Publication>> getAll() {
        return ResponseEntity.ok(publicationService.getAllPublications());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Publication> getById(@PathVariable Long id) {
        return ResponseEntity.ok(publicationService.getPublicationById(id));
    }

    @PostMapping
    public ResponseEntity<Publication> create(@RequestBody Publication publication) {
        return ResponseEntity.ok(publicationService.createPublication(publication));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Publication> update(@PathVariable Long id, @RequestBody Publication publication) {
        return ResponseEntity.ok(publicationService.updatePublication(id, publication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        publicationService.deletePublication(id);
        return ResponseEntity.ok("Publication supprimée avec succès");
    }
}