package com.esprit.campconnect.Livraison.controller;

import com.esprit.campconnect.Livraison.dto.*;
import com.esprit.campconnect.Livraison.entity.LivreurTip;
import com.esprit.campconnect.Livraison.entity.LivreurWallet;
import com.esprit.campconnect.Livraison.entity.LivreurWithdraw;
import com.esprit.campconnect.Livraison.service.ILivraisonService;
import com.esprit.campconnect.Livraison.service.LivreurTipStripeService;
import com.esprit.campconnect.User.Entity.Utilisateur;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/livraisons")
@RequiredArgsConstructor
@Tag(name = "Gestion Livraison")
public class LivraisonController {

    private final LivreurTipStripeService livreurTipStripeService;
    private final ILivraisonService livraisonService;

    @PostMapping
    public LivraisonResponse createLivraison(@RequestBody LivraisonCreateRequest request) {
        return livraisonService.createLivraison(request);
    }

    @PatchMapping("/{idLivraison}/assign-livreur")
    public LivraisonResponse assignLivreur(
            @PathVariable Long idLivraison,
            @RequestBody AssignLivreurRequest request) {
        return livraisonService.assignLivreur(idLivraison, request.getLivreurId());
    }

    @PatchMapping("/{idLivraison}/status")
    public LivraisonResponse updateStatus(
            @PathVariable Long idLivraison,
            @RequestBody LivraisonStatusUpdateRequest request) {
        return livraisonService.updateStatus(idLivraison, request);
    }

    @GetMapping("/mine")
    public List<LivraisonResponse> getMyLivraisons() {
        return livraisonService.getMyLivraisons();
    }

    @GetMapping
    public List<LivraisonResponse> getAll() {
        return livraisonService.getAll();
    }

    @GetMapping("/mine/stats")
    public LivraisonStatsResponse getMyStats() {
        return livraisonService.getMyStats();
    }

    @GetMapping("/orders/classique/available")
    public List<AvailableOrderForLivraisonResponse> getAvailableClassicOrders() {
        return livraisonService.getAvailableClassicOrders();
    }

    @GetMapping("/orders/repas/available")
    public List<AvailableOrderForLivraisonResponse> getAvailableRepasOrders() {
        return livraisonService.getAvailableRepasOrders();
    }

    @GetMapping("/livreurs")
    public List<Utilisateur> getLivreurs() {
        return livraisonService.getLivreurs();
    }

    @PatchMapping("/{idLivraison}/livreur-location")
    public LivreurLocationResponse updateLivreurLocation(
            @PathVariable Long idLivraison,
            @RequestBody LivreurLocationUpdateRequest request
    ) {
        return livraisonService.updateLivreurLocation(idLivraison, request);
    }

    @GetMapping("/{idLivraison}/livreur-location")
    public LivreurLocationResponse getLivreurLocation(@PathVariable Long idLivraison) {
        return livraisonService.getLivreurLocation(idLivraison);
    }

    @GetMapping("/client/mine")
    public List<LivraisonResponse> getMyClientLivraisons() {
        return livraisonService.getMyClientLivraisons();
    }

    @GetMapping("/{idLivraison}")
    public LivraisonResponse getLivraisonById(@PathVariable Long idLivraison) {
        return livraisonService.getLivraisonById(idLivraison);
    }

    @GetMapping("/{idLivraison}/tips")
    public List<LivreurTip> getTipsByLivraison(@PathVariable Long idLivraison) {
        return livraisonService.getTipsByLivraison(idLivraison);
    }

    @GetMapping("/livreur/wallet")
    public LivreurWallet getMyWallet() {
        return livraisonService.getMyWallet();
    }

    @GetMapping("/livreur/tips")
    public List<LivreurTip> getMyTips() {
        return livraisonService.getMyTips();
    }

    @PostMapping("/{idLivraison}/tip/create-session")
    public TipPaymentResponse createTipSession(
            @PathVariable Long idLivraison,
            @RequestBody TipLivreurRequest request
    ) {
        return livreurTipStripeService.createTipSession(idLivraison, request);
    }

    @GetMapping("/tip/success")
    public ResponseEntity<String> tipSuccess(@RequestParam("session_id") String sessionId) {
        livreurTipStripeService.handleTipPaymentSuccess(sessionId);
        return ResponseEntity.ok("Tip payment confirmed successfully");
    }

    @GetMapping("/tip/cancel")
    public ResponseEntity<String> tipCancel() {
        return ResponseEntity.ok("Tip payment cancelled");
    }

    @PatchMapping("/{idLivraison}/cancel")
    public LivraisonResponse cancelLivraison(@PathVariable Long idLivraison) {
        return livraisonService.cancelLivraison(idLivraison);
    }

    @GetMapping("/admin/livreur-wallets")
    public List<AdminLivreurWalletResponse> getAllLivreurWallets() {
        return livraisonService.getAllLivreurWallets();
    }

    @PatchMapping("/admin/livreurs/{livreurId}/wallet/pay")
    public LivreurWallet markLivreurWalletAsPaid(@PathVariable Long livreurId) {
        return livraisonService.markLivreurWalletAsPaid(livreurId);
    }

    @GetMapping("/livreur/withdraw-history")
    public List<LivreurWithdraw> getMyWithdrawHistory() {
        return livraisonService.getMyWithdrawHistory();
    }
}