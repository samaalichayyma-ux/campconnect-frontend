package com.esprit.campconnect.User.Service;

import com.esprit.campconnect.User.DTO.UtilisateurDTO;
import com.esprit.campconnect.User.Entity.Utilisateur;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")

public interface IUtilisateurDTOAuto {

    UtilisateurDTO DTOtoDTO(Utilisateur utilisateur);
}
