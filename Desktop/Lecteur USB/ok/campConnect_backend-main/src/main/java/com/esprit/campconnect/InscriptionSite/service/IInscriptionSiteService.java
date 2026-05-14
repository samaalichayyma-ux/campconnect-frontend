package com.esprit.campconnect.InscriptionSite.service;

import com.esprit.campconnect.InscriptionSite.dto.InscriptionSiteCreateRequest;
import com.esprit.campconnect.InscriptionSite.dto.InscriptionSiteResponse;
import com.esprit.campconnect.InscriptionSite.dto.InscriptionSiteUpdateRequest;
import com.esprit.campconnect.InscriptionSite.entity.InscriptionSite;

import java.util.List;

public interface IInscriptionSiteService {

    InscriptionSiteResponse addInscriptionSite(InscriptionSiteCreateRequest request);

    InscriptionSiteResponse patchInscriptionSite(Long idInscription, InscriptionSiteUpdateRequest request);

    InscriptionSiteResponse getInscriptionSiteById(Long idInscription);

    List<InscriptionSiteResponse> getAllInscriptionSites();

    void deleteInscriptionSite(Long idInscription);

    List<InscriptionSiteResponse> getBySiteCamping(Long idSite);

    InscriptionSiteResponse confirmInscriptionSite(Long idInscription);

    InscriptionSiteResponse cancelInscriptionSite(Long idInscription);

    List<InscriptionSiteResponse> getMyInscriptions();
}
