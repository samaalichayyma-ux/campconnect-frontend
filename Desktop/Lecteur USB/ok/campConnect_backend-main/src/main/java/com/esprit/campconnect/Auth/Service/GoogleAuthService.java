package com.esprit.campconnect.Auth.Service;

import com.esprit.campconnect.User.Entity.Utilisateur;

public interface GoogleAuthService {
    Utilisateur verifyGoogleUser(String credential);
}