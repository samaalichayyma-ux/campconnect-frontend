package com.esprit.campconnect.Publication.service;

import com.esprit.campconnect.Publication.entity.Publication;
import java.util.List;

public interface PublicationService {
    List<Publication> getAllPublications();
    Publication getPublicationById(Long id);
    List<Publication> getByForumId(Long forumId);
    Publication createPublication(Publication publication);
    Publication updatePublication(Long id, Publication publication);
    Publication likePublication(Long id);
    Publication incrementView(Long id);
    void deletePublication(Long id);
}
