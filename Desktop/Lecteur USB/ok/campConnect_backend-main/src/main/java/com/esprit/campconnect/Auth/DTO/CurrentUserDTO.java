package com.esprit.campconnect.Auth.DTO;

import com.esprit.campconnect.User.DTO.ProfilDTO;
import com.esprit.campconnect.User.Entity.Role;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)

public class CurrentUserDTO {


    Long id;

    String nom;
    String email;
    String telephone;
    Role role;

    String adresse;
    String photo;
    String biographie;



}
