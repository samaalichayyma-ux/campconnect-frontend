package com.esprit.campconnect.User.Service;

import com.esprit.campconnect.User.DTO.ProfilDTO;
import com.esprit.campconnect.User.Entity.Profil;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")

public interface IProfilDTOAuto {

    ProfilDTO DTOtoDTO(Profil profil);
}
