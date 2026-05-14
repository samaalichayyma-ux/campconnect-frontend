package com.esprit.campconnect.Auth.Service;

import org.springframework.stereotype.Service;

@Service
public class PasswordValidatorService {

    public void validate(String password) {
        if (password == null || password.length() < 8) {
            throw new RuntimeException("Le mot de passe doit contenir au moins 8 caractères");
        }

        if (!password.matches(".*[A-Z].*")) {
            throw new RuntimeException("Le mot de passe doit contenir au moins une majuscule");
        }

        if (!password.matches(".*[a-z].*")) {
            throw new RuntimeException("Le mot de passe doit contenir au moins une minuscule");
        }

        if (!password.matches(".*\\d.*")) {
            throw new RuntimeException("Le mot de passe doit contenir au moins un chiffre");
        }

        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*")) {
            throw new RuntimeException("Le mot de passe doit contenir au moins un caractère spécial");
        }
    }
}