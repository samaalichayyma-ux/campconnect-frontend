package com.esprit.campconnect.Livraison.controller;

import com.esprit.campconnect.Livraison.dto.LivreurLocationResponse;
import com.esprit.campconnect.Livraison.dto.LivreurLocationUpdateRequest;
import com.esprit.campconnect.Livraison.service.ILivraisonService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class LivraisonLocationSocketController {

    private final ILivraisonService livraisonService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/livraisons/{idLivraison}/location")
    public void updateLivreurLocationSocket(
            @DestinationVariable Long idLivraison,
            LivreurLocationUpdateRequest request
    ) {
        LivreurLocationResponse response =
                livraisonService.updateLivreurLocation(idLivraison, request);

        messagingTemplate.convertAndSend(
                "/topic/livraisons/" + idLivraison + "/location",
                response
        );
    }
}