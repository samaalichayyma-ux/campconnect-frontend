package com.esprit.campconnect.Livraison.service;

import com.esprit.campconnect.Livraison.dto.*;
import com.esprit.campconnect.Livraison.entity.LivreurTip;
import com.esprit.campconnect.Livraison.entity.LivreurWallet;
import com.esprit.campconnect.Livraison.entity.LivreurWithdraw;
import com.esprit.campconnect.User.Entity.Utilisateur;

import java.util.List;

public interface ILivraisonService {

    LivraisonResponse createLivraison(LivraisonCreateRequest request);

    LivraisonResponse assignLivreur(Long idLivraison, Long livreurId);
    public LivraisonResponse cancelLivraison(Long idLivraison);

    LivraisonResponse updateStatus(Long idLivraison, LivraisonStatusUpdateRequest request);

    List<LivraisonResponse> getMyLivraisons();

    List<LivraisonResponse> getAll();

    LivraisonStatsResponse getMyStats();

    List<AvailableOrderForLivraisonResponse> getAvailableClassicOrders();

    List<AvailableOrderForLivraisonResponse> getAvailableRepasOrders();

    List<Utilisateur> getLivreurs();

    LivraisonResponse createLivraisonAfterPayment(LivraisonCreateRequest request);

    LivreurLocationResponse updateLivreurLocation(
            Long idLivraison,
            LivreurLocationUpdateRequest request
    );

    LivreurLocationResponse getLivreurLocation(Long idLivraison);
    List<LivraisonResponse> getMyClientLivraisons();

    LivraisonResponse getLivraisonById(Long idLivraison);

    void tipLivreur(Long idLivraison, TipLivreurRequest request);
    List<LivreurTip> getTipsByLivraison(Long idLivraison);

    LivreurWallet getMyWallet();

    List<LivreurTip> getMyTips();

    List<AdminLivreurWalletResponse> getAllLivreurWallets();

    LivreurWallet markLivreurWalletAsPaid(Long livreurId);
    List<LivreurWithdraw> getMyWithdrawHistory();

}