package com.esprit.campconnect.User.Service;

import com.esprit.campconnect.User.Entity.Profil;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IProfilService {
    List<Profil> retrieveAllProfils();
    Profil retrieveProfil(Long id);
    Profil updateProfil(Profil profil);

    Profil getProfileByUserEmail(String email);
    Profil updateMyProfile(String email, Profil profil);
    Profil uploadMyProfileImage(String email, MultipartFile file);
    Profil updatePhotoUrl(String email, String photoUrl);
}