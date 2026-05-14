
package com.esprit.campconnect.Publication.repository;

import com.esprit.campconnect.Publication.entity.Publication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PublicationRepository extends JpaRepository<Publication, Long> {
    List<Publication> findByForum_Id(Long forumId);
    List<Publication> findByAuteurEmail(String auteurEmail);
    Optional<Publication> findById(Long id);

}
