package com.esprit.campconnect.SiteCampingAvis.service;

import com.esprit.campconnect.SiteCampingAvis.dto.SiteCampingAvisAdminResponse;
import com.esprit.campconnect.SiteCampingAvis.dto.SiteCampingAvisCreateRequest;
import com.esprit.campconnect.SiteCampingAvis.dto.SiteCampingAvisResponse;
import com.esprit.campconnect.SiteCampingAvis.dto.SiteCampingAvisUpdateRequest;

import java.util.List;

public interface ISiteCampingAvisService {
    SiteCampingAvisResponse createSiteCampingAvis(Long siteId, SiteCampingAvisCreateRequest request);
    SiteCampingAvisResponse patchSiteCampingAvis(Long idAvis, SiteCampingAvisUpdateRequest request);
    void deleteSiteCampingAvis(Long idAvis);
    List<SiteCampingAvisResponse> getAvisBySite(Long siteId);
    List<SiteCampingAvisAdminResponse> getAllAvisForAdmin();
}
