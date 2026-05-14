package com.esprit.campconnect.User.Service;

import com.esprit.campconnect.User.DTO.ProfilDTO;
import com.esprit.campconnect.User.Entity.Profil;
import com.esprit.campconnect.User.Repository.ProfilRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor

public class ProfilDTOAutoImp {
    private final ProfilRepository profilRepository;
    private final IProfilDTOAuto iProfilDTOAuto;

    public ProfilDTO getProfil(Long id) {
        Profil profil = profilRepository.findById(id).orElse(null);
        return iProfilDTOAuto.DTOtoDTO(profil);
    }

    public List<ProfilDTO> getAllProfils() {
        return profilRepository.findAll()
                .stream()
                .map(iProfilDTOAuto::DTOtoDTO)
                .toList();
    }
}
