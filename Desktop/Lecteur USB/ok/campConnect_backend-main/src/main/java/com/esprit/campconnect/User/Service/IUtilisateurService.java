package com.esprit.campconnect.User.Service;

import com.esprit.campconnect.User.Entity.Utilisateur;

import java.util.List;

public interface IUtilisateurService {
    List<Utilisateur> retrieveAllUtilisateurs();
    Utilisateur retrieveUtilisateur(Long id);
    Utilisateur addUtilisateur(Utilisateur utilisateur);
    Utilisateur updateUtilisateur(Utilisateur utilisateur);
    void removeUtilisateur(Long id);
}
