package com.esprit.campconnect.User.DTO;

import com.esprit.campconnect.User.Entity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminUserDTO {
    private Long id;
    private String nom;
    private String email;
    private String telephone;
    private LocalDate dateCreation;
    private Role role;
    private ProfilDTO profil;
}