package com.esprit.campconnect.SiteCampingAvis.service;

import com.esprit.campconnect.SiteCampingAvis.dto.SiteCampingAvisAdminResponse;
import com.esprit.campconnect.SiteCampingAvis.dto.SiteCampingAvisCreateRequest;
import com.esprit.campconnect.SiteCampingAvis.dto.SiteCampingAvisResponse;
import com.esprit.campconnect.SiteCampingAvis.dto.SiteCampingAvisUpdateRequest;
import com.esprit.campconnect.SiteCampingAvis.entity.SiteCampingAvis;
import com.esprit.campconnect.SiteCampingAvis.repository.SiteCampingAvisRepository;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import com.esprit.campconnect.siteCamping.entity.SiteCamping;
import com.esprit.campconnect.siteCamping.repository.SiteCampingRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class SiteCampingAvisServiceImp implements ISiteCampingAvisService {

    private final SiteCampingAvisRepository siteCampingAvisRepository;
    private final SiteCampingRepository siteCampingRepository;
    private final UtilisateurRepository utilisateurRepository;

    private Utilisateur getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
    }

    private SiteCampingAvisResponse mapToResponse(SiteCampingAvis avis) {
        SiteCampingAvisResponse response = new SiteCampingAvisResponse();
        response.setId(avis.getId());
        response.setNote(avis.getNote());
        response.setCommentaire(avis.getCommentaire());
        response.setDateCreation(avis.getDateCreation());
        response.setSiteId(avis.getSiteCamping().getIdSite());

        if (avis.getUtilisateur() != null) {
            response.setUtilisateurId(avis.getUtilisateur().getId());
            response.setUtilisateurEmail(avis.getUtilisateur().getEmail());
        }

        return response;
    }

    private SiteCampingAvisAdminResponse mapToAdminResponse(SiteCampingAvis avis) {
        SiteCampingAvisAdminResponse response = new SiteCampingAvisAdminResponse();
        response.setId(avis.getId());
        response.setNote(avis.getNote());
        response.setCommentaire(avis.getCommentaire());
        response.setDateCreation(avis.getDateCreation());
        response.setSiteId(avis.getSiteCamping().getIdSite());
        response.setSiteNom(avis.getSiteCamping().getNom());

        if (avis.getUtilisateur() != null) {
            response.setUtilisateurId(avis.getUtilisateur().getId());
            response.setUtilisateurEmail(avis.getUtilisateur().getEmail());
        }

        return response;
    }

    @Override
    public SiteCampingAvisResponse createSiteCampingAvis(Long siteId, SiteCampingAvisCreateRequest request) {

        SiteCamping site = siteCampingRepository.findById(siteId)
                .orElseThrow(() -> new IllegalArgumentException("SiteCamping not found with id: " + siteId));

        if ((request.getNote() == null) &&
                (request.getCommentaire() == null || request.getCommentaire().isBlank())) {
            throw new IllegalArgumentException("You must provide at least a note or a commentaire");
        }

        if (request.getNote() != null) {
            if (request.getNote() < 1 || request.getNote() > 5) {
                throw new IllegalArgumentException("note must be between 1 and 5");
            }
        }

        Utilisateur currentUser = getCurrentUser();

        SiteCampingAvis avis = new SiteCampingAvis();
        avis.setNote(request.getNote());
        avis.setCommentaire(request.getCommentaire());
        avis.setSiteCamping(site);
        avis.setUtilisateur(currentUser); // ✅ important

        SiteCampingAvis saved = siteCampingAvisRepository.save(avis);

        return mapToResponse(saved);
    }

    @Override
    public SiteCampingAvisResponse patchSiteCampingAvis(Long idAvis, SiteCampingAvisUpdateRequest request) {

        SiteCampingAvis existing = siteCampingAvisRepository.findById(idAvis)
                .orElseThrow(() -> new RuntimeException("SiteCampingAvis not found with id: " + idAvis));

        Utilisateur currentUser = getCurrentUser();

        // SECURITY CHECK
        if (existing.getUtilisateur() == null ||
                !existing.getUtilisateur().getId().equals(currentUser.getId())) {

            throw new RuntimeException("You are not allowed to update this review");
        }

        // Validation
        if (request.getNote() != null) {
            if (request.getNote() < 1 || request.getNote() > 5) {
                throw new IllegalArgumentException("note must be between 1 and 5");
            }
            existing.setNote(request.getNote());
        }

        if (request.getCommentaire() != null) {
            existing.setCommentaire(request.getCommentaire());
        }

        // Ensure not empty after update
        if ((existing.getNote() == null) &&
                (existing.getCommentaire() == null || existing.getCommentaire().isBlank())) {

            throw new IllegalArgumentException("You must provide at least a note or a commentaire");
        }

        SiteCampingAvis saved = siteCampingAvisRepository.save(existing);
        return mapToResponse(saved);
    }
    @Override
    public void deleteSiteCampingAvis(Long idAvis) {
        SiteCampingAvis existing = siteCampingAvisRepository.findById(idAvis)
                .orElseThrow(() -> new RuntimeException("SiteCampingAvis not found with id: " + idAvis));

        Utilisateur currentUser = getCurrentUser();

        if (existing.getUtilisateur() == null || !existing.getUtilisateur().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You are not allowed to delete this review");
        }

        siteCampingAvisRepository.delete(existing);
    }

    @Override
    public List<SiteCampingAvisResponse> getAvisBySite(Long siteId) {
        if (!siteCampingRepository.existsById(siteId)) {
            throw new RuntimeException("SiteCamping not found with id: " + siteId);
        }

        return siteCampingAvisRepository.findBySiteCamping_IdSite(siteId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<SiteCampingAvisAdminResponse> getAllAvisForAdmin() {
        return siteCampingAvisRepository.findAll()
                .stream()
                .map(this::mapToAdminResponse)
                .toList();
    }
}