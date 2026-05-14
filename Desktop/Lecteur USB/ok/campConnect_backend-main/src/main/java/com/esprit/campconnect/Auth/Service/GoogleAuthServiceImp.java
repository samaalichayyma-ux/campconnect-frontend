package com.esprit.campconnect.Auth.Service;

import com.esprit.campconnect.User.Entity.Utilisateur;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class GoogleAuthServiceImp implements GoogleAuthService {

    @Value("${google.client.id}")
    private String googleClientId;

    @Override
    public Utilisateur verifyGoogleUser(String credential) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(credential);

            if (idToken == null) {
                throw new RuntimeException("Token Google invalide");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();

            Utilisateur utilisateur = new Utilisateur();
            utilisateur.setEmail(payload.getEmail());
            utilisateur.setNom((String) payload.get("name"));

            return utilisateur;

        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la vérification Google", e);
        }
    }
}