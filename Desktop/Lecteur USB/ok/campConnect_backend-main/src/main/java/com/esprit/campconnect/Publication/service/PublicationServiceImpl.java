package com.esprit.campconnect.Publication.service;

import com.esprit.campconnect.Publication.entity.Publication;
import com.esprit.campconnect.Publication.repository.PublicationRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PublicationServiceImpl implements PublicationService {

    private final PublicationRepository publicationRepository;

    public PublicationServiceImpl(PublicationRepository publicationRepository) {
        this.publicationRepository = publicationRepository;
    }

    @Override
    public List<Publication> getAllPublications() {
        return publicationRepository.findAll();
    }

    @Override
    public Publication getPublicationById(Long id) {
        return publicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Publication introuvable avec id : " + id));
    }
    @Override
    @Transactional(readOnly = true)
    public List<Publication> getByForumId(Long forumId) {
        return publicationRepository.findByForum_Id(forumId);
    }
    @Override
    public Publication createPublication(Publication publication) {
        return publicationRepository.save(publication);
    }

    @Override
    public Publication updatePublication(Long id, Publication publication) {
        Publication existing = getPublicationById(id);
        existing.setTitre(publication.getTitre());
        existing.setContenu(publication.getContenu());
        return publicationRepository.save(existing);
    }

    @Override
    public Publication likePublication(Long id) {
        Publication publication = getPublicationById(id);
        publication.setLikesCount(publication.getLikesCount() + 1);
        return publicationRepository.save(publication);
    }

    @Override
    public void deletePublication(Long id) {
        publicationRepository.delete(getPublicationById(id));
    }
    @Override
    public Publication incrementView(Long id) {
        Publication pub = getPublicationById(id);
        pub.setVuesCount(pub.getVuesCount() + 1);
        return publicationRepository.save(pub);
    }
}

